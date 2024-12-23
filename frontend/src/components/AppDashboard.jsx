import React, { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import axios from "axios"
import TaskCard from "./TaskCard.jsx"
import AppInfoModal from "./AppInfoModal.jsx"
import CreateTaskModal from "./CreateTaskModal.jsx"
import PlansModal from "./PlansModal.jsx"
import TaskCardModal from "./TaskCardModal.jsx"
import "./AppDashboard.css"

const AppDashboard = () => {
  const location = useLocation()
  const { app, currentUser } = location.state || null

  // const [appInfoModalIsOpen, setAppInfoModalIsOpen] = useState(false)
  const [createTaskModalIsOpen, setCreateTaskModalIsOpen] = useState(false)
  const [plansModalIsOpen, setPlansModalIsOpen] = useState(false)
  const [taskCardModalIsOpen, setTaskCardModalIsOpen] = useState(false)
  const [plansInfo, setPlansInfo] = useState([])
  const [planOptions, setPlanOptions] = useState([])
  const [tasksInfo, setTasksInfo] = useState([])
  const [taskPermissions, setTaskPermissions] = useState({})
  const [selectedTask, setSelectedTask] = useState([])
  const [isPM, setIsPM] = useState(false)

  const fetchPlansInfo = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3000/getPlansInfo",
        {
          appAcronym: app.app_acronym
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )
      setPlansInfo(response.data.plans)
      setIsPM(response.data.isPM)
      setPlanOptions(
        response.data.plans.map(plan => ({
          value: plan.plan_mvp_name,
          label: plan.plan_mvp_name
        }))
      )
    } catch (err) {
      console.error(err)
    }
  }

  const fetchTasksInfo = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3000/getTasksInfo",
        {
          appAcronym: app.app_acronym
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )
      setTasksInfo(response.data.tasks)
      setTaskPermissions(response.data.permissions)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchPlansInfo()
    fetchTasksInfo()
  }, [])

  // const openAppDetailModal = () => {
  //   setAppInfoModalIsOpen(true)
  // }

  // const closeAppDetailModal = () => {
  //   setAppInfoModalIsOpen(false)
  // }

  const openCreateTaskModal = () => {
    setCreateTaskModalIsOpen(true)
  }

  const closeCreateTaskModal = () => {
    setCreateTaskModalIsOpen(false)
  }

  const openPlansModal = () => {
    setPlansModalIsOpen(true)
  }

  const closePlansModal = () => {
    setPlansModalIsOpen(false)
  }

  const openTaskCardModal = task => {
    setSelectedTask(task)
    setTaskCardModalIsOpen(true)
  }

  const closeTaskCardModal = () => {
    fetchTasksInfo()
    setTaskCardModalIsOpen(false)
  }

  return (
    <div className="kanban-container">
      {/* <AppInfoModal appInfo={app} isOpen={appInfoModalIsOpen} closeModal={closeAppDetailModal} /> */}
      <CreateTaskModal currentUser={currentUser} appInfo={app} planOptions={planOptions} fetchTasksInfo={fetchTasksInfo} isOpen={createTaskModalIsOpen} closeModal={closeCreateTaskModal} />
      <PlansModal appInfo={app} isPM={isPM} plansInfo={plansInfo} fetchPlansInfo={fetchPlansInfo} isOpen={plansModalIsOpen} closeModal={closePlansModal} />
      <TaskCardModal taskPermissions={taskPermissions} appInfo={app} task={selectedTask} planOptions={planOptions} fetchTasksInfo={fetchTasksInfo} isOpen={taskCardModalIsOpen} closeModal={closeTaskCardModal} />

      <div className="kanban-header">
        <div className="left-header-group">
          <h1 className="app-acronym">{app.app_acronym}</h1>
          {/* <button className="appInfo-buttons" onClick={openAppDetailModal}>
            View App Details
          </button> */}
        </div>
        <div className="right-header-group">
          <button className="appInfo-buttons" onClick={openPlansModal}>
            Plans
          </button>
          {taskPermissions.permissionStatus?.app_permit_create && (
            <button className="appInfo-buttons" onClick={openCreateTaskModal}>
              Create Task
            </button>
          )}
        </div>
      </div>

      <div className="kanban-board">
        <div className="kanban-column">
          <h2 className="column-title">Open</h2>
          {tasksInfo
            .filter(task => task.task_state === "Open")
            .map(task => {
              const matchingPlan = plansInfo.find(plan => plan.plan_mvp_name === task.task_plan)
              return <TaskCard key={task.task_id} task={task} plan={matchingPlan} onClick={() => openTaskCardModal(task)} />
            })}
        </div>
        <div className="kanban-column">
          <h2 className="column-title">Todo</h2>
          {tasksInfo
            .filter(task => task.task_state === "Todo")
            .map(task => {
              const matchingPlan = plansInfo.find(plan => plan.plan_mvp_name === task.task_plan)
              return <TaskCard key={task.task_id} task={task} plan={matchingPlan} onClick={() => openTaskCardModal(task)} />
            })}
        </div>
        <div className="kanban-column">
          <h2 className="column-title">Doing</h2>
          {tasksInfo
            .filter(task => task.task_state === "Doing")
            .map(task => {
              const matchingPlan = plansInfo.find(plan => plan.plan_mvp_name === task.task_plan)
              return <TaskCard key={task.task_id} task={task} plan={matchingPlan} onClick={() => openTaskCardModal(task)} />
            })}
        </div>
        <div className="kanban-column">
          <h2 className="column-title">Done</h2>
          {tasksInfo
            .filter(task => task.task_state === "Done")
            .map(task => {
              const matchingPlan = plansInfo.find(plan => plan.plan_mvp_name === task.task_plan)
              return <TaskCard key={task.task_id} task={task} plan={matchingPlan} onClick={() => openTaskCardModal(task)} />
            })}
        </div>
        <div className="kanban-column">
          <h2 className="column-title">Closed</h2>
          {tasksInfo
            .filter(task => task.task_state === "Close")
            .map(task => {
              const matchingPlan = plansInfo.find(plan => plan.plan_mvp_name === task.task_plan)
              return <TaskCard key={task.task_id} task={task} plan={matchingPlan} onClick={() => openTaskCardModal(task)} />
            })}
        </div>
      </div>
    </div>
  )
}

export default AppDashboard
