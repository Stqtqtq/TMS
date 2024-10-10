import React, { useState, useEffect } from "react"
import "./TMS.css"

const TMS = () => {
  return (
    <div className="tms-container">
      {/* <button>Create App</button> */}
      <table>
        <thead>
          <tr>
            <th>Acronym</th>
            <th>Rnumber</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Task Create</th>
            <th>Task Open</th>
            <th>Task to-do</th>
            <th>Task Doing</th>
            <th>Task Done</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>{/* TBD */}</tbody>
      </table>
    </div>
  )
}

export default TMS
