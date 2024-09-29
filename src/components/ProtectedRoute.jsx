import React from "react"
import { Route, Navigate, useLocation, Outlet } from "react-router-dom"

export default function ProtectedRoute({ component: Component, ...rest }) {
  // const token = window.document.cookie.split("; ").find(row => row.startsWith("token="))
  const token = true

  console.log("Current cookie: ", document.cookie)
  console.log("Token: ", token)

  return token ? <Outlet /> : <Navigate to="/login" />
}
