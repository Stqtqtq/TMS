import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

// try {
//   const [results, fields] = await connection.query(`SELECT * FROM accounts`)

//   console.log(results) // results contains rows returned by server
//   console.log(fields) // fields contains extra meta data about results, if available
// } catch (err) {
//   console.log(err)
// }

try {
  const [rows] = await connection.query(`SELECT * FROM accounts`)
  rows.forEach(row => {
    console.log(row.username)
  })
} catch (err) {
  console.log(err)
}

connection.close()
