import React, { useState, useEffect } from "react"
import { ToastContainer, toast } from "react-toastify"
import Select from "react-select"
import axios from "axios"
import "./CreateUser.css"
import "react-toastify/dist/ReactToastify.css"

const CreateUser = ({ groupOptions, fetchUserData }) => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [active, setActive] = useState(true)
  const [selectGroups, setSelectGroups] = useState([])

  const handleSubmit = async e => {
    e.preventDefault()

    try {
      const response = await axios.post(
        "http://localhost:5000/createUser",
        {
          username,
          password,
          email,
          groups: selectGroups.map(group => group.value),
          isActive: active ? 1 : 0
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )

      setUsername("")
      setPassword("")
      setEmail("")
      setSelectGroups([])
      setActive(true)

      if (response.data.success) {
        toast.success(response.data.message, {
          position: "top-center",
          autoClose: 150,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          onClose: () => fetchUserData()
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
    <div className="createUser-container">
      <ToastContainer limit={1} />
      <form onSubmit={handleSubmit}>
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Password</th>
              <th>Email</th>
              <th>Groups</th>
              <th>Active</th>
              <th>Create/Edit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
              </td>
              <td>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </td>
              <td>
                <input type="text" value={email} onChange={e => setEmail(e.target.value)} />
              </td>
              <td>
                <Select isMulti closeMenuOnSelect={false} value={selectGroups} onChange={setSelectGroups} options={groupOptions} />
              </td>
              <td>
                <input type="checkbox" onChange={e => setActive(e.target.checked)} checked={active} />
              </td>
              <td>
                <button type="submit">Create</button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  )
}

export default CreateUser
