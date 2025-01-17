import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import io from "socket.io-client";
import type { LinksFunction } from "@remix-run/node";
import { SocketProvider } from "~/context";

import "./tailwind.css";

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
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    const socket = io({
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    socket.on('connect', () => {
      console.log('[CLIENT] Socket connecté:', socket.id);
    });
    
    socket.on('test', (msg) => {
      console.log('[CLIENT] Test reçu:', msg);
    });
    
    socket.on('disconnect', () => {
      console.log('[CLIENT] Socket déconnecté');
    });
    
    setSocket(socket);
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketProvider socket={socket}>
      <Outlet />
    </SocketProvider>
  );
}
