const Order = require("../models/order")
const { acquireLock, releaseLock } = require("../utils/purchaseLock")
const Product = require("../models/Product");

// create product
exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.buyProduct = async (req, res) => {

  await acquireLock()

  try {

    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    const now = new Date()

    if (product.saleStart && now < product.saleStart) {
      return res.status(400).json({ message: "Sale has not started yet" })
    }

    if (product.saleEnd && now > product.saleEnd) {
      return res.status(400).json({ message: "Sale has ended" })
    }

    if (product.stock <= 0) {
      return res.status(400).json({ message: "Product sold out" })
    }

    product.stock -= 1
    await product.save()

    // create order
    await Order.create({
      productId: product._id,
      userId: "guest_user"
    })

    res.json({
      message: "Purchase successful",
      remainingStock: product.stock
    })

  } catch (error) {

    res.status(500).json({ message: error.message })

  } finally {

    releaseLock()

  }
} 
