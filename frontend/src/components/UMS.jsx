import React, { useState, useEffect } from "react"
import axios from "axios"
import CreateGrp from "./CreateGrp.jsx"
import CreateUser from "./CreateUser.jsx"
import UsersTable from "./UsersTable.jsx"
// import "./UMS.css"

const UMS = () => {
  const [userData, setUserData] = useState([])
  const [groupOptions, setGroupOptions] = useState([])
  const addGroup = newGroup => {
    setGroupOptions(prev => [...prev, { value: newGroup, label: newGroup }])
  }

  const fetchUserData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/getUsersInfo", {
        headers: { "Content-Type": "application/json" },
        withCredentials: true
      })
      setUserData(response.data.users)
      setGroupOptions(
        response.data.groups.map(group => ({
          value: group.groupname,
          label: group.groupname
        }))
      )
    } catch (err) {
      if (err.response.data.isAdmin === false || err.response.status === 401) {
        window.location.reload()
      }
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  return (
    <div>
      <CreateGrp addGroup={addGroup} />
      <CreateUser groupOptions={groupOptions} fetchUserData={fetchUserData} />
      <UsersTable userData={userData} setUserData={setUserData} groupOptions={groupOptions} fetchUserData={fetchUserData} />
    </div>
  )
}

export default UMS
