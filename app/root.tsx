import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import io from "socket.io-client";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { SocketProvider } from "~/context";
import packageJson from "../package.json";
import "./tailwind.css";
import { AuthenticatedRequest } from "~/back/types";

export const loader = async ({
  context,
}: LoaderFunctionArgs & { context: { session: AuthenticatedRequest["session"] } }) => {
  // @ts-ignore - on récupère le req Express depuis la request Remix
  const session = context.session;

  return {
    version: packageJson.version,
    basePath: process.env.BASE_PATH || "",
    userName: session.account?.name
  };
};

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  }
];

export default function App() {
  const { version, basePath, userName } = useLoaderData<typeof loader>();
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    const socket = io({
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      path: basePath ? `${basePath}/socket.io` : '/socket.io'
    });
    
    socket.on('connect', () => {
      console.log('[CLIENT] Socket connecté:', socket.id);
      
      if (userName) {
        console.log(`[USER AUTHENTIFIÉ] Nom: `);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('[CLIENT] Socket déconnecté');
    });
    
    setSocket(socket);
    return () => {
      socket.disconnect();
    };
  }, [userName]);

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        ></meta>
        <Meta />
        <Links />
      </head>
      <body>
        <SocketProvider socket={socket}>
          <Outlet context={{ userName, basePath }} />
          <div className="fixed bottom-1 right-2 text-xs text-black/30">
            v{version}
          </div>
        </SocketProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
