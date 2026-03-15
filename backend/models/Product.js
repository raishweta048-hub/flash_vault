const mongoose = require("mongoose")

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  description: {
    type: String
  },

  stock: {
    type: Number,
    default: 0
  },

  saleStart: {
    type: Date
  },

  saleEnd: {
    type: Date
  }
})

module.exports = mongoose.model("Product", ProductSchema)
