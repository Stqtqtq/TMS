import React, { useState, useEffect } from "react"
import axios from "axios"
import { useLocation } from "react-router-dom"
import TaskCard from "./TaskCard.jsx"
import AppInfoModal from "./AppInfoModal.jsx"
import CreateTaskModal from "./CreateTaskModal.jsx"
import PlansModal from "./PlansModal.jsx"
import TaskCardModal from "./TaskCardModal.jsx"
import "./AppDashboard.css"

const AppDashboard = () => {
  const location = useLocation()
  const { app, currentUser } = location.state || null

  if (!app) {
    return <div>Error: No app data provided. Please go back and select an app.</div>
  }

  const [appInfoModalIsOpen, setAppInfoModalIsOpen] = useState(false)
  const [createTaskModalIsOpen, setCreateTaskModalIsOpen] = useState(false)
  const [plansModalIsOpen, setPlansModalIsOpen] = useState(false)
  const [taskCardModalIsOpen, setTaskCardModalIsOpen] = useState(false)
  const [plansInfo, setPlansInfo] = useState([])
  const [planOptions, setPlanOptions] = useState([])
  const [tasksInfo, setTasksInfo] = useState([])
  const [selectedTask, setSelectedTask] = useState([])

  const fetchPlansInfo = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/getPlansInfo",
        {
          appAcronym: app.app_acronym
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )
      setPlansInfo(response.data.plans)
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
        "http://localhost:5000/getTasksInfo",
        {
          appAcronym: app.app_acronym
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )
      setTasksInfo(response.data.tasks)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchPlansInfo()
    fetchTasksInfo()
  }, [])

  const openAppDetailModal = () => {
    setAppInfoModalIsOpen(true)
  }

  const closeAppDetailModal = () => {
    setAppInfoModalIsOpen(false)
  }

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
    setTaskCardModalIsOpen(false)
  }

  return (
    <div className="kanban-container">
      <AppInfoModal appInfo={app} isOpen={appInfoModalIsOpen} closeModal={closeAppDetailModal} />
      <CreateTaskModal currentUser={currentUser} appInfo={app} planOptions={planOptions} fetchTasksInfo={fetchTasksInfo} isOpen={createTaskModalIsOpen} closeModal={closeCreateTaskModal} />
      <PlansModal appInfo={app} plansInfo={plansInfo} fetchPlansInfo={fetchPlansInfo} isOpen={plansModalIsOpen} closeModal={closePlansModal} />
      <TaskCardModal appInfo={app} plansInfo={plansInfo} task={selectedTask} planOptions={planOptions} fetchTasksInfo={fetchTasksInfo} isOpen={taskCardModalIsOpen} closeModal={closeTaskCardModal} />

      <div className="kanban-header">
        <div className="left-header-group">
          <h1 className="app-acronym">{app.app_acronym}</h1>
          <button className="appInfo-buttons" onClick={openAppDetailModal}>
            View App Details
          </button>
        </div>
        <div className="right-header-group">
          <button className="appInfo-buttons" onClick={openPlansModal}>
            Plans
          </button>
          <button className="appInfo-buttons" onClick={openCreateTaskModal}>
            Create Task
          </button>
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
            .map(task => (
              <TaskCard key={task.task_id} task={task} onClick={openTaskCardModal} />
            ))}
        </div>
        <div className="kanban-column">
          <h2 className="column-title">Doing</h2>
          {tasksInfo
            .filter(task => task.task_state === "Doing")
            .map(task => (
              <TaskCard key={task.task_id} task={task} onClick={openTaskCardModal} />
            ))}
        </div>
        <div className="kanban-column">
          <h2 className="column-title">Done</h2>
          {tasksInfo
            .filter(task => task.task_state === "Done")
            .map(task => (
              <TaskCard key={task.task_id} task={task} onClick={openTaskCardModal} />
            ))}
        </div>
        <div className="kanban-column">
          <h2 className="column-title">Closed</h2>
          {tasksInfo
            .filter(task => task.task_state === "Closed")
            .map(task => (
              <TaskCard key={task.task_id} task={task} onClick={openTaskCardModal} />
            ))}
        </div>
      </div>
    </div>
  )
}

export default AppDashboard
