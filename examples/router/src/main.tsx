import { Outlet, startRouter } from "@voxelio/router";
import { routes } from "@voxelio/router/routes";
import { createRoot } from "react-dom/client";
import "./globals.css";

startRouter(routes);

const root = document.getElementById("root");
if (root) createRoot(root).render(<Outlet />);
