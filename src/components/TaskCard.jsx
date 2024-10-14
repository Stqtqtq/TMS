import React from "react"
import "./TaskCard.css"

const TaskCard = ({ onClick }) => {
  const truncateDesc = text => {
    const words = text.split(" ")
    return words.length > 30 ? words.slice(0, 30).join(" ") + "..." : text
  }
  return (
    <div className="card" onClick={onClick}>
      <strong className="card-title">Task ID</strong>
      <p className="cardInfo">Task name</p>
      <p className="cardInfo">Task owner</p>
    </div>
  )
}

export default TaskCard
