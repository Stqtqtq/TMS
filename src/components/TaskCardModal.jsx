import React from "react"
import Modal from "react-modal"
import Select from "react-select"
import "./TaskCardModal.css"

Modal.setAppElement("#root")

const TaskCardModal = ({ isOpen, closeModal }) => {
  // Hardcoded values for demonstration purposes
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
                <p className="read-only-text">xxxxx</p>
              </div>

              <div className="form-group">
                <label>Task ID:</label>
                <p className="read-only-text">xxxxx</p>
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
                <label>Created On:</label>
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
                <textarea className="textarea-field" placeholder="[username, state, datetime]" rows="6" readOnly></textarea>
              </div>

              <div className="form-group">
                <label>Add note:</label>
                <textarea className="textarea-field" placeholder="Add a note" rows="6"></textarea>
              </div>
            </div>
          </div>

          {/* Button Group */}
          <div className="button-group">
            <button type="button" className="promote-button" onClick={closeModal}>
              Save and Promote
            </button>
            <button type="button" className="demote-button" onClick={closeModal}>
              Save and Demote
            </button>
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

export default TaskCardModal
