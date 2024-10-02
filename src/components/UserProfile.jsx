import React, { useEffect, useState } from "react"
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
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        })
        setUserData(response.data)
      } catch (err) {
        console.error("Error fetching user profile:", err)
      }
    }

    fetchUserProfile()
  }, [newEmail, newPassword])

  const handleEmailUpdate = async e => {
    e.preventDefault()
    try {
      const response = await axios.put(
        `http://localhost:5000/updateEmail`,
        { email: newEmail },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )
      setMessage(response.data.message)
      setUserData({ email: newEmail })
      setNewEmail("")
    } catch (err) {
      setMessage(err.response.data.message)
    }
  }

  const handlePasswordUpdate = async e => {
    e.preventDefault()
    try {
      const response = await axios.put(
        `http://localhost:5000/updatePw`,
        { password: newPassword },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      )
      setMessage(response.data.message)
      setUserData({ password: newPassword })
      setNewPassword("")
    } catch (err) {
      setMessage(err.response.data.message)
    }
  }

  if (!userData) {
    return <div>Loading...</div>
  }

  return (
    <div>
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
