import React, { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import axios from "axios"
import Login from "./components/Login.jsx"
import Header from "./components/Header.jsx"
import UserProfile from "./components/UserProfile.jsx"
import TMS from "./components/TMS.jsx"
import UMS from "./components/UMS.jsx"
import AppDashboard from "./components/AppDashboard.jsx"
import NotFound from "./components/NotFound.jsx"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const landingPage = async () => {
      try {
        const response = await axios.get("http://localhost:5000/landing", {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        })
        setIsAuthenticated(response.data.isAuthenticated)
        setIsAdmin(response.data.isAdmin)
        setUsername(response.data.username)
      } catch (err) {
        if (err.response && err.response.status === 403 && err.response.data.inactiveAccount) {
          setIsAuthenticated(false)
          setIsAdmin(false)
          setUsername("")
        }
      } finally {
        setIsLoading(false)
      }
    }
    landingPage()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <BrowserRouter>
      {isAuthenticated && <Header isAdmin={isAdmin} setIsAdmin={setIsAdmin} username={username} />}
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={isAuthenticated ? <TMS /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" />} />
        <Route path="/tms" element={isAuthenticated ? <TMS /> : <Navigate to="/login" />} />
        <Route path="/ums" element={isAuthenticated ? isAdmin ? <UMS /> : <Navigate to="/" /> : <Navigate to="/login" />} />
        <Route path="/app" element={<AppDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
