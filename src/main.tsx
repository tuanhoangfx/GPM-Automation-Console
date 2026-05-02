import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { readStoredThemeMode, syncDocumentTheme } from "./theme";
import "./styles/workspace-design-base.css";

syncDocumentTheme(readStoredThemeMode());

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
