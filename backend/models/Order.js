const mongoose = require("mongoose")

const OrderSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },

  userId: String,

  status: {
    type: String,
    default: "success"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model("Order", OrderSchema)
