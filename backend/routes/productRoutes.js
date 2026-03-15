const express = require("express")
const router = express.Router()

const {
  createProduct,
  getProducts,
  buyProduct
} = require("../controllers/productController")

router.post("/add", createProduct)

router.get("/", getProducts)

// BUY PRODUCT
router.post("/buy/:id", buyProduct)

module.exports = router
