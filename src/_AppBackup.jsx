import React, { useState, useEffect } from "react"
import Login from "./components/Login.jsx"
import Header from "./components/Header.jsx"
import CreateGrp from "./components/CreateGrp.jsx"
import CreateUser from "./components/CreateUser.jsx"
import UsersTable from "./components/UsersTable.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"
import Test from "./components/Test.jsx"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import UserProfile from "./components/UserProfile.jsx"
import axios from "axios"

function App() {
  const [userData, setUserData] = useState([])
  const [groupOptions, setGroupOptions] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const addGroup = newGroup => {
    setGroupOptions(prev => [...prev, { value: newGroup, label: newGroup }])
  }

  const fetchUserData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/", {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        withCredentials: true
      })
      console.log("USERTABLE COMPONENT RESPONSE DATA: ", response.data)
      if (response.data.token) {
        setIsAuthenticated(true)
        console.log("isAuthenticated: ", isAuthenticated)
        const currentUserIsAdmin = response.data.currentUser.groups
        setIsAdmin(currentUserIsAdmin.some(group => group.toLowerCase() === "admin"))
        console.log("isAdmin: ", isAdmin)
        setUserData(response.data.users)
        console.log("USERS DATA: ", userData)
        console.log("USERS DATA: ", response.data.users)
        setGroupOptions(response.data.groups.map(group => ({ value: group.groupname, label: group.groupname })))
      } else {
        setIsAuthenticated(false)
        setIsAdmin(false)
        setUserData([])
      }

      // Check if the logged-in user is an admin
      // const currentUser = response.data.currentUser; // Assuming this is where you get the current user
      // setIsAdmin(currentUser.groups.includes("admin")); // Update this based on your user structure
    } catch (err) {
      console.error("There was an error fetching the data!", err)
      setIsAuthenticated(false)
      setIsAdmin(false)
      setUserData([])
    }
  }

  useEffect(() => {
    fetchUserData() // Call the function to fetch user data
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login fetchUserData={fetchUserData} />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route
          path="/test"
          element={
            <>
              <Header setUserData={setUserData} setIsAdmin={setIsAdmin} setIsAuthenticated={setIsAuthenticated} />
              <Test />
            </>
          }
        />
        <Route
          path="/"
          element={
            <>
              <Header setUserData={setUserData} setIsAdmin={setIsAdmin} setIsAuthenticated={setIsAuthenticated} />
              {/* <UserProfile userData={userData} setUserData={setUserData} /> */}
              <CreateGrp addGroup={addGroup} />
              <CreateUser groupOptions={groupOptions} fetchUserData={fetchUserData} />
              <UsersTable userData={userData} setUserData={setUserData} groupOptions={groupOptions} fetchUserData={fetchUserData} />
            </>
          }
        />
      </Routes>
    </BrowserRouter>

    // <BrowserRouter>
    //   <Routes>
    //     <Route path="/login" element={<Login fetchUserData={fetchUserData} />} />
    //     {/* <Route path="/profile" element={<UserProfile />} /> */}
    //     <Route
    //       path="/test"
    //       element={
    //         <ProtectedRoute isAdmin={isAdmin} isAuthenticated={isAuthenticated}>
    //           <Header setUserData={setUserData} setIsAdmin={setIsAdmin} setIsAuthenticated={setIsAuthenticated} />
    //           <Test />
    //         </ProtectedRoute>
    //       }
    //     />
    //     <Route
    //       path="/"
    //       element={
    //         <ProtectedRoute isAdmin={isAdmin} isAuthenticated={isAuthenticated}>
    //           <Header setUserData={setUserData} setIsAdmin={setIsAdmin} setIsAuthenticated={setIsAuthenticated} />
    //           {/* <UserProfile userData={userData} setUserData={setUserData} /> */}
    //           <CreateGrp addGroup={addGroup} />
    //           <CreateUser groupOptions={groupOptions} fetchUserData={fetchUserData} />
    //           <UsersTable userData={userData} setUserData={setUserData} groupOptions={groupOptions} fetchUserData={fetchUserData} />
    //         </ProtectedRoute>
    //       }
    //     />
    //   </Routes>
    // </BrowserRouter>

    // <BrowserRouter>
    //   <Routes>
    //     <Route path="/login" element={<Login />} />
    //     <Route path="/profile" element={<UserProfile />} />
    //     {/* <Route element={<ProtectedRoute />}> */}
    //     <Route
    //       path="/"
    //       element={
    //         <>
    //           <Header />
    //           {/* <UserProfile /> */}
    //           <CreateGrp addGroup={addGroup} />
    //           <CreateUser groupOptions={groupOptions} refreshUserData={fetchUserData} />
    //           <UsersTable userData={userData} setUserData={setUserData} groupOptions={groupOptions} refreshUserData={fetchUserData} />
    //         </>
    //       }
    //     />
    //   </Routes>
    // </BrowserRouter>
  )
}

export default App
