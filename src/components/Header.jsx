import React from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import "./Header.css"

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
      <div className="nav-links">
        <div>
          <Link to="/tms">Task Management System</Link>
          {isAdmin && <Link to="/ums">User Management System</Link>}
          <Link to="/profile">User Profile</Link>
        </div>
        <div className="right-section">
          <span>Welcome, {username}!</span>
          <button onClick={handleLogout}>Sign Out</button>
        </div>
      </div>
    </header>
  )
}

export default Header
