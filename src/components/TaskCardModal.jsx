import React, { useState, useEffect } from "react"
import { ToastContainer, toast } from "react-toastify"
import axios from "axios"
import Modal from "react-modal"
import Select from "react-select"
import "./TaskCardModal.css"

Modal.setAppElement("#root")

const TaskCardModal = ({ taskPermissions, appInfo, task, planOptions, fetchTasksInfo, isOpen, closeModal }) => {
  const [taskForm, setTaskForm] = useState({
    userPermits: taskPermissions.permissionStatus,
    appPermits: appInfo,
    taskId: task.task_id,
    planName: task.task_plan,
    taskState: task.task_state,
    owner: task.task_owner,
    notes: "", // For input of notes
    updatedNotes: task.task_notes // For read-only notes
  })

  const buttonConfig = {
    Open: [
      { action: "promote", class: "promote", label: "Save and Release", permission: "app_permit_open" },
      { action: null, class: "save", label: "Save Changes", permission: "app_permit_open" }
    ],
    Todo: [
      { action: "promote", class: "promote", label: "Save and Pickup", permission: "app_permit_todolist" },
      { action: null, class: "save", label: "Save Changes", permission: "app_permit_todolist" }
    ],
    Doing: [
      { action: "promote", class: "promote", label: "Save and Seek Approval", permission: "app_permit_doing" },
      { action: "demote", class: "demote", label: "Save and Giveup", permission: "app_permit_doing" },
      { action: null, class: "save", label: "Save Changes", permission: "app_permit_doing" }
    ],
    Done: [
      { action: "promote", class: "promote", label: "Save and Approve", permission: "app_permit_done" },
      { action: "demote", class: "demote", label: "Save and Reject", permission: "app_permit_done" },
      { action: null, class: "save", label: "Save Changes", permission: "app_permit_done" }
    ]
  }

  const renderButtons = () => {
    const stateButtons = buttonConfig[taskForm.taskState] || []
    console.log(stateButtons)
    return stateButtons
      .filter(button => {
        const hasPermission = taskPermissions.permissionStatus?.[button.permission]

        // In the "Done" state, hide only the "promote" (Save and Approve) button if the plan has changed
        if (taskForm.taskState === "Done" && (button.action === "promote" || button.action === null) && taskForm.planName !== task.task_plan) {
          return false // Hide the promote button if planName changed
        }

        return hasPermission // Display all other buttons with proper permission
      })
      .map(button => (
        <button
          key={button.label} // Add a key to avoid React warnings
          type="submit"
          className={`${button.class}-button`}
          onClick={e => handleSubmit(e, button.action)}
        >
          {button.label}
        </button>
      ))
  }

  const handleChange = e => {
    const { name, value } = e.target
    setTaskForm({
      ...taskForm,
      [name]: value
    })
  }

  const handleSelectChange = (name, selectedOption) => {
    setTaskForm({
      ...taskForm,
      [name]: selectedOption ? selectedOption.value : ""
    })
  }

  const handleSubmit = async (e, action = null) => {
    e.preventDefault()

    try {
      const response = await axios.put(
        "http://localhost:5000/updateTask",
        {
          ...taskForm,
          action
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )

      if (response.data.success) {
        setTaskForm(prevForm => ({
          ...prevForm,
          taskState: response.data.state,
          owner: response.data.taskOwner,
          notes: "",
          updatedNotes: response.data.updatedNotes
        }))

        toast.success(response.data.message, {
          position: "top-center",
          autoClose: 150,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          onClose: () => fetchTasksInfo()
        })
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response.data.message, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        style: { width: "450px" }
      })
    }
  }

  // Update taskForm when the task changes or the modal opens
  useEffect(() => {
    if (task) {
      setTaskForm({
        userPermits: taskPermissions.permissionStatus,
        appPermits: appInfo,
        taskId: task.task_id,
        planName: task.task_plan || "",
        taskState: task.task_state,
        owner: task.task_owner,
        notes: "",
        updatedNotes: task.task_notes
      })
    }
  }, [task, isOpen])

  // Determine if the plan field should be a Select or read-only p tag
  const isPlanEditable = (taskForm.taskState === "Open" || taskForm.taskState === "Done") && taskPermissions.permissionStatus?.app_permit_done

  return (
    <div id="root" className="modal-container">
      <Modal isOpen={isOpen} contentLabel="Example Modal">
        <ToastContainer limit={1} />
        <button className="close-button" onClick={closeModal}>
          &times;
        </button>

        <div className="modal-form">
          <form>
            <div className="form-content">
              {/* Left Column */}
              <div className="left-column">
                <div className="form-group">
                  <label>Task Name:</label>
                  <p className="read-only-text">{task.task_name}</p>
                </div>

                <div className="form-group">
                  <label>Task ID:</label>
                  <p className="read-only-text">{task.task_id}</p>
                </div>

                <div className="form-group">
                  <label>Plan:</label>
                  {isPlanEditable ? <Select name="planName" isClearable closeMenuOnSelect={true} value={planOptions.find(option => option.value === taskForm.planName) || null} onChange={selectedOption => handleSelectChange("planName", selectedOption)} options={planOptions} /> : <p className="read-only-text">{taskForm.planName}</p>}
                  {/* <Select name="planName" closeMenuOnSelect={true} value={planOptions.find(option => option.value === taskForm.planName) || null} onChange={selectedOption => handleSelectChange("planName", selectedOption)} options={planOptions} /> */}
                </div>

                <div className="form-group">
                  <label>State:</label>
                  <p className="read-only-text">{taskForm.taskState}</p>
                </div>

                <div className="form-group">
                  <label>Creator:</label>
                  <p className="read-only-text">{task.task_creator}</p>
                </div>

                <div className="form-group">
                  <label>Owner:</label>
                  <p className="read-only-text">{taskForm.owner}</p>
                </div>

                <div className="form-group">
                  <label>Created On:</label>
                  <p className="read-only-text">{task.task_createdate}</p>
                </div>

                <div className="form-group">
                  <label>Description:</label>
                  <textarea className="textarea-field" value={task.task_description} rows="8" cols={50} readOnly></textarea>
                </div>
              </div>

              {/* Right Column - Notes */}
              <div className="right-column">
                <div className="form-group notes">
                  <label>Notes:</label>
                  <textarea className="textarea-field" value={taskForm.updatedNotes} rows="16" cols={80} readOnly></textarea>
                </div>

                <div className="form-group">
                  <label>Add note:</label>
                  <textarea className="textarea-field" name="notes" value={taskForm.notes} placeholder="Add a note" rows="8" cols={80} onChange={handleChange}></textarea>
                </div>
              </div>
            </div>

            {/* Button Group */}
            <div className="button-group">
              {renderButtons()}
              <button type="button" className="cancel-button" onClick={closeModal}>
                Close
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}

export default TaskCardModal
