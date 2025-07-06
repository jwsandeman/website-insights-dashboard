import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Toaster } from "sonner";

import stylesheet from "~/tailwind.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

const convex = new ConvexReactClient(
  typeof window !== "undefined"
    ? (window as any)?.ENV?.VITE_CONVEX_URL ||
      "https://sincere-cow-339.convex.cloud"
    : "https://sincere-cow-339.convex.cloud"
);

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ConvexProvider client={convex}>
          <Outlet />
          <Toaster theme="dark" />
        </ConvexProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
