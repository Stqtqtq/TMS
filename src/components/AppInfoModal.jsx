import React from "react"
import Modal from "react-modal"
import "./AppInfoModal.css"

Modal.setAppElement("#root")

const AppInfoModal = ({ appInfo, isOpen, closeModal }) => {
  return (
    <div id="root" className="modal-container">
      <Modal isOpen={isOpen} contentLabel="Example Modal">
        <button className="close-button" onClick={closeModal}>
          &times;
        </button>

        <div className="modal-form">
          <div className="form-content">
            {/* Left Column */}
            <div className="appInfo-left-column">
              <div className="appInfo-form-group">
                <label>App Acronym:</label>
                <p className="read-only-text">{appInfo.app_acronym}</p>
              </div>

              <div className="appInfo-form-group">
                <label>Start Date:</label>
                <p className="read-only-text">{appInfo.app_startdate}</p>
              </div>

              <div className="appInfo-form-group">
                <label>End Date:</label>
                <p className="read-only-text">{appInfo.app_enddate}</p>
              </div>

              <h3 className="permissions-title">Task Permissions</h3>

              <div className="appInfo-form-group">
                <label>Create:</label>
                <p className="read-only-text">{appInfo.app_permit_create}</p>
              </div>

              <div className="appInfo-form-group">
                <label>Open:</label>
                <p className="read-only-text">{appInfo.app_permit_open}</p>
              </div>

              <div className="appInfo-form-group">
                <label>ToDo:</label>
                <p className="read-only-text">{appInfo.app_permit_todolist}</p>
              </div>

              <div className="appInfo-form-group">
                <label>Doing:</label>
                <p className="read-only-text">{appInfo.app_permit_doing}</p>
              </div>

              <div className="appInfo-form-group">
                <label>Done:</label>
                <p className="read-only-text">{appInfo.app_permit_done}</p>
              </div>
            </div>

            {/* Right Column - Description */}
            <div className="appInfo-right-column">
              <div className="appInfo-form-group full-width">
                <label>Description:</label>
                <p className="read-only-text">{appInfo.app_description}</p>
              </div>
            </div>
          </div>

          {/* Button Group */}
          {/* <div className="button-group">
            <button type="button" className="cancel-button" onClick={closeModal}>
              Close
            </button>
          </div> */}
        </div>
      </Modal>
    </div>
  )
}

export default AppInfoModal
