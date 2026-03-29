import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// macOS-style scrollbar: show on scroll, hide after 1.2s
let scrollTimer: ReturnType<typeof setTimeout>;
const onScroll = () => {
  document.documentElement.classList.add("is-scrolling");
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => document.documentElement.classList.remove("is-scrolling"), 1200);
};
window.addEventListener("scroll", onScroll, true);
document.addEventListener("scroll", onScroll, true);

createRoot(document.getElementById("root")!).render(<App />);
