import React, { useState, useEffect } from "react"
import Select from "react-select"
import axios from "axios"

function UsersTable() {
  // const [posts, setPosts] = useState([])
  const [userData, setUserData] = useState([])
  // const [grpData, setGrpData] = useState([])
  const [editPost, setEditPost] = useState(null)
  const [groupOptions, setGroupOptions] = useState([])
  const [selectGroups, setSelectedGroups] = useState([])

  useEffect(() => {
    axios
      .get("http://localhost:5000/", {
        // headers: { "Content-Type": "application/json" },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        withCredentials: true
      })
      .then(response => {
        console.log("USERTABLE COMPONENT RESPONSE DATA: ", response.data)
        // setPosts(response.data)
        setUserData(response.data.users)
        setGroupOptions(response.data.groups.map(group => ({ value: group.groupname, label: group.groupname })))
        // setGrpData(response.data.groups)
      })
      .catch(error => {
        console.error("There was an error fetching the data!", error)
      })
  }, []) // add editPost to update the table to reflect changes, but if do that need figure out how to
  // delay the change such that it does not log every keystroke and on<actions>

  const handleEdit = post => {
    setEditPost({ ...post })
    setSelectedGroups(post.groups.map(group => ({ value: group, label: group })))
  }

  const handleSave = async updatedPost => {
    try {
      const response = await axios.put(`http://localhost:5000/update/${updatedPost.id}`, {
        username: updatedPost.username,
        password: updatedPost.password,
        email: updatedPost.email,
        groups: selectGroups.map(group => group.value),
        is_active: updatedPost.is_active
      })
      console.log(updatedPost)
      // setPosts(posts.map(post => (post.id === updatedPost.id ? updatedPost : post)))
      // setUserData(userData.map(user => (user.id === updatedPost.id ? updatedPost : user)))
      // setGrpData(grpData.map(grp => (grp.id === updatedPost ? updatedPost : grp)))

      // Update the user data state with the newly updated data
      const updatedUserData = userData.map(user => (user.id === updatedPost.id ? { ...user, groups: selectGroups.map(group => group.value), ...updatedPost } : user))
      setUserData(updatedUserData)

      setEditPost(null)
      setSelectedGroups([]) // NOT SURE ABOUT THIS
    } catch (error) {
      console.error("There was an error updating the post!", error)
    }
  }

  const handleCancel = () => {
    setEditPost(null)
  }

  return (
    <div>
      <h1>TEST</h1>
      {/* {userData.length > 0 ? ( */}
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
            <tr key={item.id}>
              {editPost && editPost.id === item.id ? (
                <>
                  <td>{editPost.username}</td>
                  <td>
                    <input type="password" value={editPost.password} onChange={e => setEditPost({ ...editPost, password: e.target.value })} />
                  </td>
                  <td>
                    <input type="email" value={editPost.email} onChange={e => setEditPost({ ...editPost, email: e.target.value })} />
                  </td>
                  <td>
                    <Select isMulti closeMenuOnSelect={false} defaultValue={item.groups.map(group => ({ value: group, label: group }))} options={groupOptions} onChange={setSelectedGroups} />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={editPost.is_active === 1} // Check if is_active is 1
                      onChange={e => setEditPost({ ...editPost, is_active: e.target.checked ? 1 : 0 })} // Update based on checkbox state
                    />
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
                    <input
                      type="checkbox"
                      checked={item.is_active === 1} // Check if is_active is 1
                      disabled // Disable the checkbox in read-only mode
                    />
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
      {/* ) : (
        <p>No data available</p>
      )} */}
    </div>
  )
}

export default UsersTable
