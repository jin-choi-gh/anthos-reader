import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./themes/preludes.css" // the theme; themes/reader.css is the other, imported here instead
import "./index.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
