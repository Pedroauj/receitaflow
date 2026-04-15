import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// macOS-style scrollbar: show on scroll, hide after idle
let pageTimer: ReturnType<typeof setTimeout>;
const scrollTimers = new WeakMap<Element, ReturnType<typeof setTimeout>>();

window.addEventListener("scroll", (e) => {
  const target = e.target;

  if (target === document || target === document.documentElement) {
    document.documentElement.classList.add("is-scrolling");
    clearTimeout(pageTimer);
    pageTimer = setTimeout(() => document.documentElement.classList.remove("is-scrolling"), 1200);
  }

  if (target instanceof Element && target.classList.contains("mac-scroll")) {
    target.classList.add("is-scrolling");
    const prev = scrollTimers.get(target);
    if (prev) clearTimeout(prev);
    scrollTimers.set(target, setTimeout(() => target.classList.remove("is-scrolling"), 1200));
  }
}, true);

// Spotlight removed for performance

createRoot(document.getElementById("root")!).render(<App />);
