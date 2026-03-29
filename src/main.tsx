import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// macOS-style scrollbar: show on scroll, hide after 1.5s
let scrollTimer: ReturnType<typeof setTimeout>;
window.addEventListener("scroll", () => {
  document.documentElement.classList.add("is-scrolling");
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => document.documentElement.classList.remove("is-scrolling"), 1500);
}, true);

createRoot(document.getElementById("root")!).render(<App />);
