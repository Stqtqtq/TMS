import React from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import "./Header.css"

const Header = ({ isAdmin, username, setIsAdmin }) => {
  const handleLogout = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3000/logout",
        {},
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )
      window.location.reload()
    } catch (err) {
      console.error("Error logging out:", err)
    }
  }

  const handleClick = path => {
    window.location.herf(path)
  }

  return (
    <header>
      <div className="nav-links">
        <div>
          <Link to="/tms" onClick={() => handleClick("/tms")}>
            Task Management System
          </Link>
          {isAdmin && (
            <Link to="/ums" onClick={() => handleClick("/ums")}>
              User Management System
            </Link>
          )}
          <Link to="/profile" onClick={() => handleClick("/profile")}>
            User Profile
          </Link>
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
