import express from "express"
import mysql from "mysql2/promise"
import dotenv from "dotenv"
import cors from "cors"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser"
import cookieSession from "cookie-session"

dotenv.config()

const port = 5000
const app = express()

const usernameRegex = /^[a-zA-Z0-9]+$/
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z0-9!@#$%^&*()_+={}|[\]\\:;"'<>,.?/~`-]{8,10}$/
const emailRegex = /^[a-zA-Z0-9!@#$%^&*()_+={}|[\]\\:;"'<>,.?/~`-]+@[a-zA-Z1-9]+\.[a-zA-Z]{2,}$/
const groupnameRegex = /^[a-zA-Z0-9_]{2,10}$/

const corsOptions = {
  origin: "http://localhost:5173", // Allow only your React app
  credentials: true // Allow credentials to be included
}

// app.set("trust proxy", true)

app.use(cors(corsOptions))
// app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())
app.use(
  cookieSession({
    name: "session",
    secret: process.env.SESSION_SECRET,

    // Cookie Options
    maxAge: 1 * 60 * 60 * 1000
  })
)

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET_KEY)

    // Check if the user is still active
    const [rows] = await db.query("SELECT is_active FROM accounts WHERE username = ?", [user.username])
    if (rows.length === 0 || rows[0].is_active === 0) {
      res.clearCookie("token")
      return res.status(403).json({ message: "Account is inactive" })
    }

    req.user = user
    next()
  } catch (error) {
    console.error("Error in authentication:", error)
    return res.status(403).json({ message: "Forbidden" })
  }
}

const checkIsAdmin = async (req, res, next) => {
  const username = req.user.username

  try {
    const [rows] = await db.query("SELECT * FROM user_groups WHERE username = ? AND groupname = 'admin'", [username])

    if (rows.length === 0) {
      return res.status(403).json({ message: "Access denied: Admins only." })
    }
    next()
  } catch (err) {
    console.error("Error checking admin status:", err)
    return res.status(500).send("Server error")
  }
}

app.post("/login", async (req, res) => {
  const { username, password } = req.body
  const ipAddr = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress
  const browserInfo = req.headers["user-agent"]

  try {
    const [rows] = await db.query("SELECT * FROM accounts WHERE username = ?", [username])

    if (rows.length === 0) {
      return res.status(401).json("Invalid username or password")
    }

    const user = rows[0]

    if (user.is_active !== 1) {
      return res.status(403).json("Account is inactive. Please contact an administrator.")
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
        { expiresIn: "15m" }
      )

      res.cookie("token", token, {
        maxAge: 15 * 60 * 1000,
        httpOnly: true
        // sameSite: "strict"
      })

      res.json({ username: user.username, ipAddr, browserInfo, token, message: "Login successful" })
    } else {
      res.status(401).send("Invalid username or password")
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/logout", async (req, res) => {
  res.clearCookie("token")
  res.status(200).json({ message: "Logout successful" })
})

app.get("/checkAuth", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM user_groups WHERE username = ? AND groupname = 'admin'", [req.user.username])
    const isAdmin = rows.length > 0
    res.json({ isAuthenticated: true, isAdmin, username: req.user.username })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

// NOT USED
app.get("getAppsInfo", authenticateToken, async (req, res) => {
  try {
    const currUser = req.user.username

    const qCurrUser = `SELECT * FROM accounts WHERE username = ?`
    const qCurrUserGrp = `SELECT GROUP_CONCAT(groupname) as groups FROM user_groups WHERE username = ?`

    const [currUserRows] = await db.query(qCurrUser, [currUser])
    const [currUserGrpRows] = await db.query(qCurrUserGrp, [currUser])

    const currentUserDetails = (currUserRows.groups = currUserGrpRows.groups)

    res.json({ currentUser: currentUserDetails, token: req.token })
  } catch (err) {
    console.error("Something went wrong fetch Apps data!", err)
  }
})

app.get("/getUsersInfo", authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user.username

    const qAcc = `SELECT * FROM accounts`
    const qDistGrp = `SELECT distinct(groupname) FROM user_groups`
    const qGrpList = `SELECT groupname, username FROM user_groups`

    const [accRows] = await db.query(qAcc)
    const [grpRows] = await db.query(qGrpList)
    const [distGrpRows] = await db.query(qDistGrp)

    // Create a mapping of usernames to their groups
    const groupMap = {}
    grpRows.forEach(({ groupname, username }) => {
      if (username) {
        if (!groupMap[username]) {
          groupMap[username] = []
        }
        groupMap[username].push(groupname)
      }
    })

    const userWithGrps = accRows.map(user => {
      const userGrps = groupMap[user.username] || [] // Get groups or an empty array if none exist
      return {
        ...user,
        groups: userGrps
      }
    })

    const currentUserDetails = userWithGrps.find(user => user.username === currentUser)

    res.json({ currentUser: currentUserDetails, users: userWithGrps, groups: distGrpRows, token: req.token })
  } catch (err) {
    console.error("Error querying the database: ", err)
    res.status(500).send("Server error")
  }
})

