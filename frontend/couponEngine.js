/* couponEngine.js */

const CouponEngine = {
    appliedCoupon: null,

    /**
     * Applies a coupon code to the current cart.
     * @param {string} code - The coupon code.
     * @param {number} subtotal - The current cart subtotal.
     * @returns {Object} - Result of application { success: boolean, discount: number, message: string }
     */
    applyCoupon: async function(code, subtotal) {
        try {
            const token = localStorage.getItem('timelessPagesUserToken') || (window.TimelessPagesUserPersistence && window.TimelessPagesUserPersistence.getCurrentUserToken());
            const apiBase = localStorage.getItem('timelessPagesApiBaseUrl') || "http://localhost:5000";
            
            const res = await fetch(`${apiBase}/api/coupons/apply`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code })
            });
            
            const data = await res.json();
            
            if (res.ok && data.success) {
                const discount = Math.round(subtotal * (data.discountPercent / 100));
                this.appliedCoupon = { code, discount, percent: data.discountPercent };
                return { 
                    success: true, 
                    discount: discount, 
                    message: data.message || `${code} Applied!` 
                };
            } else {
                return { success: false, message: data.message || "Invalid coupon code." };
            }
        } catch (err) {
            console.error("Coupon Application Error:", err);
            return { success: false, message: "Error applying coupon. Try again." };
        }
    },

    removeCoupon: function() {
        this.appliedCoupon = null;
    },

    getDiscount: function(subtotal) {
        if (!this.appliedCoupon) return 0;
        return Math.round(subtotal * (this.appliedCoupon.percent / 100));
    },

    /**
     * Injects the coupon UI into the cart drawer or checkout page.
     */
    injectUI: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container || container.querySelector('.coupon-section')) return;

        const uiHtml = `
            <div class="coupon-section" style="margin-top:20px; padding:15px; background:#fdfaf7; border-radius:10px; border:1px dashed #8B7355;">
                <label style="display:block; font-size:12px; font-weight:700; color:#8B7355; margin-bottom:8px;">HAVE A COUPON?</label>
                <div style="display:flex; gap:8px;">
                    <input type="text" id="couponInput" placeholder="Enter Code" style="flex:1; padding:8px 12px; border:1px solid #ddd; border-radius:6px; font-size:13px; text-transform:uppercase;">
                    <button id="applyCouponBtn" style="padding:8px 15px; background:#8B7355; color:#fff; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Apply</button>
                </div>
                <div id="couponMessage" style="margin-top:8px; font-size:12px;"></div>
            </div>
        `;
        container.insertAdjacentHTML('afterbegin', uiHtml);

        document.getElementById('applyCouponBtn').onclick = async () => {
            const input = document.getElementById('couponInput');
            const msg = document.getElementById('couponMessage');
            
            // Get subtotal from UI or global state
            const subtotalText = document.getElementById('cd-total-price')?.textContent || "₹0";
            const subtotal = parseInt(subtotalText.replace(/[^0-9]/g, '')) || 0;

            const result = await this.applyCoupon(input.value, subtotal);
            
            if (result.success) {
                msg.style.color = "#27ae60";
                msg.textContent = result.message;
                input.disabled = true;
                document.getElementById('applyCouponBtn').style.display = 'none';
                
                // Update total in UI
                this.updateTotalUI(subtotal, result.discount);
            } else {
                msg.style.color = "#e74c3c";
                msg.textContent = result.message;
            }
        };
    },

    updateTotalUI: function(subtotal, discount) {
        const totalEl = document.getElementById('cd-total-price');
        if (totalEl) {
            const final = subtotal - discount;
            totalEl.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:flex-end;">
                    <span style="font-size:12px; color:#777; text-decoration:line-through;">₹${subtotal}</span>
                    <span style="font-size:12px; color:#27ae60;">-₹${discount} (Coupon)</span>
                    <span style="font-size:18px; color:#8B7355; font-weight:800;">₹${final}</span>
                </div>
            `;
        }
    }
};

window.CouponEngine = CouponEngine;
