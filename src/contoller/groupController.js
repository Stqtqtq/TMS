const groupnameRegex = /^[a-zA-Z0-9_]+$/

export const createGrp = async (req, res) => {
  const { groupname } = req.body

  const isValidGroupname = groupnameRegex.test(groupname)

  if (!isValidGroupname) {
    return res.status(400).json({ message: "Invalid Groupname. It must be 2-10 characters long." })
  }

  try {
    // Check if the username already exists
    const [existingGrp] = await req.db.query(`SELECT * FROM user_groups WHERE groupname = ?`, [groupname])

    if (existingGrp.length > 0) {
      return res.status(400).json({ message: "Group already exists." })
    }

    const query = `INSERT INTO user_groups ( groupname ) VALUES (?)`

    const [result, fields] = await req.db.query(query, [groupname])

    res.status(201).json({ message: "Group created successfully.", result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "An error occurred while creating the group." })
  }
}
