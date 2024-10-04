import React, { useState } from "react"
import axios from "axios"
import "./CreateGrp.css"

const CreateGrp = ({ addGroup }) => {
  const [grpName, setGrpName] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async e => {
    e.preventDefault()

    try {
      const response = await axios.post(
        "http://localhost:5000/createGrp",
        {
          groupname: grpName
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )

      setMessage(response.data.message)
      setGrpName("")
      addGroup(grpName)
    } catch (err) {
      if (!err?.response) {
        setMessage("No Server Response")
      } else {
        setMessage(err.response.data.message)
      }
    }
  }

  return (
    <div>
      {/* <h1>Create Group</h1> */}
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Group Name:</label>
          <input type="text" value={grpName} onChange={e => setGrpName(e.target.value)} required />
          <button type="submit">Create</button>
        </div>
      </form>
    </div>
  )
}

export default CreateGrp
