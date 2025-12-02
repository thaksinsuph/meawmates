import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import "./index.css"
import { router } from "./router"

import axios from "axios"
import { getToken } from "./auth"
import { SavedProvider } from "./context/SavedContext"

const token = getToken()
if (token) axios.defaults.headers.common["Authorization"] = "Bearer " + token

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SavedProvider>
      <RouterProvider router={router} />
    </SavedProvider>
  </React.StrictMode>
)