app.post("/createUser", authenticateToken, checkIsAdmin, async (req, res) => {
  const { username, password, email, groups, is_active } = req.body
  const hash = await bcrypt.hash(password, 10)

  const isValidUsername = usernameRegex.test(username)
  const isValidPw = passwordRegex.test(password)
  const isValidEmail = emailRegex.test(email)

  if (!isValidUsername) {
    return res.status(400).json({ message: "Invalid username. It must be alphanumeric." })
  }
  if (!isValidPw) {
    return res.status(400).json({ message: "Invalid password. It must be 8-10 characters long, alphanumeric, and may include special characters." })
  }
  if (!isValidEmail) {
    return res.status(400).json({ message: "Invalid email format." })
  }

  try {
    // Check if the username already exists
    const [existingUser] = await db.query(`SELECT * FROM accounts WHERE username = ?`, [username])

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Username already exists." })
    }

    // Insert the new user
    const qAddUser = `INSERT INTO accounts (username, password, email, is_active) VALUES (?, ?, ?, ?)`
    const [resultAddUser] = await db.query(qAddUser, [username, hash, email, is_active])
    if (resultAddUser.affectedRows === 0) {
      return res.status(500).json({ message: "User creation failed, please try again." })
    }

    // Insert each group into user_groups
    if (groups && groups.length > 0) {
      const qAddUserGrp = `INSERT INTO user_groups (groupname, username) VALUES (?, ?)`
      for (const group of groups) {
        await db.query(qAddUserGrp, [group, username])
      }
    }

    return res.status(201).json({ message: "User created successfully.", result: resultAddUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "An error occurred while creating the user." })
  }
})

app.post("/createGrp", authenticateToken, checkIsAdmin, async (req, res) => {
  const { groupname } = req.body

  const isValidGroupname = groupnameRegex.test(groupname)

  if (!isValidGroupname) {
    return res.status(400).json({ message: "Invalid Groupname. It must be 2-10 characters long." })
  }

  try {
    // Check if the username already exists
    const [existingGrp] = await db.query(`SELECT * FROM user_groups WHERE groupname = ?`, [groupname])

    if (existingGrp.length > 0) {
      return res.status(400).json({ message: "Group already exists." })
    }

    const query = `INSERT INTO user_groups ( groupname ) VALUES (?)`

    const [result, fields] = await db.query(query, [groupname])

    res.status(201).json({ message: "Group created successfully.", result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "An error occurred while creating the group." })
  }
})

app.put("/update", authenticateToken, checkIsAdmin, async (req, res) => {
  const { username, password, email, groups, is_active } = req.body

  const isValidUsername = usernameRegex.test(username)
  const isValidEmail = emailRegex.test(email)

  if (!isValidUsername) {
    return res.status(400).json({ message: "Invalid username. It must be alphanumeric." })
  }

  if (!isValidEmail) {
    return res.status(400).json({ message: "Invalid email format." })
  }

  try {
    // Update query string
    let qAccUpdate = `UPDATE accounts SET email = ?, is_active = ?`
    const qParams = [email, is_active]

    // Only update password if it is provided
    if (password) {
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: "Invalid password. It must be 8-10 characters long, alphanumeric, and may include special characters." })
      }
      const hash = await bcrypt.hash(password, 10)
      qAccUpdate += `, password = ?`
      qParams.push(hash)
    }

    qAccUpdate += ` WHERE username = ?`
    qParams.push(username) // Add username at the end for the WHERE clause

    const qCheckExistingGrp = `SELECT groupname FROM user_groups WHERE username = ?`
    const qGrpInsert = `INSERT INTO user_groups (groupname, username) VALUES (?, ?)`
    const qGrpDelete = `DELETE FROM user_groups WHERE username = ? AND groupname NOT IN (?)`
    const qDeleteAll = `DELETE FROM user_groups WHERE username = ?`

    // Update account information
    const [resultAcc] = await db.query(qAccUpdate, qParams)

    // Get the existing groups for the username
    const [existingGroups] = await db.query(qCheckExistingGrp, [username])
    const existingGroupNames = existingGroups.map(group => group.groupname)

    // Insert new groups that don't exist
    for (const group of groups) {
      if (!existingGroupNames.includes(group)) {
        await db.query(qGrpInsert, [group, username])
      }
    }

    // Handle deletion of groups
    if (groups.length > 0) {
      // Delete groups that are no longer associated with the username
      await db.query(qGrpDelete, [username, groups])
    } else {
      // If no groups are provided, delete all groups for the username
      await db.query(qDeleteAll, [username])
    }

    res.json({ message: "User updated successfully.", accUpdateResult: resultAcc })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "An error occurred while updating the user." })
  }
})

app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const query = `SELECT * FROM accounts WHERE username = ?`
    const [rows] = await db.query(query, [req.user.username])

    if (rows.length > 0) {
      const user = rows[0]
      res.json({ username: user.username, email: user.email })
    } else {
      res.status(404).send("User not found.")
    }
  } catch (err) {
    console.error("Error querying the database: ", err)
    res.status(500).send("Server error")
  }
})

app.put("/updateEmail", authenticateToken, async (req, res) => {
  const { email } = req.body
  const username = req.user.username

  const isValidEmail = emailRegex.test(email)

  if (!isValidEmail) {
    return res.status(400).json({ message: "Invalid Email format. " })
  }

  try {
    const qUpdateEmail = `UPDATE accounts SET email = ? WHERE username = ?`
    const [result] = await db.query(qUpdateEmail, [email, username])

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "User not found." })
    }

    res.json({ message: "Email updated successfully.", result })
  } catch (err) {
    console.error("Error updating email", err)
    res.status(500).json({ message: "An error occured while updating the email." })
  }
})

app.put("/updatePw", authenticateToken, async (req, res) => {
  const { password } = req.body
  const username = req.user.username

  const isValidPw = passwordRegex.test(password)

  if (!isValidPw) {
    return res.status(400).json({ message: "Invalid password. It must be 8-10 characters long, alphanumeric, and may include special characters." })
  }
  try {
    const hash = await bcrypt.hash(password, 10)
    const qUpdatePw = `UPDATE accounts SET password = ? WHERE username = ?`
    const [result] = await db.query(qUpdatePw, [hash, username])

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "User not found." })
    }

    res.json({ message: "Password updated successfully.", result })
  } catch (err) {
    console.error("Error updating password", err)
    res.status(500).json({ message: "An error occured while updating the password." })
  }
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
