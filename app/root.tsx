import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Toaster } from "sonner";
import { useMemo } from "react";

import stylesheet from "~/tailwind.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    ENV: {
      CONVEX_URL: process.env.CONVEX_URL,
    },
  });
}

export default function App() {
  const { ENV } = useLoaderData<typeof loader>();
  
  const convex = useMemo(
    () => new ConvexReactClient(ENV.CONVEX_URL!),
    [ENV.CONVEX_URL]
  );

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
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
