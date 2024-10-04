import express from "express"
import { login, logout, checkAuth } from "../contoller/authController.js"
import { getUsersInfo, createUser, update, profile, updateEmail, updatePw } from "../contoller/userController.js"
import { createGrp } from "../contoller/groupController.js"
import { authenticateToken, checkIsAdmin } from "../middleware/auth.js"

const router = express.Router()

router.post("/login", login)
router.post("/logout", logout)
router.get("/checkAuth", authenticateToken, checkAuth)

router.get("/getUsersInfo", authenticateToken, getUsersInfo)
router.post("/createUser", authenticateToken, checkIsAdmin, createUser)
router.put("/update", authenticateToken, checkIsAdmin, update)
router.get("/profile", authenticateToken, profile)
router.put("/updateEmail", authenticateToken, updateEmail)
router.put("/updatePw", authenticateToken, updatePw)

router.post("/createGrp", authenticateToken, checkIsAdmin, createGrp)

export default router
