import React, { useState, useEffect } from "react"
import Select from "react-select"
import axios from "axios"
import "./UMS.css"

const CreateUser = ({ groupOptions, fetchUserData }) => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [active, setActive] = useState(true)
  const [selectGroups, setSelectGroups] = useState([])
  const [message, setMessage] = useState("")

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
          is_active: active ? 1 : 0
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )

      setMessage(response.data.message)
      setUsername("")
      setPassword("")
      setEmail("")
      setSelectGroups([])
      setActive(true)
      fetchUserData()
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
      {/* <h1>Create User</h1> */}
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Password</th>
              <th>Email</th>
              <th>Groups</th>
              <th>is_active</th>
              <th>Create</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required style={{ width: "100%" }} />
              </td>
              <td>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: "100%" }} />
              </td>
              <td>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: "100%" }} />
              </td>
              <td className="width-column">
                <Select isMulti closeMenuOnSelect={false} value={selectGroups} onChange={setSelectGroups} options={groupOptions} styles={{ container: provided => ({ ...provided, width: "100%" }) }} />
              </td>
              <td style={{ textAlign: "center" }}>
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
