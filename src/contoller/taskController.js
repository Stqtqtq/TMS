import { db } from "../utils/db.js"
import { transporter } from "../utils/mailer.js"

const taskNameRegex = /^[a-zA-Z0-9_]+$/

export const getTasksInfo = async (req, res) => {
  // To add: only PL can create. Admin can only view, PM and dev cannot create but can go
  // into apps and view

  const { appAcronym } = req.body
  const currentUser = req.user.username

  try {
    // fetch all info from the App table to display
    const qAllTasks = `SELECT * FROM task WHERE task_app_acronym = ?`

    const [allTasksInfo] = await db.execute(qAllTasks, [appAcronym])

    const permissionStatus = await getUserAppPermissions(currentUser, appAcronym)

    res.json({ tasks: allTasksInfo, permissions: permissionStatus })
  } catch (err) {
    console.error("Error querying the database: ", err)
    res.status(500).send("Server error")
  }
}

export const createTask = async (req, res) => {
  // Check if current user belongs to the permit create group

  const { appAcronym, taskName, planName, creator, owner, description, notes } = req.body
  const currentUser = req.user.username
  const today = new Date().toISOString().split("T")[0]

  // Get the current timestamp in the format 'YYYY-MM-DD HH:MM:SS'
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ")

  // Prepare the formatted note entry
  const formattedNote = `[${currentUser}, ${timestamp}]\n${notes}`

  // Check for app acronym and rnumber?
  if (!taskName) {
    return res.status(400).json({ message: "Invalid task name", success: false })
  }

  // Have to start dedicated connection to make sure all transactions run on the same connection
  let connection

  try {
    connection = await db.getConnection()
    await connection.beginTransaction()

    const qMaxRNumber = `SELECT MAX(app_rnumber) AS maxRNumber FROM application WHERE app_acronym = ?`
    const [maxRNumberResult] = await connection.execute(qMaxRNumber, [appAcronym])

    // Check if task already exists for the app
    const [existingTask] = await connection.execute(`SELECT * FROM task WHERE task_name = ? AND task_app_acronym = ?`, [taskName, appAcronym])

    if (existingTask.length > 0) {
      return res.status(409).json({ message: "Task already exists.", success: false })
    }

    // regex check for task name
    if (!taskNameRegex.test(taskName)) {
      return res.status(400).json({ message: "Invalid task name. It must be alphanumeric.", success: false })
    }

    // Get max rnumber from the application table
    let rNumber = maxRNumberResult[0].maxRNumber + 1
    const taskId = `${appAcronym}_${rNumber}`

    // Insert new task if it does not exist.
    const qAddTask = `INSERT INTO task (task_id, task_name, task_description, task_notes, task_plan, task_app_acronym, task_state, task_creator, task_owner, task_createdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    const [resultAddTask] = await connection.execute(qAddTask, [taskId, taskName, description, formattedNote, planName, appAcronym, "Open", creator, owner, today])
    if (resultAddTask.affectedRows === 0) {
      // return res.status(500).json({ message: "Task creation failed, please try again.", success: false })
      throw new Error("Task creation failed")
    }

    // Update the app with latest highest rnumber
    const qUpdateAppRNumber = `UPDATE application SET app_rnumber = ? WHERE app_acronym = ?`
    const [updatedAppRNumber] = await connection.execute(qUpdateAppRNumber, [rNumber, appAcronym])

    if (updatedAppRNumber.affectedRows === 0) {
      // return res.status(500).json({ message: "Update to application rnumber failed, please try again.", success: false })
      throw new Error("Failed to update application rnumber")
    }

    await connection.commit()

    return res.status(201).json({ message: "Task created successfully.", result: resultAddTask, success: true })
  } catch (err) {
    if (connection) await connection.rollback()
    console.error(err)
    res.status(500).json({ message: "An error occurred while creating the task.", success: false })
  } finally {
    if (connection) connection.release()
  }
}

export const updateTask = async (req, res) => {
  // NEED TO UPDATE OWNER ALSO AS THE CURRENT USER SINCE ITS BASED ON LAST TOUCH

  // If able to use promoteTask and demoteTask, then no need update state again here
  const { permitDone, taskId, planName, taskState, notes, updatedNotes, action } = req.body
  const currentUser = req.user.username

  // Get the current timestamp in the format 'YYYY-MM-DD HH:MM:SS'
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ")

  // Prepare the formatted note entry
  const formattedNote = `[${currentUser}, ${taskState}, ${timestamp}]\n${notes}\n\n***********\n`

  // Promotion and demotion logic
  const nextState = {
    Open: "Todo",
    Todo: "Doing",
    Doing: "Done",
    Done: "Close",
    Close: null
  }

  const prevState = {
    Todo: null,
    Doing: "Todo",
    Done: "Doing",
    Close: null
  }

  let newState = taskState

  try {
    if (action === "promote") {
      if (!nextState[taskState]) {
        return res.status(400).json({ message: "Task cannot be promoted", success: false })
      }
      newState = nextState[taskState]
    } else if (action === "demote") {
      if (!prevState[taskState]) {
        return res.status(400).json({ message: "Task cannot be demoted", success: false })
      }
      newState = prevState[taskState]
    }

    // Do I need to update taskowner here again after promote and demote?
    const qUpdateTask = `UPDATE task SET task_plan = ?, task_notes = CONCAT(?, task_notes), task_owner = ?, task_state = ? WHERE task_id = ?`
    const [updatedTask] = await db.execute(qUpdateTask, [planName, formattedNote, currentUser, newState, taskId])

    if (updatedTask.affectedRows === 0) {
      return res.status(500).json({ message: "Task not found", success: false })
    }

    // Fetch the updated task to include the new notes
    const qGetUpdatedNotes = `SELECT task_notes FROM task WHERE task_id = ?`
    const [updatedNotesRow] = await db.execute(qGetUpdatedNotes, [taskId])

    if (newState === "Doing") {
      const qMailRecipients = `SELECT username FROM user_groups WHERE groupname = ?`
      const [qMailRecipientsRow] = await db.execute(qMailRecipients, [permitDone])

      if (qMailRecipientsRow.length === 0) {
        return res.status(500).json({ message: "No users found", success: false })
      }

      let recipients = []

      for (const recipient of qMailRecipientsRow) {
        const [recipientRow] = await db.execute(`SELECT email FROM accounts WHERE username = ?`, [recipient.username])

        if (recipientRow.length > 0 && recipientRow[0].email) {
          recipients.push(recipientRow[0].email)
        }
      }

      const emailList = recipients.join(",")
      console.log(emailList)

      const mailContent = {
        from: "TMS <noreply@tms.com>",
        to: emailList,
        subject: "Pending Task approval",
        text: `${taskId} is pending approval.`
      }

      transporter.sendMail(mailContent, (err, info) => {
        if (err) {
          console.error("Error sending email: ", err)
        }
      })
    }

    return res.status(201).json({ message: "Task saved", newState, updatedNotes: updatedNotesRow[0].task_notes, success: true })
  } catch (err) {
    console.error("Error querying the database: ", err)
    res.status(500).json({ message: "An error occured while updating the task.", success: false })
  }
}

// export const checkPermission = async (username, permittedGroup) => {
//   try {
//     query = `SELECT groupname FROM user_groups WHERE username = ?`
//     const [rows] = await db.execute(query, [username])

//     return rows.some(group => group.groupname === permittedGroup)
//   } catch (err) {
//     console.error("Error connecting to database:", err)
//     throw new Error("Server error")
//   }
// }

export const getUserAppPermissions = async (username, appAcronym) => {
  try {
    // Query to get all permission fields for the specific app
    const qPermissions = `
      SELECT 
        app_permit_create, 
        app_permit_open, 
        app_permit_todolist, 
        app_permit_doing, 
        app_permit_done 
      FROM application 
      WHERE app_acronym = ?`

    const [permissions] = await db.execute(qPermissions, [appAcronym])

    if (permissions.length === 0) {
      return { message: "Application not found.", success: false }
    }

    const permittedGroups = permissions[0]

    // Initialize an object to hold the user's permission status
    const permissionStatus = {}

    // Loop over each permission type and check if the user belongs to the required group
    for (const [key, permittedGroup] of Object.entries(permittedGroups)) {
      if (permittedGroup) {
        // Use the existing logic of `checkPermission` but inline it here to simplify the flow
        const qCheckUserGroup = `SELECT groupname FROM user_groups WHERE username = ? AND groupname = ?`
        const [rows] = await db.execute(qCheckUserGroup, [username, permittedGroup])

        // Save whether the user has the permission or not
        permissionStatus[key] = rows.length > 0
      }
    }

    // Return the permission status
    return { permissionStatus, success: true }
  } catch (err) {
    console.error("Error checking permissions:", err)
    throw new Error("Server error")
  }
}
