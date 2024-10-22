import React, { useState, useEffect } from "react"
import { ToastContainer, toast } from "react-toastify"
import axios from "axios"
import Modal from "react-modal"
import "./PlansModal.css"

Modal.setAppElement("#root")

const PlansModal = ({ appInfo, isPM, plansInfo, fetchPlansInfo, isOpen, closeModal }) => {
  const today = new Date().toISOString().split("T")[0]

  const [planForm, setPlanForm] = useState({
    appAcronym: appInfo?.app_acronym || "",
    planName: "",
    planStartDate: today,
    planEndDate: today,
    colour: "#ffffff"
  })

  const handleChange = e => {
    const { name, value } = e.target
    setPlanForm({
      ...planForm,
      [name]: value
    })
  }

  const handleSubmit = async e => {
    e.preventDefault()

    try {
      const response = await axios.post(
        "http://localhost:5000/createPlan",
        {
          ...planForm
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )
      setPlanForm({
        appAcronym: appInfo?.app_acronym || "",
        planName: "",
        planStartDate: today,
        planEndDate: today,
        colour: "#ffffff"
      })

      if (response.data.success) {
        toast.success(response.data.message, {
          position: "top-center",
          autoClose: 150,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          onClose: () => fetchPlansInfo()
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

  useEffect(() => {
    if (isOpen) {
      fetchPlansInfo()
      setPlanForm(prevForm => ({
        ...prevForm,
        appAcronym: appInfo?.app_acronym || ""
      }))
    }
  }, [isOpen, appInfo])

  return (
    <div id="root">
      <Modal isOpen={isOpen} contentLabel="Example Modal">
        <div className="plans-container">
          <ToastContainer limit={1} />
          <button className="close-button" onClick={closeModal}>
            &times;
          </button>
          {isPM ? (
            <div className="createPlan-container">
              <form onSubmit={handleSubmit}>
                <table>
                  <thead>
                    <tr>
                      <th>Plan name:</th>
                      <th>Start Date:</th>
                      <th>End Date:</th>
                      <th>Colour:</th>
                      {/* <th>Create</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <input type="text" name="planName" value={planForm.planName} onChange={handleChange} />
                      </td>
                      <td>
                        <input type="date" name="planStartDate" value={planForm.planStartDate} onChange={handleChange} />
                      </td>
                      <td>
                        <input type="date" name="planEndDate" value={planForm.planEndDate} onChange={handleChange} />
                      </td>
                      <td>
                        <input type="color" name="colour" value={planForm.colour} onChange={handleChange} />
                      </td>
                      <td>
                        <button>Create</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </form>
            </div>
          ) : null}

          <div className="plansInfo-container">
            <table>
              {!isPM && (
                <thead>
                  <tr>
                    <th>Plan name:</th>
                    <th>Start Date:</th>
                    <th>End Date:</th>
                    <th>Colour:</th>
                  </tr>
                </thead>
              )}
              <tbody>
                {plansInfo.map(plan => (
                  <tr key={plan.plan_mvp_name}>
                    <td>{plan.plan_mvp_name}</td>
                    <td>{plan.plan_startdate}</td>
                    <td>{plan.plan_enddate}</td>
                    <td>
                      <input type="color" value={plan.plan_colour} disabled />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default PlansModal
