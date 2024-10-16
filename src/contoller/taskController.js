import { db } from "../utils/db.js"

const taskNameRegex = /^[a-zA-Z0-9_]+$/

export const getTasksInfo = async (req, res) => {
  // To add: only PL can create. Admin can only view, PM and dev cannot create but can go
  // into apps and view

  const { appAcronym } = req.body

  try {
    // fetch all info from the App table to display
    const qAllTasks = `SELECT * FROM task WHERE task_app_acronym = ?`

    const [allTasksInfo] = await db.execute(qAllTasks, [appAcronym])

    res.json({ tasks: allTasksInfo })
  } catch (err) {
    console.error("Error querying the database: ", err)
    res.status(500).send("Server error")
  }
}

export const createTask = async (req, res) => {
  // To add: only PL can create. Admin can only view, PM and dev cannot create but can go
  // into apps and view

  const { appAcronym, appRNumber, taskName, planName, creator, owner, description, notes, createDate } = req.body

  // Check for app acronym and rnumber?
  if (!taskName) {
    return res.status(400).json({ message: "Invalid task name", success: false })
  }

  // Have to start dedicated connection to make sure all transactions run on the same connection
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    // Get max rnumber from the application table
    const qMaxRNumber = `SELECT MAX(app_rnumber) AS maxRNumber FROM application WHERE app_acronym = ?`
    const [maxRNumberResult] = await connection.execute(qMaxRNumber, [appAcronym])

    let rNumber = maxRNumberResult[0].maxRNumber + 1
    const taskId = `${appAcronym}_${rNumber}`

    // Check if task already exists for the app
    const [existingTask] = await connection.execute(`SELECT * FROM task WHERE task_name = ? AND task_app_acronym = ?`, [taskName, appAcronym])

    if (existingTask.length > 0) {
      return res.status(409).json({ message: "Task already exists.", success: false })
    }

    // regex check for task name
    if (!taskNameRegex.test(taskName)) {
      return res.status(400).json({ message: "Invalid task name. It must be alphanumeric.", success: false })
    }

    // Insert new task if it does not exist.
    const qAddTask = `INSERT INTO task (task_id, task_name, task_description, task_notes, task_plan, task_app_acronym, task_state, task_creator, task_owner, task_createdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    const [resultAddTask] = await connection.execute(qAddTask, [taskId, taskName, description, notes, planName, appAcronym, "Open", creator, owner, createDate])
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
    await connection.rollback()
    console.error(err)
    res.status(500).json({ message: "An error occurred while creating the task.", success: false })
  } finally {
    connection.release()
  }
}

export const updateTask = async (req, res) => {
  const { taskId, planName, notes } = req.body

  try {
    const qUpdateTask = `UPDATE task SET task_plan = ?, task_notes = CONCAT(task_notes, '\n', ?) WHERE task_id = ?`
    const [updatedTask] = await db.execute(qUpdateTask, [planName, notes, taskId])

    if (updatedTask.affectedRows === 0) {
      return res.status(500).json({ message: "Task not found", success: false })
    }

    return res.status(201).json({ message: "Task saved", success: true })
  } catch (err) {
    console.error("Error querying the database: ", err)
    res.status(500).json({ message: "An error occured while updating the task.", success: false })
  }
}
