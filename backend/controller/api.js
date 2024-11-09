import { db } from "../utils/db.js"
import { transporter } from "../utils/mailer.js"
import bcrypt from "bcryptjs"

const taskNameRegex = /^[a-zA-Z0-9\s]{1,50}$/

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
    const tasksWithColour = tasks.map(({ task_plan, ...rest }) => ({
      ...rest,
      task_plan_colour: colorMap[task_plan] || ""
    }))

    // Return the formatted response with tasks and success code
    return res.json({ tasks: tasksWithColour, code: "S000" })
  } catch (err) {
    console.error("Error querying the database", err)
    return res.json({ code: "E004" })
  }
}

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

    const [appRows] = await db.execute("SELECT app_permit_doing FROM application WHERE app_acronym = ?", [app_acronym])

    if (appRows.length === 0) {
      return res.json({ code: "D001" })
    }

    const permitGroup = appRows[0].app_permit_doing

    // Check if the user is part of the required permission group
    const [userGroupRows] = await db.execute("SELECT * FROM user_groups WHERE username = ? AND groupname = ?", [username, permitGroup])

    if (userGroupRows.length === 0) {
      return res.json({ code: "C003" })
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

    const qUpdateTask = `UPDATE task SET task_state = ?, task_notes = CONCAT(?, task_notes), task_owner = ? WHERE task_id = ?`
    const [updatedTask] = await db.execute(qUpdateTask, ["Done", formattedNote, username, task_id])

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
