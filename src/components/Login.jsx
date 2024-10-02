import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  // const navigate = useNavigate()

  const handleLogin = async e => {
    e.preventDefault()

    try {
      const response = await axios.post(
        "http://localhost:5000/login",
        { username, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )
      // console.log("Login successful:", response.data)
      // navigate("/")
      window.location.reload()
    } catch (err) {
      setMessage(err.response?.data?.message || "An error has occured")
    }
  }

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label>Username:</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}

export default Login
