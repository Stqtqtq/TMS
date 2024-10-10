import express from "express"
import mysql from "mysql2/promise"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"

import routes from "./src/routes/routes.js"

dotenv.config()

const port = 5000
const app = express()

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

app.use((req, res, next) => {
  req.db = db
  next()
})

app.use(routes)

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})

const handleDBShutdown = async signal => {
  console.log(`Received ${signal}. Shutting down gracefully...`)
  try {
    await db.end()
  } catch (error) {
    console.error("Error closing MySQL connection:", error)
  } finally {
    process.exit(0)
  }
}

process.on("SIGINT", () => handleDBShutdown("SIGINT"))
process.on("SIGTERM", () => handleDBShutdown("SIGTERM"))
