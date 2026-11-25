import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./themes/anthos.css" // the theme; themes/reader.css and themes/preludes.css are the others
import "./index.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
