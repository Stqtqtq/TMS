import React, { useState, useEffect } from "react"
import Login from "./components/Login.jsx"
import Header from "./components/Header.jsx"
import CreateGrp from "./components/CreateGrp.jsx"
import CreateUser from "./components/CreateUser.jsx"
import UsersTable from "./components/UsersTable.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import UserProfile from "./components/UserProfile.jsx"
import axios from "axios"

function App() {
  const [user, setUser] = useState(null)

  // const fetchUser = async () => {
  //   try {
  //     const response = await axios.get("http://localhost:5000/profile", {
  //       headers: { "Content-Type": "application/json" },
  //       withCredentials: true
  //     })
  //     setUser(response.data)
  //     console.log("setUser Response Data: ", response.data)
  //   } catch (error) {
  //     console.error("There was an error fetching the user data!", error)
  //     setUser(null) // Reset user state on error
  //   }
  // }

  // useEffect(() => {
  //   fetchUser() // Fetch user on initial load
  // }, [])

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<UserProfile />} />
          {/* <Route element={<ProtectedRoute />}> */}
          <Route
            path="/"
            element={
              <>
                <Header />
                {/* <UserProfile /> */}
                <CreateGrp />
                <CreateUser />
                <UsersTable />
              </>
            }
          />
          {/* </Route> */}
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
