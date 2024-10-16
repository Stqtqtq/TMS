import React from "react"
import "./TaskCard.css"

const TaskCard = ({ task, plan, onClick }) => {
  const truncateDesc = text => {
    const words = text.split(" ")
    return words.length > 30 ? words.slice(0, 30).join(" ") + "..." : text
  }
  return (
    <div className="card" style={{ borderLeft: `5px solid ${plan?.plan_colour || "#ffffff"}` }} onClick={() => onClick(task)}>
      <strong className="card-title">{task.task_id}</strong>
      <p className="cardInfo">
        {/* <strong>Task name: </strong> */}
        {task.task_name}
      </p>
      <p className="cardInfo">
        {/* <strong>Task owner: </strong> */}
        {task.task_owner}
      </p>
    </div>
  )
}

export default TaskCard
