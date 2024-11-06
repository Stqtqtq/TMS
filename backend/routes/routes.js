import express from "express"
import { login, logout, landing } from "../controller/authController.js"
import { getUsersInfo, createUser, update, profile, updateEmail, updatePw } from "../controller/userController.js"
import { createGrp } from "../controller/groupController.js"
import { getAppsInfo, createApp, updateApp } from "../controller/appController.js"
import { getPlansInfo, createPlan } from "../controller/planController.js"
import { getTasksInfo, updateTask, taskCreation, CreateTask, GetTaskbyState, PromoteTask2Done } from "../controller/taskController.js"
import { authenticateToken, checkIsAdmin, checkUserGroup } from "../middleware/auth.js"

const router = express.Router()

/*
Middleware can intercept and modify responses, therefore,
if API returning error codes not defined for APIs, look at middleware
return responses and make necessary changes.
*/

// APIs
router.post("/CreateTask", CreateTask)
router.post("/GetTaskbyState", GetTaskbyState)
router.patch("/PromoteTask2Done", PromoteTask2Done)
//

router.post("/login", login)
router.post("/logout", logout)

// authenticateToken will be used for all router
router.use(authenticateToken)

router.get("/landing", checkIsAdmin, landing)
router.get("/getAppsInfo", checkUserGroup(["PL"]), getAppsInfo)
router.post("/createApp", checkUserGroup(["PL"]), createApp)
router.post("/updateApp", checkUserGroup(["PL"]), updateApp)

router.post("/getPlansInfo", checkUserGroup(["PM"]), getPlansInfo)
router.post("/createPlan", checkUserGroup(["PM"]), createPlan)

router.post("/getTasksInfo", getTasksInfo)
router.post("/taskCreation", taskCreation)
router.put("/updateTask", updateTask)

router.get("/getUsersInfo", checkIsAdmin, getUsersInfo)
router.post("/createGrp", checkIsAdmin, createGrp)
router.post("/createUser", checkIsAdmin, createUser)
router.put("/update", checkIsAdmin, update)

router.get("/profile", profile)
router.put("/updateEmail", updateEmail)
router.put("/updatePw", updatePw)

router.use((req, res) => {
  res.json({ code: "A001" })
})

export default router
