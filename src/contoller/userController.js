import bcrypt from "bcryptjs"
import { db } from "../utils/db.js"

const usernameRegex = /^[a-zA-Z0-9]+$/
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,10}$/
const emailRegex = /^[a-zA-Z0-9!@#$%^&*()_+={}|[\]\\:;"'<>,.?/~`-]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/

export const getUsersInfo = async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: "Forbidden", success: false, isAdmin: req.isAdmin })
  }
  try {
    const qAcc = `SELECT * FROM accounts`
    const qGrpList = `SELECT groupname, username FROM user_groups`
    const qDistGrp = `SELECT distinct(groupname) FROM user_groups`

    const [accRows] = await db.execute(qAcc)
    const [grpRows] = await db.execute(qGrpList)
    const [distGrpRows] = await db.execute(qDistGrp)

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

    res.json({ users: userWithGrps, groups: distGrpRows })
  } catch (err) {
    console.error("Error querying the database: ", err)
    res.status(500).send("Server error")
  }
}

export const createUser = async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: "Forbidden", success: false, isAdmin: req.isAdmin })
  }

  const { username, password, email, groups, isActive } = req.body
  const hash = await bcrypt.hash(password, 10)

  const isValidUsername = usernameRegex.test(username)
  const isValidPw = passwordRegex.test(password)
  const isValidEmail = email === "" || emailRegex.test(email)

  if (!isValidUsername) {
    return res.status(400).json({ message: "Invalid username. It must be alphanumeric.", success: false, isAdmin: req.isAdmin })
  }
  if (!isValidPw) {
    return res.status(400).json({ message: "Invalid password. It must be 8-10 characters long, alphanumeric, and include special characters.", success: false, isAdmin: req.isAdmin })
  }
  if (!isValidEmail) {
    return res.status(400).json({ message: "Invalid email format.", success: false, isAdmin: req.isAdmin })
  }

  try {
    // Check if the username already exists
    const [existingUser] = await db.execute(`SELECT * FROM accounts WHERE username = ?`, [username])

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Username already exists.", success: false, isAdmin: req.isAdmin })
    }

    // Insert the new user if it does not exist
    const qAddUser = `INSERT INTO accounts (username, password, email, isActive) VALUES (?, ?, ?, ?)`
    const [resultAddUser] = await db.execute(qAddUser, [username, hash, email, isActive])
    if (resultAddUser.affectedRows === 0) {
      return res.status(500).json({ message: "User creation failed, please try again.", success: false, isAdmin: req.isAdmin })
    }

    // Insert each group that inserted user belongs to into user_groups
    if (groups && groups.length > 0) {
      const qAddUserGrp = `INSERT INTO user_groups (groupname, username) VALUES (?, ?)`
      for (const group of groups) {
        await db.execute(qAddUserGrp, [group, username])
      }
    }

    return res.status(201).json({ message: "User created successfully.", result: resultAddUser, success: true, isAdmin: req.isAdmin })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "An error occurred while creating the user.", success: false, isAdmin: req.isAdmin })
  }
}

