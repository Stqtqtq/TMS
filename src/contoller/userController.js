import bcrypt from "bcryptjs"

const usernameRegex = /^[a-zA-Z0-9]+$/
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,10}$/
const emailRegex = /^[a-zA-Z0-9!@#$%^&*()_+={}|[\]\\:;"'<>,.?/~`-]+@[a-zA-Z1-9]+\.[a-zA-Z]{2,}$/

export const getUsersInfo = async (req, res) => {
  try {
    const currentUser = req.user.username

    const qAcc = `SELECT * FROM accounts`
    const qDistGrp = `SELECT distinct(groupname) FROM user_groups`
    const qGrpList = `SELECT groupname, username FROM user_groups`

    const [accRows] = await req.db.query(qAcc)
    const [grpRows] = await req.db.query(qGrpList)
    const [distGrpRows] = await req.db.query(qDistGrp)

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
}

export const createUser = async (req, res) => {
  const { username, password, email, groups, is_active } = req.body
  const hash = await bcrypt.hash(password, 10)

  const isValidUsername = usernameRegex.test(username)
  const isValidPw = passwordRegex.test(password)
  const isValidEmail = emailRegex.test(email)

  if (!isValidUsername) {
    return res.status(400).json({ message: "Invalid username. It must be alphanumeric." })
  }
  if (!isValidPw) {
    return res.status(400).json({ message: "Invalid password. It must be 8-10 characters long, alphanumeric, and include special characters." })
  }
  if (!isValidEmail) {
    return res.status(400).json({ message: "Invalid email format." })
  }

  try {
    // Check if the username already exists
    const [existingUser] = await req.db.query(`SELECT * FROM accounts WHERE username = ?`, [username])

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Username already exists." })
    }

    // Insert the new user
    const qAddUser = `INSERT INTO accounts (username, password, email, is_active) VALUES (?, ?, ?, ?)`
    const [resultAddUser] = await req.db.query(qAddUser, [username, hash, email, is_active])
    if (resultAddUser.affectedRows === 0) {
      return res.status(500).json({ message: "User creation failed, please try again." })
    }

    // Insert each group into user_groups
    if (groups && groups.length > 0) {
      const qAddUserGrp = `INSERT INTO user_groups (groupname, username) VALUES (?, ?)`
      for (const group of groups) {
        await req.db.query(qAddUserGrp, [group, username])
      }
    }

    return res.status(201).json({ message: "User created successfully.", result: resultAddUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "An error occurred while creating the user." })
  }
}

export const update = async (req, res) => {
  const { username, password, email, groups, is_active } = req.body

  // Prevent admin from setting themselves inactive
  if (username === "admin" && is_active === 0) {
    return res.status(403).json({ message: "Admin user cannot be set to inactive." })
  }

  // Prevent admin from removing the 'admin' group
  if (username === "admin" && !groups.includes("Admin")) {
    return res.status(403).json({ message: "Cannot remove 'admin' group from admin user." })
  }

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
    const [resultAcc] = await req.db.query(qAccUpdate, qParams)

    // Get the existing groups for the username
    const [existingGroups] = await req.db.query(qCheckExistingGrp, [username])
    const existingGroupNames = existingGroups.map(group => group.groupname)

    // Insert new groups that don't exist
    for (const group of groups) {
      if (!existingGroupNames.includes(group)) {
        await req.db.query(qGrpInsert, [group, username])
      }
    }

    // Handle deletion of groups
    if (groups.length > 0) {
      // Delete groups that are no longer associated with the username
      await req.db.query(qGrpDelete, [username, groups])
    } else {
      // If no groups are provided, delete all groups for the username
      await req.db.query(qDeleteAll, [username])
    }

    res.json({ message: "User updated successfully.", accUpdateResult: resultAcc })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "An error occurred while updating the user." })
  }
}

export const profile = async (req, res) => {
  try {
    const query = `SELECT * FROM accounts WHERE username = ?`
    const [rows] = await req.db.query(query, [req.user.username])

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
}

export const updateEmail = async (req, res) => {
  const { email } = req.body
  const username = req.user.username

  const isValidEmail = emailRegex.test(email)

  if (!isValidEmail) {
    return res.status(400).json({ message: "Invalid Email format. " })
  }

  try {
    const qUpdateEmail = `UPDATE accounts SET email = ? WHERE username = ?`
    const [result] = await req.db.query(qUpdateEmail, [email, username])

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "User not found." })
    }

    res.json({ message: "Email updated successfully.", result })
  } catch (err) {
    console.error("Error updating email", err)
    res.status(500).json({ message: "An error occured while updating the email." })
  }
}

export const updatePw = async (req, res) => {
  const { password } = req.body
  const username = req.user.username

  const isValidPw = passwordRegex.test(password)

  if (!isValidPw) {
    return res.status(400).json({ message: "Invalid password. It must be 8-10 characters long, alphanumeric, and may include special characters." })
  }
  try {
    const hash = await bcrypt.hash(password, 10)
    const qUpdatePw = `UPDATE accounts SET password = ? WHERE username = ?`
    const [result] = await req.db.query(qUpdatePw, [hash, username])

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "User not found." })
    }

    res.json({ message: "Password updated successfully.", result })
  } catch (err) {
    console.error("Error updating password", err)
    res.status(500).json({ message: "An error occured while updating the password." })
  }
}
