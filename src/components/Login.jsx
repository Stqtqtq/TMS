import React, { useState } from "react"
import axios from "axios"
import "./Login.css"

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

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
      window.location.reload()
    } catch (err) {
      setMessage(err.response?.data?.message || "Invalid Credentials.")
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-container">
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
          {message && <p className="error">{message}</p>}
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  )
}

export default Login
