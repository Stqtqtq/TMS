import React, { useState } from "react"
import Select from "react-select"
import axios from "axios"

function UsersTable({ userData, setUserData, groupOptions, fetchUserData }) {
  const [editPost, setEditPost] = useState(null)
  const [selectGroups, setSelectedGroups] = useState([])
  const [message, setMessage] = useState("")

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
          is_active: updatedPost.is_active
        },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" }
        }
      )

      // Update the user data state with the newly updated data
      const updatedUserData = userData.map(user => (user.username === updatedPost.username ? { ...user, groups: selectGroups.map(group => group.value), ...updatedPost } : user))

      setMessage(response.data.message)
      setUserData(updatedUserData)
      setEditPost(null)
      setSelectedGroups([])
      fetchUserData()
    } catch (err) {
      setMessage(err.response.data.message)
    }
  }

  const handleCancel = () => {
    setEditPost(null)
  }

  return (
    <div>
      <h1>Users Table</h1>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Password</th>
            <th>Email</th>
            <th>Groups</th>
            <th>is_active</th>
            <th>Actions</th>
          </tr>
        </thead>
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
                    <input type="checkbox" checked={editPost.is_active === 1} onChange={e => setEditPost({ ...editPost, is_active: e.target.checked ? 1 : 0 })} />
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
                    <Select isDisabled defaultValue={item.groups.map(group => ({ value: group, label: group }))} options={item.groups.map(group => ({ value: group, label: group }))} />
                  </td>
                  <td>
                    <input type="checkbox" checked={item.is_active === 1} disabled />
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
      {message && <p>{message}</p>}
    </div>
  )
}

export default UsersTable
