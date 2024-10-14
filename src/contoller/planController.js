import { db } from "../utils/db.js"

// Add regex for plan name, colour??
const planNameRegex = /^[a-zA-Z0-9_]+$/

export const getPlansInfo = async (req, res) => {
  // To add: only PL can create. Admin can only view, PM and dev cannot create but can go
  // into apps and view

  try {
    // fetch all info from the App table to display
    const qAllPlans = `SELECT * FROM plan`

    const [allPlansInfo] = await db.execute(qAllPlans)

    res.json({ plans: allPlansInfo })
  } catch (err) {
    console.error("Error querying the database: ", err)
    res.status(500).send("Server error")
  }
}

export const createPlan = async (req, res) => {
  // To add: only PL can create. Admin can only view, PM and dev cannot create but can go
  // into apps and view

  const { appAcronym, planName, planStartDate, planEndDate, colour } = req.body

  if (!planName) {
    return res.status(400).json({ message: "Invalid plan name", success: false })
  } else if (!planStartDate) {
    return res.status(400).json({ message: "Invalid start date", success: false })
  } else if (!planEndDate) {
    return res.status(400).json({ message: "Invalid end date", success: false })
  } else if (!colour) {
    return res.status(400).json({ message: "Invalid colour selected", success: false })
  }

  try {
    // Check if plan already exists
    const [existingPlan] = await db.execute(`SELECT * FROM plan WHERE plan_mvp_name = ?`, [planName])

    if (existingPlan.length > 0) {
      return res.status(409).json({ message: "Plan already exists.", success: false })
    }

    // regex check for app acronym
    if (!planNameRegex.test(planName)) {
      return res.status(400).json({ message: "Invalid plan name. It must be alphanumeric.", success: false })
    }

    // Insert new App if it does not exist.
    const qAddPlan = `INSERT INTO plan (plan_app_acronym, plan_mvp_name, plan_startdate, plan_enddate, plan_colour) VALUES (?, ?, ?, ?, ?)`
    const [resultAddPlan] = await db.execute(qAddPlan, [appAcronym, planName, planStartDate, planEndDate, colour])
    if (resultAddPlan.affectedRows === 0) {
      return res.status(500).json({ message: "Plan creation failed, please try again.", success: false })
    }

    return res.status(201).json({ message: "Plan created successfully.", result: resultAddPlan, success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "An error occurred while creating the plan.", success: false })
  }
}
