import { db } from "../utils/db.js"

const planNameRegex = /^[a-zA-Z0-9]{1,50}$/

export const getPlansInfo = async (req, res) => {
  const { appAcronym } = req.body

  try {
    const qPlanInfo = `SELECT * FROM plan WHERE plan_app_acronym = ?`

    const [allPlansInfo] = await db.execute(qPlanInfo, [appAcronym])

    res.json({ plans: allPlansInfo, isPM: req.isPM })
  } catch (err) {
    console.error("Error querying the database: ", err)
    res.status(500).send("Server error")
  }
}

export const createPlan = async (req, res) => {
  if (!req.isPM) {
    return res.status(403).json({ message: "Forbidden", success: false, isPM: req.isPM })
  }

  const { appAcronym, planName, planStartDate, planEndDate, colour } = req.body

  if (!planName || !planNameRegex.test(planName)) {
    return res.status(400).json({ message: "Invalid plan name", success: false })
  } else if (!planStartDate) {
    return res.status(400).json({ message: "Invalid start date", success: false })
  } else if (!planEndDate) {
    return res.status(400).json({ message: "Invalid end date", success: false })
  } else if (!colour) {
    return res.status(400).json({ message: "Invalid colour selected", success: false })
  }

  try {
    // Check if plan already exists for the app
    const [existingPlan] = await db.execute(`SELECT * FROM plan WHERE plan_mvp_name = ? AND plan_app_acronym = ?`, [planName, appAcronym])

    if (existingPlan.length > 0) {
      return res.status(409).json({ message: "Plan already exists.", success: false })
    }

    // Insert new plan if it does not exist.
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
