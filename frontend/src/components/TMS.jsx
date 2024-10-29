import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import CreateApp from "./CreateApp.jsx"
import AppsTable from "./AppsTable.jsx"
import "./AppsTable.css"

const TMS = () => {
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [appsInfo, setAppsInfo] = useState([])
  const [groupOptions, setGroupOptions] = useState([])
  const [isPL, setIsPL] = useState(false)

  const fetchAppsInfo = async () => {
    try {
      const response = await axios.get("http://localhost:3000/getAppsInfo", {
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
      {!isPL && (
        <div className="appsTable-header">
          <table className="apps-header-table">
            <thead>
              <tr className="apps-header-row">
                <th className="apps-header">Acronym</th>
                <th className="apps-header">Rnumber</th>
                <th className="apps-header">Start Date</th>
                <th className="apps-header">End Date</th>
                <th className="apps-header">Task Create</th>
                <th className="apps-header">Task Open</th>
                <th className="apps-header">Task To Do</th>
                <th className="apps-header">Task Doing</th>
                <th className="apps-header">Task Done</th>
                <th className="apps-header">Description</th>
                <th className="apps-header">Actions</th>
              </tr>
            </thead>
          </table>
        </div>
      )}
      <AppsTable appsInfo={appsInfo} setAppsInfo={setAppsInfo} groupOptions={groupOptions} fetchAppsInfo={fetchAppsInfo} handleOpenApp={handleOpenApp} />
    </div>
  )
}

export default TMS
