import React from "react"
import { Navigate } from "react-router-dom"

const ProtectedRoute = ({ children, isAdmin, isAuthenticated }) => {
  // return isAdmin ? children : <Navigate to="/login" />
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  if (isAuthenticated && !isAdmin) {
    return <Navigate to="/test" />
  }

  return children
}

export default ProtectedRoute
