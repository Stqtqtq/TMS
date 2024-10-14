import React, { useState } from "react"
import { useLocation } from "react-router-dom"
import TaskCard from "./TaskCard.jsx"
import AppInfoModal from "./AppInfoModal.jsx"
import CreateTaskModal from "./CreateTaskModal.jsx"
import PlansModal from "./PlansModal.jsx"
import TaskCardModal from "./TaskCardModal.jsx"
import "./AppDashboard.css"

const AppDashboard = () => {
  const location = useLocation()
  const { app } = location.state || null

  if (!app) {
    return <div>Error: No app data provided. Please go back and select an app.</div>
  }

  const [appInfoModalIsOpen, setAppInfoModalIsOpen] = useState(false)
  const [createTaskModalIsOpen, setCreateTaskModalIsOpen] = useState(false)
  const [plansModalIsOpen, setPlansModalIsOpen] = useState(false)
  const [taskCardModalIsOpen, setTaskCardModalIsOpen] = useState(false)

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

  const openTaskCardModal = () => {
    setTaskCardModalIsOpen(true)
  }

  const closeTaskCardModal = () => {
    setTaskCardModalIsOpen(false)
  }

  return (
    <div className="kanban-container">
      <AppInfoModal appInfo={app} isOpen={appInfoModalIsOpen} closeModal={closeAppDetailModal} />
      <CreateTaskModal isOpen={createTaskModalIsOpen} closeModal={closeCreateTaskModal} />
      <PlansModal appInfo={app} isOpen={plansModalIsOpen} closeModal={closePlansModal} />
      <TaskCardModal isOpen={taskCardModalIsOpen} closeModal={closeTaskCardModal} />

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
          <TaskCard onClick={openTaskCardModal} />
        </div>
        <div className="kanban-column">
          <h2 className="column-title">Todo</h2>
        </div>
        <div className="kanban-column">
          <h2 className="column-title">Doing</h2>
        </div>
        <div className="kanban-column">
          <h2 className="column-title">Done</h2>
        </div>
        <div className="kanban-column">
          <h2 className="column-title">Closed</h2>
        </div>
      </div>
    </div>
  )
}

export default AppDashboard
