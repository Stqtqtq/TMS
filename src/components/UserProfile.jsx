import React, { useEffect, useState } from "react"
import Header from "./Header"
import axios from "axios"

const UserProfile = () => {
  const [userData, setUserData] = useState(null)
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/profile`, {
          // headers: { "Content-Type": "application/json" },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          withCredentials: true
        })
        setUserData(response.data)
      } catch (error) {
        console.error("Error fetching user profile:", error)
      }
    }

    fetchUserProfile()
  }, [newEmail])

  const handleEmailUpdate = async e => {
    e.preventDefault()
    try {
      const response = await axios.put(
        `http://localhost:5000/updateEmail/${userData.id}`,
        { email: newEmail },
        {
          // headers: { "Content-Type": "application/json" },
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          withCredentials: true
        }
      )
      setMessage("Email updated successfully!")
      setUserData({ email: newEmail })
      setNewEmail("") // Clear input
    } catch (error) {
      console.error("Error updating email:", error)
      setMessage("Failed to update email.")
    }
  }

  const handlePasswordUpdate = async e => {
    e.preventDefault()
    try {
      const response = await axios.put(
        `http://localhost:5000/updatePw/${userData.id}`,
        { password: newPassword },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )
      setMessage("Password updated successfully!")
      setUserData({ password: newPassword })
      setNewPassword("") // Clear input
    } catch (error) {
      console.error("Error updating password:", error)
      setMessage("Failed to update password.")
    }
  }

  if (!userData) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <Header />
      <h1>User Profile</h1>
      <p>Name: {userData.username}</p>
      <p>Email: {userData.email}</p>

      <form onSubmit={handleEmailUpdate}>
        <div>
          <label>
            New Email:
            <input
              type="email"
              value={newEmail}
              onChange={e => {
                setNewEmail(e.target.value)
              }}
              placeholder="Enter new email"
            />
          </label>
          <button type="submit">Change Email</button>
        </div>
      </form>

      <form onSubmit={handlePasswordUpdate}>
        <div>
          <label>
            New Password:
            <input
              type="password"
              value={newPassword}
              onChange={e => {
                setNewPassword(e.target.value)
              }}
              placeholder="Enter new password"
            />
          </label>
          <button type="submit">Change Password</button>
        </div>
      </form>

      {message && <p>{message}</p>}
    </div>
  )
}

export default UserProfile
