import React, { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import axios from "axios"
import Login from "./components/Login.jsx"
import Header from "./components/Header.jsx"
import UserProfile from "./components/UserProfile.jsx"
import TMS from "./components/TMS.jsx"
import UMS from "./components/UMS.jsx"
import NotFound from "./components/NotFound.jsx"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("http://localhost:5000/checkAuth", {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        })
        setIsAuthenticated(response.data.isAuthenticated)
        setIsAdmin(response.data.isAdmin)
        setUsername(response.data.username)
      } catch (err) {
        if (err.response && err.response.status === 403 && err.response.data.inactiveAccount) {
          // alert("Your account has been deactivated. Please contact an administrator.")
          setIsAuthenticated(false)
          setIsAdmin(false)
          setUsername("")
        }
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  // Add this effect to periodically check authentication status
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (isAuthenticated) {
  //       checkAuth()
  //     }
  //   }, 60000) // Check every minute

  //   return () => clearInterval(interval)
  // }, [isAuthenticated])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <BrowserRouter>
      {isAuthenticated && <Header isAdmin={isAdmin} username={username} />}
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={isAuthenticated ? <TMS /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" />} />
        <Route path="/tms" element={isAuthenticated ? <TMS /> : <Navigate to="/login" />} />
        {/* <Route path="/ums" element={isAuthenticated && isAdmin ? <UMS /> : isAuthenticated ? <Navigate to="/" /> : <Navigate to="/login" />} /> */}
        <Route path="/ums" element={isAuthenticated ? isAdmin ? <UMS /> : <Navigate to="/" /> : <Navigate to="/login" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
