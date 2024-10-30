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

// export const oreateTask = async (req, res) =>
//   // Check if current user belongs to the permit create group

//   const { appAcronym, taskName, creator, owner, description, notes } = req.body
//   const planName = req.body.planName || ""

//   const currentUser = req.user.username
//   const today = new Date().toISOString().split("T")[0]

//   // Get the current timestamp in the format 'YYYY-MM-DD HH:MM:SS'
//   const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ")

//   // Prepare the formatted note entry
//   const formattedNote = `\n**********\n[${currentUser}, ${timestamp}]\n${notes}\n\n\'Task created and is in the 'Open' state\'`

//   if (!taskName || !taskNameRegex.test(taskName)) {
//     return res.status(400).json({ message: "Invalid task name", success: false })
//   } else if (description.length > 255) {
//     return res.status(400).json({ message: "Description too long", success: false })
//   }

//   // Have to start dedicated connection to make sure all transactions run on the same connection
//   let connection

//   try {
//     connection = await db.getConnection()
//     await connection.beginTransaction()

//     const qMaxRNumber = `SELECT MAX(app_rnumber) AS maxRNumber FROM application WHERE app_acronym = ?`
//     const [maxRNumberResult] = await connection.execute(qMaxRNumber, [appAcronym])

//     // Check if task already exists for the app
//     // const [existingTask] = await connection.execute(`SELECT * FROM task WHERE task_name = ? AND task_app_acronym = ?`, [taskName, appAcronym])

//     // if (existingTask.length > 0) {
//     //   return res.status(409).json({ message: "Task already exists.", success: false })
//     // }

//     // Get max rnumber from the application table
//     let rNumber = maxRNumberResult[0].maxRNumber + 1
//     const taskId = `${appAcronym}_${rNumber}`

//     // Insert new task if it does not exist.
//     const qAddTask = `INSERT INTO task (task_id, task_name, task_description, task_notes, task_plan, task_app_acronym, task_state, task_creator, task_owner, task_createdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
//     const [resultAddTask] = await connection.execute(qAddTask, [taskId, taskName, description, formattedNote, planName, appAcronym, "Open", creator, owner, today])
//     if (resultAddTask.affectedRows === 0) {
//       // return res.status(500).json({ message: "Task creation failed, please try again.", success: false })
//       throw new Error("Task creation failed")
//     }

//     // Update the app with latest highest rnumber
//     const qUpdateAppRNumber = `UPDATE application SET app_rnumber = ? WHERE app_acronym = ?`
//     const [updatedAppRNumber] = await connection.execute(qUpdateAppRNumber, [rNumber, appAcronym])

//     if (updatedAppRNumber.affectedRows === 0) {
//       // return res.status(500).json({ message: "Update to application rnumber failed, please try again.", success: false })
//       throw new Error("Failed to update application rnumber")
//     }

//     await connection.commit()

//     return res.status(201).json({ message: "Task created successfully.", result: resultAddTask, success: true })
//   } catch (err) {
//     if (connection) await connection.rollback()
//     console.error(err)
//     res.status(500).json({ message: "An error occurred while creating the task.", success: false })
//   } finally {
//     if (connection) connection.release()
//   }
// }

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

///////////
// API
///////////

