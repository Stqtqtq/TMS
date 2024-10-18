import React, { useState } from "react"
import axios from "axios"
import Modal from "react-modal"
import Select from "react-select"
import "./CreateTaskModal.css"
import { ToastContainer, toast } from "react-toastify"

Modal.setAppElement("#root")

const CreateTaskModal = ({ currentUser, appInfo, planOptions, fetchTasksInfo, isOpen, closeModal }) => {
  const [taskForm, setTaskForm] = useState({
    appAcronym: appInfo?.app_acronym || "",
    taskName: "",
    planName: "",
    creator: currentUser,
    owner: currentUser,
    description: "",
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
      const response = await axios.post(
        "http://localhost:5000/createTask",
        {
          ...taskForm
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )

      setTaskForm({
        appAcronym: appInfo?.app_acronym || "",
        taskName: "",
        planName: null,
        creator: currentUser,
        owner: currentUser,
        description: "",
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

  return (
    <div id="root" className="modal-container">
      <Modal isOpen={isOpen} contentLabel="Example Modal">
        <ToastContainer limit={1} />
        <button className="close-button" onClick={closeModal}>
          &times;
        </button>

        <div className="modal-form">
          <form onSubmit={handleSubmit}>
            <div className="form-content">
              {/* Left Column */}
              <div className="left-column">
                <div className="form-group">
                  <label>Task Name:</label>
                  <input type="text" name="taskName" value={taskForm.taskName} onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>App Acronym:</label>
                  <p className="read-only-text">{appInfo.app_acronym}</p>
                </div>

                <div className="form-group">
                  <label>Plan:</label>
                  <Select name="planName" closeMenuOnSelect={true} value={planOptions.find(option => option.value === taskForm.planName) || null} onChange={selectedOption => handleSelectChange("planName", selectedOption)} options={planOptions} />
                </div>

                <div className="form-group">
                  <label>State:</label>
                  <p className="read-only-text" value="Open">
                    Open
                  </p>
                </div>

                <div className="form-group">
                  <label>Creator:</label>
                  <p className="read-only-text">{currentUser}</p>
                </div>

                <div className="form-group">
                  <label>Owner:</label>
                  <p className="read-only-text">{currentUser}</p>
                </div>

                <div className="form-group">
                  <label>Description:</label>
                  <textarea name="description" value={taskForm.description} onChange={handleChange} rows="4"></textarea>
                </div>
              </div>

              {/* Right Column - Notes */}
              <div className="right-column">
                <div className="form-group">
                  <label>Add note:</label>
                  <textarea name="notes" value={taskForm.notes} onChange={handleChange} rows="6"></textarea>
                </div>
              </div>
            </div>

            {/* Button Group */}
            <div className="button-group">
              <button type="submit" className="save-button">
                Create Task
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

export default CreateTaskModal
