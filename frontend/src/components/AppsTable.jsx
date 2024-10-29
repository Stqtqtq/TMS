import React, { useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import Select from "react-select"
import axios from "axios"
import "./AppsTable.css"

const AppsTable = ({ appsInfo, setAppsInfo, groupOptions, fetchAppsInfo, handleOpenApp }) => {
  const [editApp, setEditApp] = useState(null)

  const handleEditApp = app => {
    setEditApp({ ...app })
  }

  const handleSave = async () => {
    try {
      const response = await axios.post(
        `http://localhost:3000/updateApp`,
        {
          appAcronym: editApp.app_acronym,
          appRNumber: editApp.app_rnumber,
          appStartDate: editApp.app_startdate,
          appEndDate: editApp.app_enddate,
          appCreate: editApp.app_permit_create,
          appOpen: editApp.app_permit_open,
          appTodo: editApp.app_permit_todolist,
          appDoing: editApp.app_permit_doing,
          appDone: editApp.app_permit_done,
          description: editApp.app_description
        },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" }
        }
      )

      if (response.data.success) {
        const updatedApps = appsInfo.map(app => (app.app_acronym === editApp.app_acronym ? editApp : app))
        setAppsInfo(updatedApps)
        setEditApp(null)
        toast.success(response.data.message, {
          position: "top-center",
          autoClose: 150,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          onClose: () => fetchAppsInfo()
        })
      }
    } catch (err) {
      console.error(err)
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

  const handleCancel = () => {
    setEditApp(null)
  }

  // return (
  //   <div className="appsTable-container">
  //     <table>
  //       <tbody>
  //         {appsInfo.map(app => (
  //           <tr key={app.app_acronym}>
  //             <td>{app.app_acronym}</td>
  //             <td>{app.app_rnumber}</td>
  //             <td>{app.app_startdate}</td>
  //             <td>{app.app_enddate}</td>
  //             <td>{app.app_permit_create}</td>
  //             <td>{app.app_permit_open}</td>
  //             <td>{app.app_permit_todolist}</td>
  //             <td>{app.app_permit_doing}</td>
  //             <td>{app.app_permit_done}</td>
  //             <td>
  //               <textarea style={{ resize: "vertical" }} value={app.app_description} rows="5" cols="40" disabled />
  //             </td>

  //             <td>
  //               <button onClick={() => handleOpenApp(app)}>Open App</button>
  //             </td>
  //           </tr>
  //         ))}
  //       </tbody>
  //     </table>
  //   </div>
  // )

  return (
    <div className="appsTable-container">
      <ToastContainer limit={1} />
      <table>
        <tbody>
          {appsInfo.map(app => (
            <tr key={app.app_acronym}>
              {editApp && editApp.app_acronym === app.app_acronym ? (
                <>
                  <td>
                    <input type="text" value={editApp.app_acronym} disabled />
                  </td>
                  <td>
                    <input type="text" value={editApp.app_rnumber} disabled />
                  </td>
                  <td>
                    <input type="date" value={editApp.app_startdate} onChange={e => setEditApp({ ...editApp, app_startdate: e.target.value })} />
                  </td>
                  <td>
                    <input type="date" value={editApp.app_enddate} onChange={e => setEditApp({ ...editApp, app_enddate: e.target.value })} />
                  </td>
                  {/* Use Select components for permit fields */}
                  <td>
                    <Select isClearable options={groupOptions} value={groupOptions.find(option => option.value === editApp.app_permit_create)} onChange={selected => setEditApp({ ...editApp, app_permit_create: selected ? selected.value : "" })} placeholder="Select Group" />
                  </td>
                  <td>
                    <Select isClearable options={groupOptions} value={groupOptions.find(option => option.value === editApp.app_permit_open)} onChange={selected => setEditApp({ ...editApp, app_permit_open: selected ? selected.value : "" })} placeholder="Select Group" />
                  </td>
                  <td>
                    <Select isClearable options={groupOptions} value={groupOptions.find(option => option.value === editApp.app_permit_todolist)} onChange={selected => setEditApp({ ...editApp, app_permit_todolist: selected ? selected.value : "" })} placeholder="Select Group" />
                  </td>
                  <td>
                    <Select isClearable options={groupOptions} value={groupOptions.find(option => option.value === editApp.app_permit_doing)} onChange={selected => setEditApp({ ...editApp, app_permit_doing: selected ? selected.value : "" })} placeholder="Select Group" />
                  </td>
                  <td>
                    <Select isClearable options={groupOptions} value={groupOptions.find(option => option.value === editApp.app_permit_done)} onChange={selected => setEditApp({ ...editApp, app_permit_done: selected ? selected.value : "" })} placeholder="Select Group" />
                  </td>
                  <td>
                    <textarea style={{ resize: "vertical" }} rows={5} cols={40} value={editApp.app_description} onChange={e => setEditApp({ ...editApp, app_description: e.target.value })}></textarea>
                  </td>
                  <td>
                    <button onClick={handleSave}>Save</button>
                    <button onClick={handleCancel}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{app.app_acronym}</td>
                  <td>{app.app_rnumber}</td>
                  <td>{app.app_startdate}</td>
                  <td>{app.app_enddate}</td>
                  <td>{app.app_permit_create}</td>
                  <td>{app.app_permit_open}</td>
                  <td>{app.app_permit_todolist}</td>
                  <td>{app.app_permit_doing}</td>
                  <td>{app.app_permit_done}</td>
                  <td>
                    <textarea style={{ resize: "vertical" }} rows={5} cols={40} value={app.app_description} disabled />
                  </td>
                  <td>
                    <button onClick={() => handleOpenApp(app)}>Open App</button>
                    <button onClick={() => handleEditApp(app)}>Edit App</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AppsTable
