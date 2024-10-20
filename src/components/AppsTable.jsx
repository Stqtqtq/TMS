import React from "react"
import "./AppsTable.css"

const AppsTable = ({ appsInfo, handleOpenApp }) => {
  return (
    <div className="appsTable-container">
      <table>
        <tbody>
          {appsInfo.map(app => (
            <tr key={app.app_acronym}>
              <td>{app.app_acronym}</td>
              <td>{app.rnumber}</td>
              <td>{app.app_startdate}</td>
              <td>{app.app_enddate}</td>
              <td>{app.app_permit_create}</td>
              <td>{app.app_permit_open}</td>
              <td>{app.app_permit_todolist}</td>
              <td>{app.app_permit_doing}</td>
              <td>{app.app_permit_done}</td>
              <td>{app.app_description}</td>
              <td>
                <button onClick={() => handleOpenApp(app)}>Open App</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AppsTable
