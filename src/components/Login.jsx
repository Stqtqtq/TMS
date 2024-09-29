import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const Login = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  const handleLogin = async e => {
    e.preventDefault()

    try {
      const response = await axios.post(
        "http://localhost:5000/login",
        { username, password },
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          withCredentials: true
        }
      )
      setIsLoggedIn(true)
      console.log("LOGIN RESPONSE BODY: ", response.body)
      console.log("Login successful:", response.data)
      console.log("CHECKING RESPONSE: ", response)
      // setMessage("Login successful!")
      navigate("/")
    } catch (err) {
      if (!err?.response) {
        setMessage("No Server Response")
      } else {
        setMessage("Invalid username or password")
      }
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
