import dotenv from "dotenv"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

dotenv.config()

export const login = async (req, res) => {
  const { username, password } = req.body
  const ipAddr = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress
  const browserInfo = req.headers["user-agent"]

  try {
    const [rows] = await req.db.query("SELECT * FROM accounts WHERE username = ?", [username])

    if (rows.length === 0) {
      return res.status(401).json("Invalid username or password")
    }

    const user = rows[0]

    if (user.isActive !== 1) {
      return res.status(401).json("Account is inactive. Please contact an administrator.")
    }
    const isMatch = await bcrypt.compare(password, user.password)

    if (isMatch) {
      const token = jwt.sign(
        {
          username: user.username,
          ipAddress: ipAddr,
          browser: browserInfo
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1h" }
      )

      res.cookie("token", token, {
        maxAge: 60 * 60 * 1000,
        httpOnly: true
      })

      res.json({ username: user.username, ipAddr, browserInfo, token, message: "Login successful" })
    } else {
      res.status(401).json("Invalid username or password")
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
}

export const logout = async (req, res) => {
  res.clearCookie("token")
  res.status(200).json({ message: "Logout successful" })
}

export const landing = async (req, res) => {
  try {
    res.json({ isAuthenticated: true, isAdmin: req.isAdmin, username: req.user.username })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
}
