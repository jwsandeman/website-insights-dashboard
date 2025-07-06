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
  const convexUrl = process.env.VITE_CONVEX_URL;
  
  if (!convexUrl) {
    console.error('VITE_CONVEX_URL environment variable is not set');
  }
  
  return json({
    ENV: {
      CONVEX_URL: convexUrl,
    },
  });
}

export default function App() {
  const { ENV } = useLoaderData<typeof loader>();
  
  const convex = useMemo(() => {
    if (!ENV.CONVEX_URL) {
      console.error('CONVEX_URL not available in ENV:', ENV);
      throw new Error('CONVEX_URL is required but not provided');
    }
    console.log('Initializing ConvexReactClient with URL:', ENV.CONVEX_URL);
    return new ConvexReactClient(ENV.CONVEX_URL);
  }, [ENV.CONVEX_URL]
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
