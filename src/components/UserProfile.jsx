import React, { useEffect, useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import axios from "axios"
import "./UserProfile.css"
import "react-toastify/dist/ReactToastify.css"

const UserProfile = () => {
  const [userData, setUserData] = useState(null)
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")

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
      setUserData({ email: newEmail })
      setNewEmail("")

      if (response.data.success) {
        toast.success(response.data.message, {
          position: "top-center",
          autoClose: 150,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false
        })
      }
    } catch (err) {
      toast.error(err.response.data.message, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        style: { width: "450px" }
      })
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
      setUserData({ password: newPassword })
      setNewPassword("")

      if (response.data.success) {
        toast.success(response.data.message, {
          position: "top-center",
          autoClose: 150,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false
        })
      }
    } catch (err) {
      toast.error(err.response.data.message, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        style: { width: "450px" }
      })
    }
  }

  if (!userData) {
    return <div>Loading...</div>
  }

  return (
    <div className="profile-container-wrapper">
      <ToastContainer limit={1} />
      <div className="profile-container">
        <h1>User Profile</h1>
        <p>Name: {userData.username}</p>
        <p>Email: {userData.email}</p>

        <form onSubmit={handleEmailUpdate}>
          <label>New Email:</label>
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Enter new email" />
          <button type="submit">Change Email</button>
        </form>

        <form onSubmit={handlePasswordUpdate}>
          <label>New Password:</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
          <button type="submit">Change Password</button>
        </form>
      </div>
    </div>
  )
}

export default UserProfile
