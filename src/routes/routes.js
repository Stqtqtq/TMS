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

router.get("/landing", authenticateToken, checkIsAdmin, landing)
router.get("/getAppsInfo", authenticateToken, checkUserGroup(["PL"]), getAppsInfo)
router.post("/createApp", authenticateToken, checkUserGroup(["PL"]), createApp)

// router.get("/getPlansInfo", authenticateToken, getPlansInfo)
router.post("/getPlansInfo", authenticateToken, checkUserGroup(["PM"]), getPlansInfo)
router.post("/createPlan", authenticateToken, checkUserGroup(["PM"]), createPlan)

router.post("/getTasksInfo", authenticateToken, getTasksInfo)
router.post("/createTask", authenticateToken, createTask)
router.put("/updateTask", authenticateToken, updateTask)

router.get("/getUsersInfo", authenticateToken, checkIsAdmin, getUsersInfo)
router.post("/createGrp", authenticateToken, checkIsAdmin, createGrp)
router.post("/createUser", authenticateToken, checkIsAdmin, createUser)
router.put("/update", authenticateToken, checkIsAdmin, update)

router.get("/profile", authenticateToken, profile)
router.put("/updateEmail", authenticateToken, updateEmail)
router.put("/updatePw", authenticateToken, updatePw)

export default router
