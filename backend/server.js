const express = require("express")
const dotenv = require("dotenv")
const connectDB = require("./config/db")
const rateLimit = require("express-rate-limit")
const cors = require("cors")

dotenv.config()

const app = express()



connectDB()


app.use(cors())

app.use(express.json())

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many requests, please try again later."
})

app.use(limiter)

const productRoutes = require("./routes/productRoutes")

app.use("/api/products", productRoutes)

const errorHandler = require("./middleware/errorHandler")
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
