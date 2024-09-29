import React from "react"
import axios from "axios"
import { useNavigate, Link } from "react-router-dom"

const Header = () => {
  const navigate = useNavigate()

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
      console.log("Successfully logged out")
      navigate("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return (
    <header>
      {/* <p>{`Logged in as: ${username}`}</p> */}
      <Link to="/profile/">User Profile</Link>
      <button onClick={handleLogout}>Sign Out</button>
    </header>
  )
}

export default Header
