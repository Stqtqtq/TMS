import express from "express"
import { CreateTask, GetTaskbyState, PromoteTask2Done } from "../controller/api.js"

const router = express.Router()

router.post("/CreateTask", CreateTask)
router.post("/GetTaskbyState", GetTaskbyState)
router.patch("/PromoteTask2Done", PromoteTask2Done)

// router.use((req, res) => {
//   res.json({ code: "A001" })
// })

export default router
