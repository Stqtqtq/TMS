import React, { useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import axios from "axios"
import "./CreateGrp.css"
import "react-toastify/dist/ReactToastify.css"

const CreateGrp = ({ addGroup }) => {
  const [grpName, setGrpName] = useState("")

  const handleSubmit = async e => {
    e.preventDefault()

    try {
      const response = await axios.post(
        "http://localhost:3000/createGrp",
        {
          groupname: grpName
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )

      setGrpName("")
      addGroup(grpName)

      if (response.data.success) {
        toast.success(response.data.message, {
          position: "top-center",
          autoClose: 150,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false
        })
      }
    } catch (err) {
      if (err.response.data.isAdmin === false || err.response.status === 401) {
        window.location.reload()
      }
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
    <div className="createGrp-container">
      <ToastContainer limit={1} />
      <form onSubmit={handleSubmit}>
        <label>Group Name:</label>
        <input type="text" value={grpName} onChange={e => setGrpName(e.target.value)} />
        <button type="submit">Create</button>
      </form>
    </div>
  )
}

export default CreateGrp
