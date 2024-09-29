import express from "express"
import session from "express-session"
import mysql from "mysql2/promise"
import dotenv from "dotenv"
import cors from "cors"
import bcrypt from "bcryptjs"
import bodyParser from "body-parser"
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
app.use(express.urlencoded({ extended: true }))
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

/* MIDDLEWARE */

// const validateUsername = (req, res, next) => {
//   const { username } = req.body;
//   if (!username || !usernameRegex.test(username)) {
//     return res.status(400).json({ message: "Invalid username. It must be alphanumeric." });
//   }
//   next();
// };

// const validatePassword = (req, res, next) => {
//   const { password } = req.body;
//   if (!password || !passwordRegex.test(password)) {
//     return res.status(400).json({ message: "Invalid password. It must be 8-10 characters long, alphanumeric, and may include special characters." });
//   }
//   next();
// };

// const validateEmail = (req, res, next) => {
//   const { email } = req.body;
//   if (!email || !emailRegex.test(email)) {
//     return res.status(400).json({ message: "Invalid email format." });
//   }
//   next();
// };

/* END OF MIDDLEWARE */

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token
  console.log("COOKIE TOKEN: ", token)
  if (!token) {
    return res.sendStatus(401)
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      console.log("Token verification error: ", err)
      return res.sendStatus(403)
    }
    req.user = user
    // req.token = token
    console.log(user)
    next()
  })
}

app.get("/", authenticateToken, async (req, res) => {
  try {
    const queryAcc = `SELECT * FROM accounts`
    // const queryGrp = `SELECT * FROM user_groups`
    const queryDistGrp = `SELECT distinct(groupname) FROM user_groups`
    const queryGrpList = `SELECT groupname, username FROM user_groups`

    // const [rows] = await db.query(query)
    // console.log(rows)
    // res.json(rows)

    // res.json("TRYING TO PASS TOKEN: ", req.token)
    // res.json({ data: rows, token: req.token })

    const [accRows] = await db.query(queryAcc)
    console.log("ACCOUNT ROWS: ", accRows)

    const [grpRows] = await db.query(queryGrpList)
    console.log("GROUP ROWS: ", grpRows)

    const [distGrpRows] = await db.query(queryDistGrp)
    console.log("GROUP ROWS: ", distGrpRows)

    // const userWithGrps = accRows.map(user => {
    //   const userGrps = grpRows.filter(group => group.username === user.username).map(group => group.groupname)
    //   return {
    //     ...user,
    //     groups: userGrps
    //   }
    // })

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

    console.log("USER GROUP AFTER MAPPING AND FILTERING: ", userWithGrps)
    res.json({ users: userWithGrps, groups: distGrpRows })

    // res.json({ users: accRows, groups: grpRows })
  } catch (err) {
    console.log("Error querying the database: ", err)
    res.status(500).send("Server error")
  }
  // db.close()
})

app.post("/login", async (req, res) => {
  const { username, password } = req.body
  const hash = await bcrypt.hash(password, 10)
  console.log("HASH: ", hash)
  const ipAddr = req.ip
  const headers = req.headers
  const auth = req.body
  const agent = req.get("user-agent")
  // const ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress

  // req.session = {}
  console.log(req.body)
  const query = `SELECT * FROM accounts WHERE username = ?`

  try {
    const [rows] = await db.query(query, [username])

    if (rows.length === 0) {
      return res.status(401).send("Invalid username or password 11")
    }

    const user = rows[0]
    console.log(user)
    console.log("PW:", password)
    console.log("USERPW:", user.password)

    const isMatch = await bcrypt.compare(password, user.password)
    console.log(isMatch)

    if (isMatch) {
      const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET_KEY, { expiresIn: "1h" })

      // Set new session values
      // req.session = {
      //   username: user.username,
      //   IPaddress: ipAddr,
      //   token: token
      // }

      // console.log(req.session)

      // Set token in cookie
      res.cookie("token", token, {
        maxAge: 1 * 60 * 60 * 1000,
        httpOnly: true // Optional: prevent JavaScript access to cookie
        // sameSite: "strict"
      })

      res.json({ username: user.username, token, ipAddr })
      console.log("Headers: ", headers)
      console.log("Authorization: ", auth)
      console.log("Token set in cookie: ", token)
      // console.log(req.cookies.token) // testing getting token
      // console.log("Agent: ", agent)
      // console.log("Signed In")
      // console.log("Cookies: ", req.cookies)
      // console.log("Session: ", req.session)
    } else {
      res.status(401).send("Invalid username or password 22")
    }
  } catch (err) {
    console.log(err)
  }
})

app.post("/logout", async (req, res) => {
  // Not sure, read so far says that cant manually log out
  // suppose to be short lasting and set to auto expire
  res.clearCookie("token")
  res.status(200).send("Successfully logged out")
})

app.post("/createUser", authenticateToken, async (req, res) => {
  const { username, password, email, groups, is_active } = req.body
  const hash = await bcrypt.hash(password, 10)

  const isValidUsername = usernameRegex.test(username)
  const isValidPw = passwordRegex.test(password)
  const isValidEmail = emailRegex.test(email)

  // if (!username || !password || !email) {
  //   return res.status(400).json({ message: "All fields are required" })
  // }

  // if (!isValidUsername || !isValidPw || !isValidEmail) {
  //   return res.status(400).json({ message: "All fields are required" })
  // }

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
      return res.status(400).json({ message: "Username already exists" })
    }

    // Insert the new user
    const qAddUser = `INSERT INTO accounts (username, password, email, is_active) VALUES (?, ?, ?, ?)`
    const [resultAddUser] = await db.query(qAddUser, [username, hash, email, is_active])
    console.log("USER INSERTION RESULT: ", resultAddUser)
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

    return res.status(201).json({ message: "User created successfully", result: resultAddUser })
  } catch (err) {
    console.error("ERROR DURING INSERTION: ", err)
    res.status(500).json({ message: "An error occurred while creating the user" })
  }
})

