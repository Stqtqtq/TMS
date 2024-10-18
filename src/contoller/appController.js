import { db } from "../utils/db.js"

// Add regex for App Acronym alphanumeric
const appAcronymRegex = /^[a-zA-Z0-9_]+$/

export const getAppsInfo = async (req, res) => {
  // To add: only PL can create. Admin can only view, PM and dev cannot create but can go
  // into apps and view

  const currentUser = req.user.username

  try {
    // Get distinct groups for dropdown to create App
    const qDistGrp = `SELECT distinct(groupname) FROM user_groups`
    // fetch all info from the App table to display
    const qAllApps = `SELECT * FROM application`

    const qUserGroup = `SELECT groupname FROM user_groups WHERE username = ?`
    const [userGroupRow] = await db.execute(qUserGroup, [currentUser])

    const [distGrpRows] = await db.execute(qDistGrp)
    const [allAppsInfo] = await db.execute(qAllApps)
    res.json({ apps: allAppsInfo, groups: distGrpRows, currentUser, isPL: req.isPL })
  } catch (err) {
    console.error("Error querying the database: ", err)
    res.status(500).send("Server error")
  }
}

export const createApp = async (req, res) => {
  // To add: only PL can create. Admin can only view, PM and dev cannot create but can go
  // into apps and view

  // Might need to do conditional checks for groups on create, todo, doing, done
  // Check how to implement requirements for permits

  if (!req.isPL) {
    return res.status(403).json({ message: "Forbidden", success: false, isPL: req.isPL })
  }

  const { appAcronym, appStartDate, appEndDate, appCreate, appOpen, appTodo, appDoing, appDone, description } = req.body
  if (appAcronym === "" || null) {
    return res.status(400).json({ message: "Invalid App Acronym", success: false })
  } else if (appCreate === "" || null) {
    return res.status(400).json({ message: "Task Create is not selected", success: false })
  } else if (appOpen === "" || null) {
    return res.status(400).json({ message: "Task Open is not selected", success: false })
  } else if (appTodo === "" || null) {
    return res.status(400).json({ message: "Task To Do is not selected", success: false })
  } else if (appDoing === "" || null) {
    return res.status(400).json({ message: "Task Doing is not selected", success: false })
  } else if (appDone === "" || null) {
    return res.status(400).json({ message: "Task Done is not selected", success: false })
  }

  try {
    // Check if App already exists
    const [existingApp] = await db.execute(`SELECT * FROM application WHERE app_acronym = ?`, [appAcronym])

    if (existingApp.length > 0) {
      return res.status(409).json({ message: "App acronym already exists.", success: false })
    }

    // regex check for app acronym
    if (!appAcronymRegex.test(appAcronym)) {
      return res.status(400).json({ message: "Invalid App acronym. It must be alphanumeric.", success: false })
    }

    // Insert new App if it does not exist.
    const qAddApp = `INSERT INTO application (app_acronym, app_startdate, app_enddate, app_permit_create, app_permit_open, app_permit_todolist, app_permit_doing, app_permit_done, app_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    const [resultAddApp] = await db.execute(qAddApp, [appAcronym, appStartDate, appEndDate, appCreate, appOpen, appTodo, appDoing, appDone, description])
    if (resultAddApp.affectedRows === 0) {
      return res.status(500).json({ message: "App creation failed, please try again.", success: false })
    }

    return res.status(201).json({ message: "App created successfully.", result: resultAddApp, success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "An error occurred while creating the app.", success: false })
  }
}
