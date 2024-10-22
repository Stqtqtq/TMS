import express from "express"
import { login, logout, landing } from "../contoller/authController.js"
import { getUsersInfo, createUser, update, profile, updateEmail, updatePw } from "../contoller/userController.js"
import { createGrp } from "../contoller/groupController.js"
import { getAppsInfo, createApp } from "../contoller/appController.js"
import { getPlansInfo, createPlan } from "../contoller/planController.js"
import { getTasksInfo, createTask, updateTask } from "../contoller/taskController.js"
import { authenticateToken, checkIsAdmin, checkUserGroup } from "../middleware/auth.js"

const router = express.Router()

router.post("/login", login)
router.post("/logout", logout)

// authenticateToken will be used for all router
router.use(authenticateToken)

router.get("/landing", checkIsAdmin, landing)
router.get("/getAppsInfo", checkUserGroup(["PL"]), getAppsInfo)
router.post("/createApp", checkUserGroup(["PL"]), createApp)

router.post("/getPlansInfo", checkUserGroup(["PM"]), getPlansInfo)
router.post("/createPlan", checkUserGroup(["PM"]), createPlan)

router.post("/getTasksInfo", getTasksInfo)
router.post("/createTask", createTask)
router.put("/updateTask", updateTask)

router.get("/getUsersInfo", checkIsAdmin, getUsersInfo)
router.post("/createGrp", checkIsAdmin, createGrp)
router.post("/createUser", checkIsAdmin, createUser)
router.put("/update", checkIsAdmin, update)

router.get("/profile", profile)
router.put("/updateEmail", updateEmail)
router.put("/updatePw", updatePw)

export default router
