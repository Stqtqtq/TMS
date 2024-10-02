import React from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"

const Header = ({ isAdmin, username }) => {
  // const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/logout",
        {},
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )
      // console.log("Successfully logged out")
      // navigate("/login")
      window.location.reload()
    } catch (err) {
      console.error("Error logging out:", err)
    }
  }

  return (
    <header>
      <Link to="/tms">Task Management System</Link>
      {isAdmin && <Link to="/ums">User Management System</Link>}
      <Link to="/profile">User Profile</Link>
      <span>Welcome, {username}!</span>
      <button onClick={handleLogout}>Sign Out</button>
    </header>
  )
}

export default Header
