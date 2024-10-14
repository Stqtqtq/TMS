import { db } from "../utils/db.js"

const groupnameRegex = /^[a-zA-Z0-9_]+$/

export const createGrp = async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: "Forbidden", success: false, isAdmin: req.isAdmin })
  }

  const { groupname } = req.body

  const isValidGroupname = groupnameRegex.test(groupname)

  if (!isValidGroupname) {
    return res.status(400).json({ message: "Invalid Groupname. It must be alphanumeric.", success: false, isAdmin: req.isAdmin })
  }

  try {
    // Check if the username already exists
    const [existingGrp] = await db.execute(`SELECT * FROM user_groups WHERE groupname = ?`, [groupname])

    if (existingGrp.length > 0) {
      return res.status(400).json({ message: "Group already exists.", success: false, isAdmin: req.isAdmin })
    }

    const query = `INSERT INTO user_groups ( groupname ) VALUES (?)`

    const [result] = await db.execute(query, [groupname])

    res.status(201).json({ message: "Group created successfully.", result, success: true, isAdmin: req.isAdmin })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "An error occurred while creating the group.", success: false, isAdmin: req.isAdmin })
  }
}
