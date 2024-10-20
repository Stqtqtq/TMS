import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import CreateApp from "./CreateApp.jsx"
import AppsTable from "./AppsTable.jsx"

const TMS = () => {
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [appsInfo, setAppsInfo] = useState([])
  const [groupOptions, setGroupOptions] = useState([])
  const [isPL, setIsPL] = useState(false)

  const fetchAppsInfo = async () => {
    try {
      const response = await axios.get("http://localhost:5000/getAppsInfo", {
        headers: { "Content-Type": "application/json" },
        withCredentials: true
      })
      setCurrentUser(response.data.currentUser)
      setIsPL(response.data.isPL)
      setAppsInfo(response.data.apps)
      setGroupOptions(
        response.data.groups.map(group => ({
          value: group.groupname,
          label: group.groupname
        }))
      )
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchAppsInfo()
  }, [])

  const handleOpenApp = app => {
    // Navigate to the '/app' endpoint with the selected app data in the state
    navigate("/app", { state: { app, currentUser } })
  }

  return (
    <div>
      {isPL && <CreateApp groupOptions={groupOptions} fetchAppsInfo={fetchAppsInfo} />}
      <AppsTable appsInfo={appsInfo} handleOpenApp={handleOpenApp} />
    </div>
  )
}

export default TMS
