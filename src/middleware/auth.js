import jwt from "jsonwebtoken"

export const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET_KEY)

    // Check if the user is still active
    const [rows] = await req.db.query("SELECT is_active FROM accounts WHERE username = ?", [user.username])
    if (rows.length === 0 || rows[0].is_active === 0) {
      res.clearCookie("token")
      return res.status(403).json({ message: "Account is inactive", inactiveAccount: true })
    }

    req.user = user
    next()
  } catch (error) {
    console.error("Error in authentication:", error)
    return res.status(403).json({ message: "Forbidden" })
  }
}

export const checkIsAdmin = async (req, res, next) => {
  const username = req.user.username

  try {
    const [rows] = await req.db.query("SELECT * FROM user_groups WHERE username = ? AND groupname = 'admin'", [username])

    if (rows.length === 0) {
      return res.status(403).json({ message: "Access denied: Admins only." })
    }
    next()
  } catch (err) {
    console.error("Error checking admin status:", err)
    return res.status(500).send("Server error")
  }
}
