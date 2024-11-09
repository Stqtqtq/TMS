import { db } from "../utils/db.js"
import { transporter } from "../utils/mailer.js"
import bcrypt from "bcryptjs"

const taskNameRegex = /^[a-zA-Z0-9\s]{1,50}$/

export const getTasksInfo = async (req, res) => {
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

export const taskCreation = async (req, res) => {
  const { appAcronym, taskName, creator, owner, description, notes } = req.body
  const planName = req.body.planName || ""

  const currentUser = req.user.username
  const today = new Date().toISOString().split("T")[0]

  // Get the current timestamp in the format 'YYYY-MM-DD HH:MM:SS'
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ")

  // Prepare the formatted note entry
  const formattedNote = `\n**********\n[${currentUser}, ${timestamp}]\n${notes}\n\n\'Task created and is in the 'Open' state\'`

  if (!taskName || !taskNameRegex.test(taskName)) {
    return res.status(400).json({ message: "Invalid task name", success: false })
  } else if (description.length > 255) {
    return res.status(400).json({ message: "Description too long", success: false })
  }

  // Check if current user belongs to the permit create group

  // Have to start dedicated connection to make sure all transactions run on the same connection
  let connection

  try {
    connection = await db.getConnection()
    await connection.beginTransaction()

    const qMaxRNumber = `SELECT MAX(app_rnumber) AS maxRNumber FROM application WHERE app_acronym = ?`
    const [maxRNumberResult] = await connection.execute(qMaxRNumber, [appAcronym])

    // Check if task already exists for the app
    // const [existingTask] = await connection.execute(`SELECT * FROM task WHERE task_name = ? AND task_app_acronym = ?`, [taskName, appAcronym])

    // if (existingTask.length > 0) {
    //   return res.status(409).json({ message: "Task already exists.", success: false })
    // }

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
  const { userPermits, appPermits, taskId, planName, taskState, notes, updatedNotes, action } = req.body
  const currentUser = req.user.username

  // Get the current timestamp in the format 'YYYY-MM-DD HH:MM:SS'
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ")

  // Prepare the formatted note entry
  const formattedNote = notes ? `\n***********\n[${currentUser}, ${taskState}, ${timestamp}]\n${notes}\n` : ""

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

  let state = taskState

  try {
    // Fetch the current state of the task
    const qGetCurrentTask = `SELECT task_state FROM task WHERE task_id = ?`
    const [currentTaskRow] = await db.execute(qGetCurrentTask, [taskId])

    if (currentTaskRow.length === 0) {
      return res.status(404).json({ message: "Task not found", success: false })
    }

    const currentTaskState = currentTaskRow[0].task_state

    if (action === "promote") {
      if (!nextState[taskState]) {
        return res.status(400).json({ message: "Task cannot be promoted", success: false })
      }
      if ((taskState === "Open" && !userPermits.app_permit_open) || (taskState === "Todo" && !userPermits.app_permit_todolist) || (taskState === "Doing" && !userPermits.app_permit_doing) || (taskState === "Done" && !userPermits.app_permit_done)) {
        return res.status(403).json({ message: "You do not have permission to promote this task.", success: false })
      }
      state = nextState[taskState]
    } else if (action === "demote") {
      if (!prevState[taskState]) {
        return res.status(400).json({ message: "Task cannot be demoted", success: false })
      }
      if ((taskState === "Doing" && !userPermits.app_permit_doing) || (taskState === "Done" && !userPermits.app_permit_done)) {
        return res.status(403).json({ message: "You do not have permission to promote this task.", success: false })
      }
      state = prevState[taskState]
    }

    // Check if the state has changed
    let stateChangedNote = ""
    if (state !== currentTaskState) {
      stateChangedNote = `\n***********\n[${currentUser}, State Changed, ${timestamp}]\nState changed from '${currentTaskState}' to '${state}'\n`
    }

    // Combine new notes with state change note (if any)
    const combinedNotes = stateChangedNote + formattedNote

    const qUpdateTask = `UPDATE task SET task_plan = ?, task_notes = CONCAT(?, task_notes), task_owner = ?, task_state = ? WHERE task_id = ?`
    const [updatedTask] = await db.execute(qUpdateTask, [planName, combinedNotes, currentUser, state, taskId])

    if (updatedTask.affectedRows === 0) {
      return res.status(500).json({ message: "Task not found", success: false })
    }

    // Fetch the updated task to include the new notes
    const qGetUpdatedTask = `SELECT task_owner, task_notes FROM task WHERE task_id = ?`
    const [updatedTaskRow] = await db.execute(qGetUpdatedTask, [taskId])

    // Check if updating from 'Doing' -> 'Done' state. If yes, send email
    if (action === "promote" && state === "Done") {
      const qMailRecipients = `SELECT username FROM user_groups WHERE groupname = ?`
      const [qMailRecipientsRow] = await db.execute(qMailRecipients, [appPermits.app_permit_done])

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
      // console.log(emailList)

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

    return res.status(201).json({ message: "Task saved", state, taskOwner: updatedTaskRow[0].task_owner, updatedNotes: updatedTaskRow[0].task_notes, success: true })
  } catch (err) {
    console.error("Error querying the database: ", err)
    res.status(500).json({ message: "An error occured while updating the task.", success: false })
  }
}

export const getUserAppPermissions = async (username, appAcronym) => {
  try {
    // Query to get all permission fields for the specific app
    const qPermissions = `SELECT app_permit_create, app_permit_open, app_permit_todolist, app_permit_doing, app_permit_done FROM application WHERE app_acronym = ?`

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
        const qCheckUserGroup = `SELECT groupname FROM user_groups WHERE username = ? AND groupname = ?`
        const [rows] = await db.execute(qCheckUserGroup, [username, permittedGroup])

        // Save true/false for each permission type that the current user have
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
