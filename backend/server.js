import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

import routes from "./routes/routes.js"

// dotenv.config()

const port = 5000
const app = express()

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

app.use(routes)

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
