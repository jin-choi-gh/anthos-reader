import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./themes/reader.css" // the one theme; another theme would be imported here instead
import "./index.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