app.post("/createGrp", authenticateToken, async (req, res) => {
  const { groupname } = req.body

  const isValidGroupname = groupnameRegex.test(groupname)
  console.log("GROUPNAME CHECK: ", isValidGroupname)

  if (!isValidGroupname) {
    return res.status(400).json({ message: "Invalid Groupname. It must be 2-10 characters long." })
  }

  try {
    // Check if the username already exists
    const [existingGrp] = await db.query(`SELECT * FROM user_groups WHERE groupname = ?`, [groupname])

    if (existingGrp.length > 0) {
      return res.status(400).json({ message: "Group already exists" })
    }

    const query = `INSERT INTO user_groups ( groupname ) VALUES (?)`

    const [result, fields] = await db.query(query, [groupname])

    console.log(result)
    console.log(fields)
    res.status(201).json({ message: "Group created successfully", result })
  } catch (err) {
    console.log(err)
  }
})

app.put("/update/:id", async (req, res) => {
  const { id } = req.params
  const { username, password, email, groups, is_active } = req.body
  // const parseGrp = JSON.stringify(groups)
  console.log("GROUPS: ", groups)
  const hash = await bcrypt.hash(password, 10)
  console.log("CHECKING FOR GROUP UPDATE: ", req.body)

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
    const qAccUpdate = `UPDATE accounts SET password = ?, email = ?, is_active = ? WHERE id = ?`
    // const qGrpUpdate = `INSERT INTO user_groups (groupname, username) VALUES ?`
    // // THIS IS PROBABLY WRONG
    // // const qGrpUpdate = `UPDATE user_groups SET groupname = ? WHERE username = ?`

    // // Compile list of groups for each username
    // // const q = `SELECT username, GROUP_CONCAT(groupname) AS "groups" FROM user_groups GROUP BY username`

    // const [resultAcc, fieldsAcc] = await db.query(qAccUpdate, [hash, email, is_active, id])
    // // const [resultGrp, fieldsGrp] = await db.query(qGrpUpdate, [parseGrp, username])

    // const values = groups.map(group => [group, username])
    // console.log("VALUES LENGTH: ", values.length)
    // const [resultGrp, fieldsGrp] = await db.query(qGrpUpdate, [values])

    // console.log(resultAcc)
    // // console.log(fieldsAcc)
    // console.log(resultGrp)
    // console.log(fieldsGrp)

    const qCheckExisting = `SELECT groupname FROM user_groups WHERE username = ?`
    const qGrpInsert = `INSERT INTO user_groups (groupname, username) VALUES (?, ?)`
    const qGrpDelete = `DELETE FROM user_groups WHERE username = ? AND groupname NOT IN (?)`
    const qDeleteAll = `DELETE FROM user_groups WHERE username = ?`

    // Update account information
    const [resultAcc] = await db.query(qAccUpdate, [hash, email, is_active, id])

    // Get the existing groups for the username
    const [existingGroups] = await db.query(qCheckExisting, [username])
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

    res.json({ message: "User updated successfully", accUpdateResult: resultAcc })
  } catch (err) {
    console.log(err)
  }
})

app.get("/profile", authenticateToken, async (req, res) => {
  // Assuming the user ID is stored in the token payload
  const user = req.user.username // Assuming you're using JWT and req.user is set by the middleware
  console.log("REQ.USER: ", user)

  try {
    const query = `SELECT * FROM accounts WHERE username = ?`
    const [rows] = await db.query(query, [user])

    if (rows.length > 0) {
      res.json(rows[0]) // Return the user information
    } else {
      res.status(404).send("User not found")
    }
  } catch (err) {
    console.error("Error querying the database: ", err)
    res.status(500).send("Server error")
  }
})

app.put("/updateEmail/:id", authenticateToken, async (req, res) => {
  const { id } = req.params
  const { email } = req.body

  const isValidEmail = emailRegex.test(email)

  if (!isValidEmail) {
    return res.status(400).json({ message: "Invalid Email format. " })
  }

  // if (!email || email.trim() === "") {
  //   return res.status(400).json({ message: "Please enter a valid email" })
  // }

  try {
    const qUpdateEmail = `UPDATE accounts SET email = ? WHERE id = ?`
    const [result] = await db.query(qUpdateEmail, [email, id])

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "User not found " })
    }

    res.json({ message: "Email updated successfully,", result })
  } catch (err) {
    console.error("Error updating email", err)
    res.status(500).json({ message: "An error occured while updating the email" })
  }
})

app.put("/updatePw/:id", authenticateToken, async (req, res) => {
  const { id } = req.params
  const { password } = req.body

  const isValidPw = passwordRegex.test(password)

  if (!isValidPw) {
    return res.status(400).json({ message: "Invalid password. It must be 8-10 characters long, alphanumeric, and may include special characters." })
  }

  // if (!password || password.trim() === "") {
  //   return res.status(400).json({ message: "Please enter a valid password" })
  // }

  try {
    const hash = await bcrypt.hash(password, 10)
    const qUpdatePw = `UPDATE accounts SET password = ? WHERE id = ?`
    const [result] = await db.query(qUpdatePw, [hash, id])

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "User not found " })
    }

    res.json({ message: "Password updated successfully,", result })
  } catch (err) {
    console.error("Error updating password", err)
    res.status(500).json({ message: "An error occured while updating the password" })
  }
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
