import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

import routes from "./routes/routes.js"
import api_routes from "./routes/api_routes.js"

// dotenv.config()

const port = 3000
const app = express()

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

/*
Be careful of sequencing here. 
Only include the url check of "A001" in the last route file based on sequence
Else, should use different base path for each route, eg:

app.use('/', routes)
app.use('/api', api_routes)

*/
app.use(api_routes)
app.use(routes)

app.use((req, res) => {
  res.json({ code: "A001" })
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
