import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./presentation/app/App";
import { buildContainer } from "./config/container";
import { appConfig } from "./config/app.config";
import "./presentation/styles/tokens.css";
import "./presentation/styles/app.css";

const container = buildContainer(appConfig);
const root = createRoot(document.getElementById("container"));
const mount = () => root.render(<App container={container} />);
if (typeof Office !== "undefined" && Office.onReady) Office.onReady(mount); else mount();
