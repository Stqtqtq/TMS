import React, { useState, useEffect } from "react"
import axios from "axios"
import Modal from "react-modal"
import Select from "react-select"
import { ToastContainer, toast } from "react-toastify"
import "./TaskCardModal.css"

Modal.setAppElement("#root")

const TaskCardModal = ({ appInfo, plansInfo, task, planOptions, fetchTasksInfo, isOpen, closeModal }) => {
  const [taskForm, setTaskForm] = useState({
    taskId: task.task_id,
    planName: task.task_plan,
    notes: ""
  })

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
      [name]: selectedOption.value
    })
  }

  const handleSubmit = async e => {
    e.preventDefault()

    try {
      const response = await axios.put(
        "http://localhost:5000/updateTask",
        {
          ...taskForm
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )

      setTaskForm({
        planName: null,
        notes: ""
      })

      if (response.data.success) {
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
      // if (err.response.data.isAdmin === false || err.response.status === 401) {
      //   window.location.reload()
      // }
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
        taskId: task.task_id,
        planName: task.task_plan || "",
        notes: ""
      })
    }
  }, [task, isOpen])

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
                  {/* <Select options={planOptions} className="input-field" placeholder="Select plan" /> */}
                  <Select name="planName" closeMenuOnSelect={true} value={planOptions.find(option => option.value === taskForm.planName) || null} onChange={selectedOption => handleSelectChange("planName", selectedOption)} options={planOptions} />
                </div>

                <div className="form-group">
                  <label>State:</label>
                  <p className="read-only-text">{task.task_state}</p>
                </div>

                <div className="form-group">
                  <label>Creator:</label>
                  <p className="read-only-text">{task.task_creator}</p>
                </div>

                <div className="form-group">
                  <label>Owner:</label>
                  <p className="read-only-text">{task.task_owner}</p>
                </div>

                <div className="form-group">
                  <label>Created On:</label>
                  <p className="read-only-text">{task.task_createdate}</p>
                </div>

                <div className="form-group">
                  <label>Description:</label>
                  <textarea className="textarea-field" value={task.task_description} rows="4" readOnly></textarea>
                </div>
              </div>

              {/* Right Column - Notes */}
              <div className="right-column">
                <div className="form-group">
                  <label>Notes:</label>
                  <textarea className="textarea-field" value={task.task_notes} rows="6" readOnly></textarea>
                </div>

                <div className="form-group">
                  <label>Add note:</label>
                  <textarea className="textarea-field" placeholder="Add a note" rows="6" onChange={handleChange}></textarea>
                </div>
              </div>
            </div>

            {/* Button Group */}
            <div className="button-group">
              <button type="submit" className="promote-button">
                Save and Promote
              </button>
              <button type="submit" className="demote-button">
                Save and Demote
              </button>
              <button type="submit" className="save-button">
                Save Changes
              </button>
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
