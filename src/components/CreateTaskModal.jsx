import React from "react"
import Modal from "react-modal"
import Select from "react-select"
import "./CreateTaskModal.css"

Modal.setAppElement("#root")

const CreateTaskModal = ({ isOpen, closeModal }) => {
  // Hardcoded values for demonstration purposes
  const appAcronym = "Sample Acronym"
  const description = "This is a sample description text."

  const planOptions = [
    { value: "Plan1", label: "Plan1" },
    { value: "Plan2", label: "Plan2" },
    { value: "Plan3", label: "Plan3" }
  ]

  return (
    <div id="root" className="modal-container">
      <Modal isOpen={isOpen} contentLabel="Example Modal">
        <button className="close-button" onClick={closeModal}>
          &times;
        </button>

        <div className="modal-form">
          <div className="form-content">
            {/* Left Column */}
            <div className="left-column">
              <div className="form-group">
                <label>Task Name:</label>
                <input type="text" className="input-field" placeholder="Enter task name" />
              </div>

              <div className="form-group">
                <label>App Acronym:</label>
                <p className="read-only-text">{appAcronym}</p>
              </div>

              <div className="form-group">
                <label>Plan:</label>
                <Select options={planOptions} className="input-field" placeholder="Select plan" />
              </div>

              <div className="form-group">
                <label>State:</label>
                <p className="read-only-text">xxxxxx</p>
              </div>

              <div className="form-group">
                <label>Creator:</label>
                <p className="read-only-text">xxxx</p>
              </div>

              <div className="form-group">
                <label>Owner:</label>
                <p className="read-only-text">xxxx</p>
              </div>

              <div className="form-group">
                <label>Description:</label>
                <textarea className="textarea-field" placeholder="Enter description" rows="4"></textarea>
              </div>
            </div>

            {/* Right Column - Notes */}
            <div className="right-column">
              <div className="form-group">
                <label>Notes:</label>
                <textarea className="textarea-field" placeholder="Enter notes" rows="6" readOnly></textarea>
              </div>

              <div className="form-group">
                <label>Add note:</label>
                <textarea className="textarea-field" placeholder="Add a note" rows="6"></textarea>
              </div>
            </div>
          </div>

          {/* Button Group */}
          <div className="button-group">
            <button type="button" className="save-button" onClick={closeModal}>
              Save Changes
            </button>
            <button type="button" className="cancel-button" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CreateTaskModal
