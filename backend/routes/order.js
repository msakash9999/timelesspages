const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const Book = require("../models/Book");
const { sendEmail } = require("../utils/mailer");

module.exports = function (app, requireUser) {
  const router = express.Router();

  // 1. Create COD Order
  router.post("/create", requireUser, async (req, res) => {
    try {
      const { products, totalAmount, address } = req.body;
      const userId = req.userSession.userId;

      if (!products || products.length === 0) {
        return res.status(400).json({ message: "No products in order" });
      }

      // Ensure field consistency for images
      const normalizedProducts = products.map(item => ({
        ...item,
        image: item.image || item.imageUrl,
        imageUrl: item.imageUrl || item.image
      }));

      if (!address || !address.addressLine || !address.city || !address.pincode) {
        return res.status(400).json({ message: "Complete address is required" });
      }

      // Create the order
      const newOrder = new Order({
        userId,
        products: normalizedProducts,
        totalAmount,
        paymentMethod: "COD",
        paymentStatus: "Pending",
        orderStatus: "Confirmed",
        address
      });

      await newOrder.save();

      // Deduct stock and increase soldCount
      for (const item of normalizedProducts) {
        if (item.bookId && mongoose.Types.ObjectId.isValid(item.bookId)) {
          const book = await Book.findById(item.bookId);
          if (book) {
            const currentStock = book.stockQuantity || 10;
            book.stockQuantity = Math.max(0, currentStock - (item.qty || 1));
            book.soldCount = (book.soldCount || 0) + (item.qty || 1);
            if (book.stockQuantity < 5) {
              book.lowStockAlert = true;
              // Admin alert could go here
            }
            await book.save();
          }
        } else if (item.title) {
          const book = await Book.findOne({ title: item.title });
          if (book) {
            const currentStock = book.stockQuantity || 10;
            book.stockQuantity = Math.max(0, currentStock - (item.qty || 1));
            book.soldCount = (book.soldCount || 0) + (item.qty || 1);
            if (book.stockQuantity < 5) {
              book.lowStockAlert = true;
            }
            await book.save();
          }
        }
      }

      // OPTIONAL: Update user's addresses if this is a new one or they don't have any
      const user = await User.findById(userId);
      if (user) {
        const addressExists = user.addresses?.some(
          (a) => a.addressLine === address.addressLine && a.pincode === address.pincode
        );
        if (!addressExists) {
          if (!user.addresses) user.addresses = [];
          user.addresses.push({ ...address, isDefault: user.addresses.length === 0 });
          await user.save();
        }
      }

      // Send confirmation email to User
      const orderItemsHtml = normalizedProducts.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title} x${item.qty}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price * item.qty}</td>
        </tr>
      `).join('');

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
          <h2 style="color: #8B7355; text-align: center;">Order Confirmed! (COD)</h2>
          <p>Hi ${user ? user.name : 'Valued Customer'},</p>
          <p>Your order has been successfully placed via Cash on Delivery.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8f8f8;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${orderItemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding: 10px; font-weight: bold; text-align: right;">Total Amount:</td>
                <td style="padding: 10px; font-weight: bold; text-align: right; color: #8B7355;">₹${totalAmount}</td>
              </tr>
            </tfoot>
          </table>
          <p><strong>Delivery Address:</strong><br>
          ${address.fullName}<br>
          ${address.addressLine}<br>
          ${address.city}, ${address.state} - ${address.pincode}<br>
          Phone: ${address.phone}</p>
          <p>Payment Method: Cash on Delivery</p>
          <p>Message: Your order has been successfully placed</p>
          <p style="color: #777; font-size: 12px; text-align: center; margin-top: 30px;">© 2026 TimelessPages</p>
        </div>
      `;

      // Send confirmation emails in try/catch to prevent order loss on mail failure
      try {
        console.log("[Order] Sending order confirmation emails");
        // Email to User
        await sendEmail(user.email, "Order Confirmation (Cash on Delivery) - TimelessPages", emailHtml);

        // Email to Admin
        const adminEmail = process.env.EMAIL_USER || "admin@timelesspages.com";
        await sendEmail(adminEmail, `New COD Order #${newOrder._id}`, `
          <h3>New COD Order Received</h3>
          <p>Order ID: ${newOrder._id}</p>
          <p>Customer: ${user ? user.name : 'Unknown'} (${user ? user.email : 'N/A'})</p>
          <p>Total: ₹${totalAmount}</p>
          <p>Address: ${address.addressLine}, ${address.city}</p>
        `);
      } catch (mailErr) {
        console.error("Mail dispatch failed, but order was saved:", mailErr);
      }

      res.status(201).json({
        success: true,
        message: "Order placed successfully via Cash on Delivery",
        orderId: newOrder._id
      });
    } catch (err) {
      console.error("COD Order Error:", err);
      res.status(500).json({
        message: "Failed to place order"
      });
    }
  });

  // 2. Fetch User Orders
  router.get("/my-orders", requireUser, async (req, res) => {
    try {
      const userId = req.userSession.userId;
      console.log("[Order] Fetching orders");
      let orders = await Order.find({ userId }).sort({ createdAt: -1 });

      // Auto-update status based on time
      const now = Date.now();
      orders = orders.map(order => {
        if (order.orderStatus !== "CANCELLED" && order.orderStatus !== "Delivered") {
          const hoursPassed = (now - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
          let newStatus = order.orderStatus;
          if (hoursPassed >= 120) newStatus = "Delivered";
          else if (hoursPassed >= 96) newStatus = "Out For Delivery";
          else if (hoursPassed >= 72) newStatus = "In Transit";
          else if (hoursPassed >= 48) newStatus = "Shipped";
          else if (hoursPassed >= 24) newStatus = "Packed";
          else newStatus = "In Progress";

          order.orderStatus = newStatus;
          // We could save it to DB, but requirement says "Do NOT manually update."
          // So we compute dynamically on fetch.
        }
        return order;
      });

      res.json(orders);
    } catch (err) {
      console.error("Fetch Orders Error:", err);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // 3. Cancel Order
  router.post("/cancel/:id", requireUser, async (req, res) => {
    try {
      const orderId = req.params.id;
      const { reason } = req.body;
      const userId = req.userSession.userId;

      const order = await Order.findOne({ _id: orderId, userId });
      if (!order) return res.status(404).json({ message: "Order not found" });

      if (order.orderStatus === "Out For Delivery" || order.orderStatus === "Delivered" || order.orderStatus === "CANCELLED") {
        return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
      }

      order.orderStatus = "CANCELLED";
      order.cancelReason = reason || "No reason provided";
      order.cancelledAt = new Date();
      await order.save();

      // Update user cancel count and check limit
      const user = await User.findById(userId);
      if (user) {
        user.cancelCount = (user.cancelCount || 0) + 1;
        if (user.cancelCount >= 3 || (user.returnCount || 0) >= 3) {
          user.advancePaymentRequired = true;
        }
        await user.save();
      }

      // Restore stock
      for (const item of order.products) {
        let book;
        if (item.bookId) book = await Book.findById(item.bookId);
        else if (item.title) book = await Book.findOne({ title: item.title });

        if (book) {
          book.stockQuantity += item.qty;
          book.soldCount = Math.max(0, book.soldCount - item.qty);
          if (book.stockQuantity >= 5) book.lowStockAlert = false;
          await book.save();
        }
      }

      res.json({ success: true, message: "Order cancelled successfully" });
    } catch (err) {
      console.error("Cancel Order Error:", err);
      res.status(500).json({ message: "Failed to cancel order" });
    }
  });

  // 4. Return Order
  router.post("/return/:id", requireUser, async (req, res) => {
    try {
      const orderId = req.params.id;
      const { reason, customReason } = req.body;
      const userId = req.userSession.userId;

      const order = await Order.findOne({ _id: orderId, userId });
      if (!order) return res.status(404).json({ message: "Order not found" });

      // Needs to be dynamically calculated or actually Delivered
      const hoursPassed = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
      const isDelivered = order.orderStatus === "Delivered" || hoursPassed >= 120;

      if (!isDelivered) {
        return res.status(400).json({ message: "Order must be delivered before returning" });
      }

      const deliveredDate = new Date(order.createdAt.getTime() + 120 * 60 * 60 * 1000);
      const daysSinceDelivered = (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceDelivered > 7) {
        return res.status(400).json({ message: "Return period of 7 days has expired" });
      }

      order.returnStatus = "Return Requested";
      order.returnReason = reason === "Other" ? customReason : reason;
      order.returnedAt = new Date();
      await order.save();

      const user = await User.findById(userId);
      if (user) {
        user.returnCount = (user.returnCount || 0) + 1;
        if (user.returnCount >= 3 || (user.cancelCount || 0) >= 3) {
          user.advancePaymentRequired = true;
        }
        await user.save();
      }

      res.json({ success: true, message: "Return request submitted" });
    } catch (err) {
      console.error("Return Order Error:", err);
      res.status(500).json({ message: "Failed to submit return request" });
    }
  });

  return router;
};