// CREATE TASK API
// params: username, password, task_app_acronym, task_name, task_description, task_notes, task_plan
// output: task_id, error code
export const CreateTask = async (req, res) => {
  const url = "/createtask"
  const objType = "application/json"
  const mandatorykeys = ["username", "password", "task_app_acronym", "task_name"]

  //URL
  if (req.url.toLowerCase() !== url) {
    return res.json({
      code: "A001"
    })
  }

  //body
  if (req.headers["content-type"] !== objType) {
    return res.json({
      code: "B001"
    })
  }

  const keys = Object.keys(req.body)
  for (const key of mandatorykeys) {
    if (!keys.includes(key)) {
      return res.json({
        code: "B002"
      })
    }
  }
  const { username, password, task_app_acronym: appAcronym, task_name: taskName, task_description: description = "", task_notes: notes = "", task_plan: planName = "" } = req.body

  // Get the current date and timestamp
  const today = new Date().toISOString().split("T")[0]
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ")

  // Prepare the formatted note entry
  const formattedNote = `\n**********\n[${username}, ${timestamp}]\n${notes}\n\n'Task created and is in the "Open" state'`

  if (!username || !password || typeof username !== "string" || typeof password !== "string") {
    return res.json({ code: "C001" })
  }
  // Authenticate the user
  try {
    const [userRows] = await db.execute("SELECT password, isActive FROM accounts WHERE username = ?", [username])

    if (userRows.length === 0 || userRows[0].isActive !== 1) {
      return res.json({ code: "C001" })
    }

    const isMatch = await bcrypt.compare(password, userRows[0].password)
    if (!isMatch) {
      return res.json({ code: "C001" })
    }
  } catch (err) {
    console.error("Database query error:", err)
    return res.json({ code: "E004" })
  }

  if (!appAcronym || appAcronym.length > 50 || typeof appAcronym !== "string") {
    return res.json({ code: "D001" })
  }

  // Check if the user has permission to create a task
  try {
    // Retrieve the app_permit_create group for the specified app
    const [appRows] = await db.execute("SELECT app_permit_create FROM application WHERE app_acronym = ?", [appAcronym])

    if (appRows.length === 0) {
      return res.json({ code: "D001" })
    }

    const permitGroup = appRows[0].app_permit_create

    // Check if the user is part of the required permission group
    const [userGroupRows] = await db.execute("SELECT * FROM user_groups WHERE username = ? AND groupname = ?", [username, permitGroup])
    if (userGroupRows.length === 0) {
      return res.json({ code: "C003" })
    }

    if (!taskName || !taskNameRegex.test(taskName) || typeof taskName !== "string") {
      return res.json({ code: "D001" })
    }

    if (description.length > 255 || typeof description !== "string" || typeof notes !== "string" || typeof planName !== "string" || planName.length > 50) {
      return res.json({ code: "D001" })
    }

    if (planName) {
      // Check if there is an existing plan in the app
      const checkPlan = `SELECT * FROM  plan WHERE plan_mvp_name = ? AND plan_app_acronym = ?`
      const [planRow] = await db.execute(checkPlan, [planName, appAcronym])

      if (planRow.length === 0) {
        return res.json({ code: "D001" })
      }
    }
  } catch (err) {
    console.error("Permission check error:", err)
    return res.json({ code: "E004" })
  }

  let connection
  try {
    connection = await db.getConnection()
    await connection.beginTransaction()

    const qMaxRNumber = `SELECT MAX(app_rnumber) AS maxRNumber FROM application WHERE app_acronym = ?`
    const [maxRNumberResult] = await connection.execute(qMaxRNumber, [appAcronym])

    // Calculate new rNumber and generate task ID
    const rNumber = maxRNumberResult[0].maxRNumber + 1
    const taskId = `${appAcronym}_${rNumber}`

    // Insert new task
    const qAddTask = `
      INSERT INTO task (task_id, task_name, task_description, task_notes, task_plan, task_app_acronym, task_state, task_creator, task_owner, task_createdate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const [resultAddTask] = await connection.execute(qAddTask, [taskId, taskName, description, formattedNote, planName, appAcronym, "Open", username, username, today])

    if (resultAddTask.affectedRows === 0) {
      throw new Error("Task creation failed")
    }

    // Update app's rNumber
    const qUpdateAppRNumber = `UPDATE application SET app_rnumber = ? WHERE app_acronym = ?`
    const [updatedAppRNumber] = await connection.execute(qUpdateAppRNumber, [rNumber, appAcronym])

    if (updatedAppRNumber.affectedRows === 0) {
      throw new Error("Failed to update application rnumber")
    }

    // Commit the transaction
    await connection.commit()

    // Return success response
    return res.json({ task_id: taskId, code: "S000" })
  } catch (err) {
    if (connection) await connection.rollback()
    console.error("Transaction error:", err)
    return res.json({ code: "E004", message: "Internal server error" })
  } finally {
    if (connection) connection.release()
  }
}

// GETS TASKS BY STATE API
// params: username, password, app_acronym, task_state
// output: tasks[{task_id, task_name, task_owner, task_plan, task_plan_colour}, {}..]
export const GetTaskbyState = async (req, res) => {
  const url = "/gettaskbystate"
  const objType = "application/json"
  const mandatorykeys = ["username", "password", "task_app_acronym", "task_state"]
  const allowedStates = new Set(["open", "todo", "doing", "done", "close"])

  // URL
  if (req.url.toLowerCase() !== url) {
    return res.json({
      code: "A001"
    })
  }

  // body
  if (req.headers["content-type"] !== objType) {
    return res.json({
      code: "B001"
    })
  }

  const keys = Object.keys(req.body)
  for (const key of mandatorykeys) {
    if (!keys.includes(key)) {
      return res.json({
        code: "B002"
      })
    }
  }
  const { username, password, task_app_acronym: app_acronym } = req.body
  let { task_state } = req.body

  if (!username || !password) {
    return res.json({ code: "C001" })
  }

  if (typeof username !== "string" || typeof password !== "string") {
    return res.json({ code: "C001" })
  }
  // Authenticate the user
  try {
    const [userRows] = await db.execute("SELECT password, isActive FROM accounts WHERE username = ?", [username])

    if (userRows.length === 0 || userRows[0].isActive !== 1) {
      return res.json({ code: "C001" })
    }

    const isMatch = await bcrypt.compare(password, userRows[0].password)
    if (!isMatch) {
      return res.json({ code: "C001" })
    }
  } catch (err) {
    console.error("Database query error:", err)
    return res.json({ code: "E004" })
  }

  if (!app_acronym || !task_state || typeof app_acronym !== "string" || typeof task_state !== "string" || app_acronym.length > 50 || task_state.length > 10) {
    return res.json({ code: "D001" })
  }

  // Convert 'closed' to 'close' for consistency and ensure case-insensitive matching
  task_state = task_state.toLowerCase() === "closed" ? "close" : task_state.toLowerCase()

  if (!allowedStates.has(task_state)) {
    return res.json({ code: "D001" })
  }

  // Capitalize the first letter of task_state to match database values
  task_state = task_state.charAt(0).toUpperCase() + task_state.slice(1)

  try {
    // Step 1: Fetch tasks based on app_acronym(if exist) and task_state
    const checkAcronym = `SELECT * FROM task WHERE task_app_acronym = ?`
    const [acronymRow] = await db.execute(checkAcronym, [app_acronym])

    if (acronymRow.length === 0) {
      return res.json({ code: "D001" })
    }

    const queryTask = `SELECT task_id, task_name, task_owner, task_plan FROM task WHERE task_app_acronym = ? AND task_state = ?`
    const [tasks] = await db.execute(queryTask, [app_acronym, task_state])

    // Check if tasks were found
    if (tasks.length === 0) {
      return res.json({ tasks: [], code: "S000" })
    }

    // Step 2: Extract unique task plans from the fetched tasks
    const uniquePlans = [...new Set(tasks.map(task => task.task_plan))]

    // Step 3: Fetch plan colors for the unique plans
    const queryPlan = `SELECT plan_mvp_name, plan_colour FROM plan WHERE plan_app_acronym = ? AND plan_mvp_name IN (?)`
    const [plans] = await db.execute(queryPlan, [app_acronym, uniquePlans])

    // Step 4: Map each plan name to its color for quick lookup
    const colorMap = {}
    plans.forEach(plan => {
      colorMap[plan.plan_mvp_name] = plan.plan_colour
    })

    // Step 5: Map each task with its respective color from the colorMap
    const tasksWithColour = tasks.map(task => ({
      ...task,
      task_plan_colour: colorMap[task.task_plan]
    }))

    // Return the formatted response with tasks and success code
    return res.json({ tasks: tasksWithColour, code: "S000" })
  } catch (err) {
    console.error("Error querying the database", err)
    return res.json({ code: "E004" })
  }
}

// PROMOTE TASK TO DONE API
// params: username, password, task_id, task_notes
// output: tasks[{task_id, task_name, task_owner, task_plan, task_plan_colour}, {}..]
export const PromoteTask2Done = async (req, res) => {
  const url = "/promotetask2done"
  const objType = "application/json"
  const mandatorykeys = ["username", "password", "task_id"]

  //URL
  if (req.url.toLowerCase() !== url) {
    return res.json({
      code: "A001"
    })
  }

  //body
  if (req.headers["content-type"] !== objType) {
    return res.json({
      code: "B001"
    })
  }

  const keys = Object.keys(req.body)
  for (const key of mandatorykeys) {
    if (!keys.includes(key)) {
      return res.json({
        code: "B002"
      })
    }
  }
  const { username, password, task_id, task_notes } = req.body

  if (!username || !password || typeof username !== "string" || typeof password !== "string") {
    return res.json({ code: "C001" })
  }

  // Authenticate the user
  try {
    const [userRows] = await db.execute("SELECT password, isActive FROM accounts WHERE username = ?", [username])

    if (userRows.length === 0 || userRows[0].isActive !== 1) {
      return res.json({ code: "C001" })
    }

    const isMatch = await bcrypt.compare(password, userRows[0].password)
    if (!isMatch) {
      return res.json({ code: "C001" })
    }
  } catch (err) {
    console.error("Database query error:", err)
    return res.json({ code: "E004" })
  }

  if (!task_id || typeof task_id !== "string" || task_id.length > 100) {
    return res.json({ code: "D001" })
  }

  // // Check if the user has permission to promote task in "doing" state to "done" state
  // try {
  //   // Retrieve the app_permit_create group for the specified app
  //   const [appRows] = await db.execute("SELECT app_permit_create FROM application WHERE app_acronym = ?", [appAcronym])

  //   if (appRows.length === 0) {
  //     return res.json({ code: "D001" })
  //   }

  //   const permitGroup = appRows[0].app_permit_doing

  //   // Check if the user is part of the required permission group
  //   const [userGroupRows] = await db.execute("SELECT * FROM user_groups WHERE username = ? AND groupname = ?", [username, permitGroup])

  //   if (userGroupRows.length === 0) {
  //     return res.json({ code: "C003" })
  //   }
  // } catch (err) {
  //   console.error("Permission check error:", err)
  //   return res.json({ code: "E004" })
  // }

  try {
    // Step 1: Check if task exists and is in the "Doing" state
    const qGetCurrentTask = `SELECT task_state, task_app_acronym FROM task WHERE task_id = ?`
    const [currentTaskRow] = await db.execute(qGetCurrentTask, [task_id])

    if (currentTaskRow.length === 0) {
      return res.json({ code: "D001" })
    }

    const currentTaskState = currentTaskRow[0].task_state
    const app_acronym = currentTaskRow[0].task_app_acronym

    if (currentTaskState.toLowerCase() !== "doing") {
      return res.json({ code: "D001" })
    }

    // Step 2: Fetch the permission group for app_permit_done based on app_acronym
    const qGetPermissionGroup = `SELECT app_permit_done FROM application WHERE app_acronym = ?`
    const [appPermissions] = await db.execute(qGetPermissionGroup, [app_acronym])

    if (appPermissions.length === 0 || !appPermissions[0].app_permit_done) {
      return res.json({ code: "C003" })
    }

    const donePermissionGroup = appPermissions[0].app_permit_done

    // Step 3: Update the task to "Done" state and append task notes
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ")
    const formattedNote = task_notes ? `\n**********\n[${username}, ${timestamp}]\n${task_notes}\nState changed from 'Doing' to 'Done'\n` : `\n**********\n[${username}, ${timestamp}]\nState changed from 'Doing' to 'Done'\n`

    const qUpdateTask = `UPDATE task SET task_state = ?, task_notes = CONCAT(?, task_notes) WHERE task_id = ?`
    const [updatedTask] = await db.execute(qUpdateTask, ["Done", formattedNote, task_id])

    if (updatedTask.affectedRows === 0) {
      return res.json({ code: "E004" })
    }

    // Step 4: Get emails of users in the done permission group
    const qMailRecipients = `SELECT email FROM accounts WHERE username IN (SELECT username FROM user_groups WHERE groupname = ?)`
    const [emailRecipients] = await db.execute(qMailRecipients, [donePermissionGroup])

    if (emailRecipients.length > 0) {
      const recipientEmails = emailRecipients.map(user => user.email).join(",")

      const mailOptions = {
        from: "TMS <noreply@tms.com>",
        to: recipientEmails,
        subject: `Task ${task_id} has been moved to Done`,
        text: `The task with ID ${task_id} has been promoted to the "Done" state by ${username}. Please review if further action is required.`
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error)
        }
      })
    }

    // Step 5: Return success response
    return res.json({ code: "S000" })
  } catch (err) {
    console.error("Error querying the database", err)
    return res.json({ code: "E004" })
  }
}
