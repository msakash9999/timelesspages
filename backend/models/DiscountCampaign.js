const mongoose = require("mongoose");

const discountCampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["book", "category", "global"],
      required: true
    },
    targetBookIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book"
      }
    ],
    targetCategories: {
      type: [String],
      default: []
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    enabled: {
      type: Boolean,
      default: true
    },
    featuredSale: {
      type: Boolean,
      default: false
    },
    festivalSale: {
      type: Boolean,
      default: false
    },
    flashSale: {
      type: Boolean,
      default: false
    },
    saleLabel: {
      type: String,
      default: ""
    },
    updatedBy: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("DiscountCampaign", discountCampaignSchema);