export const update = async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: "Forbidden", success: false, isAdmin: req.isAdmin })
  }

  const { username, password, email, groups, isActive } = req.body

  // Prevent admin from being set to inactive
  if (username === "admin" && isActive === 0) {
    return res.status(403).json({ message: "'admin' username cannot be set to inactive.", success: false, isAdmin: req.isAdmin })
  }

  // Prevent 'Admin' group from being removed for 'admin' username
  if (username === "admin" && !groups.includes("Admin")) {
    return res.status(403).json({ message: "Cannot remove 'Admin' group from 'admin' username.", success: false, isAdmin: req.isAdmin })
  }

  const isValidUsername = usernameRegex.test(username)
  const isValidEmail = email === "" || emailRegex.test(email)

  if (!isValidUsername) {
    return res.status(400).json({ message: "Invalid username. It must be alphanumeric.", success: false, isAdmin: req.isAdmin })
  }

  if (!isValidEmail) {
    return res.status(400).json({ message: "Invalid email format.", success: false, isAdmin: req.isAdmin })
  }

  try {
    let qAccUpdate = `UPDATE accounts SET email = ?, isActive = ?`
    const qParams = [email, isActive]

    // Only update password if it is provided
    if (password) {
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: "Invalid password. It must be 8-10 characters long, alphanumeric, and may include special characters.", success: false, isAdmin: req.isAdmin })
      }
      const hash = await bcrypt.hash(password, 10)
      qAccUpdate += `, password = ?`
      qParams.push(hash)
    }

    qAccUpdate += ` WHERE username = ?`
    qParams.push(username) // Add username at the end for the WHERE clause

    const qCheckExistingGrp = `SELECT groupname FROM user_groups WHERE username = ?`
    const qGrpInsert = `INSERT INTO user_groups (groupname, username) VALUES (?, ?)`
    // const qGrpDelete = `DELETE FROM user_groups WHERE username = ? AND groupname NOT IN (?)`
    const qDeleteAll = `DELETE FROM user_groups WHERE username = ?`

    // Update account information
    const [resultAcc] = await db.execute(qAccUpdate, qParams)

    // Get the existing groups for the username
    const [existingGroups] = await db.execute(qCheckExistingGrp, [username])
    const existingGroupNames = existingGroups.map(group => group.groupname)

    // Insert new groups that don't exist
    for (const group of groups) {
      if (!existingGroupNames.includes(group)) {
        await db.execute(qGrpInsert, [group, username])
      }
    }

    // Handle deletion of groups if removed from user
    if (groups.length > 0) {
      const placeholders = groups.map(() => "?").join(", ")
      const qGrpDelete = `DELETE FROM user_groups WHERE username = ? AND groupname NOT IN (${placeholders}) `
      // Delete groups that are no longer associated with the username
      await db.execute(qGrpDelete, [username, ...groups])
    } else {
      // If no groups are provided, delete all groups for the username
      await db.execute(qDeleteAll, [username])
    }

    res.json({ message: "User updated successfully.", accUpdateResult: resultAcc, success: true, isAdmin: req.isAdmin })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "An error occurred while updating the user.", success: false, isAdmin: req.isAdmin })
  }
}

export const profile = async (req, res) => {
  try {
    const query = `SELECT * FROM accounts WHERE username = ?`
    const [rows] = await db.execute(query, [req.user.username])

    if (rows.length > 0) {
      const user = rows[0]
      res.json({ username: user.username, email: user.email })
    } else {
      res.status(404).json({ message: "User not found.", success: false })
    }
  } catch (err) {
    console.error("Error querying the database: ", err)
    res.status(500).json({ message: "Server error.", success: false })
  }
}

export const updateEmail = async (req, res) => {
  const { email } = req.body
  const username = req.user.username

  const isValidEmail = emailRegex.test(email)

  if (!isValidEmail) {
    return res.status(400).json({ message: "Invalid Email format.", success: false })
  }

  try {
    const qUpdateEmail = `UPDATE accounts SET email = ? WHERE username = ?`
    const [result] = await db.execute(qUpdateEmail, [email, username])

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "User not found.", success: false })
    }

    res.json({ message: "Email updated successfully.", result, success: true })
  } catch (err) {
    console.error("Error updating email", err)
    res.status(500).json({ message: "An error occured while updating the email.", success: false })
  }
}

export const updatePw = async (req, res) => {
  const { password } = req.body
  const username = req.user.username

  const isValidPw = passwordRegex.test(password)

  if (!isValidPw) {
    return res.status(400).json({ message: "Invalid password. It must be 8-10 characters long, alphanumeric, and may include special characters.", success: false })
  }
  try {
    const hash = await bcrypt.hash(password, 10)
    const qUpdatePw = `UPDATE accounts SET password = ? WHERE username = ?`
    const [result] = await db.execute(qUpdatePw, [hash, username])

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "User not found.", success: false })
    }

    res.json({ message: "Password updated successfully.", result, success: true })
  } catch (err) {
    console.error("Error updating password", err)
    res.status(500).json({ message: "An error occured while updating the password.", success: false })
  }
}
