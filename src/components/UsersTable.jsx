import React, { useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import Select from "react-select"
import axios from "axios"
import "./UsersTable.css"
import "react-toastify/dist/ReactToastify.css"

function UsersTable({ userData, setUserData, groupOptions, fetchUserData }) {
  const [editPost, setEditPost] = useState(null)
  const [selectGroups, setSelectedGroups] = useState([])

  const handleEdit = post => {
    setEditPost({ ...post, password: null })
    setSelectedGroups(post.groups.map(group => ({ value: group, label: group })))
  }

  const handleSave = async updatedPost => {
    try {
      const response = await axios.put(
        `http://localhost:5000/update`,
        {
          username: updatedPost.username,
          password: updatedPost.password || "",
          email: updatedPost.email,
          groups: selectGroups.map(group => group.value),
          isActive: updatedPost.isActive
        },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" }
        }
      )

      // Update the user data state with the newly updated data
      const updatedUserData = userData.map(user => (user.username === updatedPost.username ? { ...user, groups: selectGroups.map(group => group.value), ...updatedPost } : user))

      setUserData(updatedUserData)
      setEditPost(null)
      setSelectedGroups([])

      if (response.data.success) {
        toast.success(response.data.message, {
          position: "top-center",
          autoClose: 150,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          onClose: () => fetchUserData()
        })
      }
    } catch (err) {
      if (err.response.data.isAdmin === false || err.response.status === 401) {
        window.location.reload()
      }
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
    setEditPost(null)
  }

  return (
    <div className="usersTable-container">
      <ToastContainer limit={1} />
      <table>
        <tbody>
          {userData.map(item => (
            <tr key={item.username}>
              {editPost && editPost.username === item.username ? (
                <>
                  <td>{editPost.username}</td>
                  <td>
                    <input type="password" onChange={e => setEditPost({ ...editPost, password: e.target.value })} />
                  </td>
                  <td>
                    <input type="email" value={editPost.email} onChange={e => setEditPost({ ...editPost, email: e.target.value })} />
                  </td>
                  <td>
                    <Select isMulti closeMenuOnSelect={false} defaultValue={item.groups.map(group => ({ value: group, label: group }))} options={groupOptions} onChange={setSelectedGroups} />
                  </td>
                  <td>
                    <input type="checkbox" checked={editPost.isActive === 1} onChange={e => setEditPost({ ...editPost, isActive: e.target.checked ? 1 : 0 })} disabled={editPost.username === "admin"} />
                  </td>
                  <td>
                    <button onClick={() => handleSave(editPost)}>Save</button>
                    <button onClick={handleCancel}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{item.username}</td>
                  <td>******</td>
                  <td>{item.email}</td>
                  <td>
                    <Select isMulti isDisabled defaultValue={item.groups.map(group => ({ value: group, label: group }))} options={item.groups.map(group => ({ value: group, label: group }))} />
                  </td>
                  <td>
                    <input type="checkbox" checked={item.isActive === 1} disabled />
                  </td>
                  <td>
                    <button onClick={() => handleEdit(item)}>Edit</button>
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

export default UsersTable
