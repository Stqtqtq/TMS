import express from "express"
import mysql from "mysql2/promise"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
// import cookieSession from "cookie-session"

import routes from "./src/routes/routes.js"

dotenv.config()

const port = 5000
const app = express()

const corsOptions = {
  origin: "http://localhost:5173", // Allow only your React app
  credentials: true // Allow credentials to be included
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())
// app.use(
//   cookieSession({
//     name: "session",
//     secret: process.env.SESSION_SECRET,

//     // Cookie Options
//     maxAge: 1 * 60 * 60 * 1000
//   })
// )

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
