import React, { useState, useEffect } from "react"
import Select from "react-select"
import axios from "axios"

const Form = () => {
  const [userData, setUserData] = useState([])
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [active, setActive] = useState(true)
  const [groupOptions, setGroupOptions] = useState([])
  const [selectGroups, setSelectGroups] = useState([])
  const [message, setMessage] = useState("")

  useEffect(() => {
    axios
      .get("http://localhost:5000/", {
        // headers: { "Content-Type": "application/json" },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        withCredentials: true
      })
      .then(response => {
        console.log("USERTABLE COMPONENT RESPONSE DATA: ", response.data)
        // setPosts(response.data)
        setUserData(response.data)
        setGroupOptions(response.data.groups.map(group => ({ value: group.groupname, label: group.groupname })))
        // setGrpData(response.data.groups)
      })
      .catch(error => {
        console.error("There was an error fetching the data!", error)
      })
  }, [])

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
          // headers: { "Content-Type": "application/json" },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          withCredentials: true
        }
      )

      setUsername("")
      setPassword("")
      setEmail("")
      setSelectGroups([])
      setGroupOptions([])
      setActive(true)
      setMessage(response.data.message)
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
      <h1>Create User</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Groups:</label>
          <Select isMulti closeMenuOnSelect={false} value={selectGroups} onChange={setSelectGroups} options={groupOptions} />
        </div>
        <div>
          <label>is_active:</label>
          <input type="checkbox" onChange={e => setActive(e.target.checked)} checked={active} />
        </div>
        <button type="submit">Submit</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}

export default Form
