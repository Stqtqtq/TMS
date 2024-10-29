import React, { useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import axios from "axios"
import Select from "react-select"
import "./CreateApp.css"

const CreateApp = ({ groupOptions, fetchAppsInfo }) => {
  // const today = new Date().toISOString().split("T")[0]

  const [appForm, setAppForm] = useState({
    appAcronym: "",
    appRNumber: "",
    appStartDate: "",
    appEndDate: "",
    appCreate: "",
    appOpen: "",
    appTodo: "",
    appDoing: "",
    appDone: "",
    description: ""
  })

  const handleChange = e => {
    const { name, value } = e.target
    setAppForm({
      ...appForm,
      [name]: value
    })
  }

  const handleSelectChange = (name, selectedOption) => {
    setAppForm({
      ...appForm,
      [name]: selectedOption ? selectedOption.value : ""
    })
  }

  const handleSubmit = async e => {
    e.preventDefault()

    try {
      const response = await axios.post(
        "http://localhost:3000/createApp",
        {
          ...appForm
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )

      setAppForm({
        appAcronym: "",
        appRNumber: "",
        appStartDate: "",
        appEndDate: "",
        appCreate: null,
        appOpen: null,
        appTodo: null,
        appDoing: null,
        appDone: null,
        description: ""
      })

      if (response.data.success) {
        toast.success(response.data.message, {
          position: "top-center",
          autoClose: 150,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          onClose: () => fetchAppsInfo()
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
  return (
    <div className="createApp-container">
      <ToastContainer limit={1} />
      <form onSubmit={handleSubmit}>
        <table>
          <thead>
            <tr>
              <th>Acronym</th>
              <th>Rnumber</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Task Create</th>
              <th>Task Open</th>
              <th>Task To Do</th>
              <th>Task Doing</th>
              <th>Task Done</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input type="text" name="appAcronym" value={appForm.appAcronym} onChange={handleChange} />
              </td>
              <td>
                <input type="text" name="appRNumber" value={appForm.appRNumber} onChange={handleChange} />
              </td>
              <td>
                <input type="date" name="appStartDate" value={appForm.appStartDate} onChange={handleChange} />
              </td>
              <td>
                <input type="date" name="appEndDate" value={appForm.appEndDate} onChange={handleChange} />
              </td>
              <td>
                <Select name="appCreate" isClearable closeMenuOnSelect={true} value={groupOptions.find(option => option.value === appForm.appCreate) || null} onChange={selectedOption => handleSelectChange("appCreate", selectedOption)} options={groupOptions} />
              </td>
              <td>
                <Select name="appOpen" isClearable closeMenuOnSelect={true} value={groupOptions.find(option => option.value === appForm.appOpen) || null} onChange={selectedOption => handleSelectChange("appOpen", selectedOption)} options={groupOptions} />
              </td>
              <td>
                <Select name="appTodo" isClearable closeMenuOnSelect={true} value={groupOptions.find(option => option.value === appForm.appTodo) || null} onChange={selectedOption => handleSelectChange("appTodo", selectedOption)} options={groupOptions} />
              </td>
              <td>
                <Select name="appDoing" isClearable closeMenuOnSelect={true} value={groupOptions.find(option => option.value === appForm.appDoing) || null} onChange={selectedOption => handleSelectChange("appDoing", selectedOption)} options={groupOptions} />
              </td>
              <td>
                <Select name="appDone" isClearable closeMenuOnSelect={true} value={groupOptions.find(option => option.value === appForm.appDone) || null} onChange={selectedOption => handleSelectChange("appDone", selectedOption)} options={groupOptions} />
              </td>
              <td>
                <textarea name="description" value={appForm.description} onChange={handleChange} rows="5" cols={40} maxLength={255} />
              </td>
              <td>
                <button>Create App</button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  )
}

export default CreateApp
