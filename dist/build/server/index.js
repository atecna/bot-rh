import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer, useLoaderData, Meta, Links, Outlet, ScrollRestoration, Scripts } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
    return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) : handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext);
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
    return new Promise((resolve, reject) => {
        let shellRendered = false;
        const { pipe, abort } = renderToPipeableStream(
        /* @__PURE__ */ jsx(RemixServer, {
            context: remixContext,
            url: request.url,
            abortDelay: ABORT_DELAY
        }), {
            onAllReady() {
                shellRendered = true;
                const body = new PassThrough();
                const stream = createReadableStreamFromReadable(body);
                responseHeaders.set("Content-Type", "text/html");
                resolve(new Response(stream, {
                    headers: responseHeaders,
                    status: responseStatusCode
                }));
                pipe(body);
            },
            onShellError(error) {
                reject(error);
            },
            onError(error) {
                responseStatusCode = 500;
                if (shellRendered) {
                    console.error(error);
                }
            }
        });
        setTimeout(abort, ABORT_DELAY);
    });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
    return new Promise((resolve, reject) => {
        let shellRendered = false;
        const { pipe, abort } = renderToPipeableStream(
        /* @__PURE__ */ jsx(RemixServer, {
            context: remixContext,
            url: request.url,
            abortDelay: ABORT_DELAY
        }), {
            onShellReady() {
                shellRendered = true;
                const body = new PassThrough();
                const stream = createReadableStreamFromReadable(body);
                responseHeaders.set("Content-Type", "text/html");
                resolve(new Response(stream, {
                    headers: responseHeaders,
                    status: responseStatusCode
                }));
                pipe(body);
            },
            onShellError(error) {
                reject(error);
            },
            onError(error) {
                responseStatusCode = 500;
                if (shellRendered) {
                    console.error(error);
                }
            }
        });
        setTimeout(abort, ABORT_DELAY);
    });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const context = createContext(void 0);
function useSocket() {
    return useContext(context);
}
function SocketProvider({ socket, children }) {
    return /* @__PURE__ */ jsxs(context.Provider, { value: socket, children: [
            " ",
            children,
            " "
        ] });
}
const name = "pholon-2025";
const version = "0.0.4";
const sideEffects = false;
const type = "module";
const scripts = {
    build: "remix vite:build",
    lint: "eslint --ignore-path .gitignore --cache --cache-location ./node_modules/.cache/eslint .",
    dev: "tsx watch --ignore './vite.config.ts*' -r dotenv/config   ./server.ts",
    start: "NODE_ENV=production tsx ./server.ts",
    typecheck: "tsc"
};
const dependencies = {
    "@google/generative-ai": "^0.21.0",
    "@remix-run/node": "^2.15.2",
    "@remix-run/react": "^2.15.2",
    "@remix-run/serve": "^2.15.2",
    clsx: "^2.1.1",
    express: "^4.21.2",
    isbot: "^4.1.0",
    openai: "^4.79.1",
    react: "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io": "^4.8.1",
    "socket.io-client": "^4.8.1",
    "tailwind-merge": "^2.6.0",
    tsx: "^4.19.2"
};
const devDependencies = {
    "@remix-run/dev": "^2.15.2",
    "@types/compression": "^1.7.5",
    "@types/express": "^5.0.0",
    "@types/morgan": "^1.9.9",
    "@types/react": "^18.2.20",
    "@types/react-dom": "^18.2.7",
    "@typescript-eslint/eslint-plugin": "^6.7.4",
    "@typescript-eslint/parser": "^6.7.4",
    autoprefixer: "^10.4.19",
    eslint: "^8.38.0",
    "eslint-import-resolver-typescript": "^3.6.1",
    "eslint-plugin-import": "^2.28.1",
    "eslint-plugin-jsx-a11y": "^6.7.1",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    postcss: "^8.4.38",
    tailwindcss: "^3.4.4",
    typescript: "^5.1.6",
    vite: "^5.1.0",
    "vite-tsconfig-paths": "^4.2.1"
};
const engines = {
    node: ">=20.0.0"
};
const packageJson = {
    name,
    version,
    "private": true,
    sideEffects,
    type,
    scripts,
    dependencies,
    devDependencies,
    engines
};
const loader = async () => {
    console.log("version", packageJson.version);
    return { version: packageJson.version };
};
const links = () => [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous"
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
    }
];
function App() {
    const { version: version2 } = useLoaderData();
    const [socket, setSocket] = useState();
    useEffect(() => {
        const socket2 = io({
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1e3
        });
        socket2.on("connect", () => {
            console.log("[CLIENT] Socket connecté:", socket2.id);
        });
        socket2.on("test", (msg) => {
            console.log("[CLIENT] Test reçu:", msg);
        });
        socket2.on("disconnect", () => {
            console.log("[CLIENT] Socket déconnecté");
        });
        setSocket(socket2);
        return () => {
            socket2.disconnect();
        };
    }, []);
    return /* @__PURE__ */ jsxs("html", { lang: "fr", children: [
            /* @__PURE__ */ jsxs("head", { children: [
                    /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
                    /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
                    /* @__PURE__ */ jsx(Meta, {}),
                    /* @__PURE__ */ jsx(Links, {})
                ] }),
            /* @__PURE__ */ jsxs("body", { children: [
                    /* @__PURE__ */ jsxs(SocketProvider, { socket, children: [
                            /* @__PURE__ */ jsx(Outlet, {}),
                            /* @__PURE__ */ jsxs("div", { className: "fixed bottom-1 right-2 text-xs text-white/30", children: [
                                    "v",
                                    version2
                                ] })
                        ] }),
                    /* @__PURE__ */ jsx(ScrollRestoration, {}),
                    /* @__PURE__ */ jsx(Scripts, {})
                ] })
        ] });
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: App,
    links,
    loader
}, Symbol.toStringTag, { value: "Module" }));
function AudioVisualizer({ audioChunks }) {
    const audioRef = useRef(null);
    const currentUrlRef = useRef(null);
    const queueIndexRef = useRef(0);
    const cleanup = () => {
        if (currentUrlRef.current) {
            URL.revokeObjectURL(currentUrlRef.current);
            currentUrlRef.current = null;
        }
    };
    useEffect(() => {
        if (!audioRef.current)
            return;
        const audio = audioRef.current;
        const playNextInQueue = () => {
            cleanup();
            if (queueIndexRef.current >= audioChunks.length) {
                queueIndexRef.current = 0;
                return;
            }
            const chunk = audioChunks[queueIndexRef.current];
            const url = URL.createObjectURL(chunk);
            currentUrlRef.current = url;
            audio.src = url;
            audio.play().catch(console.error);
            queueIndexRef.current++;
        };
        audio.onended = playNextInQueue;
        if (audioChunks.length > 0 && !audio.src) {
            queueIndexRef.current = 0;
            playNextInQueue();
        }
        return () => {
            audio.onended = null;
            cleanup();
        };
    }, [audioChunks]);
    return /* @__PURE__ */ jsx("audio", { ref: audioRef, style: { display: "none" }, children: /* @__PURE__ */ jsx("track", { kind: "captions" }) });
}
function cx(...args) {
    return twMerge(clsx(...args));
}
function RecordingButton({ isRecording, onTouchStart, onTouchEnd, isThinking, currentStatus }) {
    return /* @__PURE__ */ jsx("button", {
        onTouchStart,
        onTouchEnd,
        onContextMenu: (e) => e.preventDefault(),
        type: "button",
        className: cx("w-28 h-28 rounded-full bg-white shadow-lg flex items-center justify-center p-4 focus:outline-none", { "bg-red-500": isRecording }),
        style: { WebkitTapHighlightColor: "transparent" },
        children: isThinking ? /* @__PURE__ */ jsx("span", { className: "text-center", children: currentStatus }) : /* @__PURE__ */ jsx("img", { className: "w-12 h-12", src: "/micro.png", alt: "Microphone" })
    });
}
const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const startRecording = async () => {
        setIsRecording(true);
        const constraints = { audio: true };
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            mediaRecorder.current = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorder.current.ondataavailable = (evt) => {
                chunks.push(evt.data);
            };
            mediaRecorder.current.onstop = async () => {
                const blob = new Blob(chunks, { type: "audio/webm" });
                setAudioBlob(blob);
            };
            mediaRecorder.current.start();
        }
        catch (error) {
            console.error("Error starting media recorder:", error);
            setIsRecording(false);
        }
    };
    const stopRecording = () => {
        setIsRecording(false);
        if (mediaRecorder.current) {
            mediaRecorder.current.stop();
            mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
            mediaRecorder.current = null;
        }
    };
    return {
        isRecording,
        startRecording,
        stopRecording,
        audioBlob
    };
};
function Index() {
    const [currentStatus, setCurrentStatus] = useState("");
    const [isMediaAvailable, setIsMediaAvailable] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcription, setTranscription] = useState("");
    const [pholonText, setPholonText] = useState("");
    const [audioChunks, setAudioChunks] = useState([]);
    const socket = useSocket();
    const { isRecording, startRecording, stopRecording, audioBlob } = useAudioRecorder();
    useEffect(() => {
        if (!socket)
            return;
        socket.on("status", (data) => {
            setCurrentStatus(data);
        });
        socket.on("transcription", (text) => {
            setTranscription(text);
            setPholonText("");
            setAudioChunks([]);
        });
        socket.on("stream-response", (chunk) => {
            setIsProcessing(true);
            setPholonText((prev) => prev + chunk);
        });
        socket.on("audio-chunk", (chunk) => {
            const blob = new Blob([chunk], { type: "audio/mp3" });
            setAudioChunks((prev) => [...prev, blob]);
        });
        socket.on("stream-end", () => {
            setIsProcessing(false);
            setCurrentStatus("");
        });
        socket.on("error", (error) => {
            console.error("Socket error:", error);
            setIsProcessing(false);
            setCurrentStatus("");
        });
        return () => {
            socket.off("status");
            socket.off("transcription");
            socket.off("stream-response");
            socket.off("audio-chunk");
            socket.off("stream-end");
            socket.off("error");
        };
    }, [socket]);
    useEffect(() => {
        if (audioBlob && socket) {
            setIsProcessing(true);
            socket.emit("audio-data", audioBlob);
        }
    }, [audioBlob, socket]);
    useEffect(() => {
        setIsMediaAvailable(typeof navigator.mediaDevices.getUserMedia !== "undefined");
    }, []);
    const onStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        startRecording();
    };
    const onEnd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        stopRecording();
    };
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-screen relative", children: [
            /* @__PURE__ */ jsx("div", {
                className: "absolute inset-0 bg-cover bg-no-repeat bg-center z-0",
                style: { backgroundImage: "url('/pholon.png')" }
            }),
            /* @__PURE__ */ jsx("a", { href: "/history", className: "absolute top-0 right-0 p-4 z-10", children: /* @__PURE__ */ jsx("img", { src: "/history.svg", width: 24, alt: "history" }) }),
            /* @__PURE__ */ jsxs("div", { className: "absolute top-1/4 left-0 right-0 flex flex-col items-center gap-4 p-4 z-10", children: [
                    transcription && /* @__PURE__ */ jsxs("p", { className: "text-white bg-black/50 p-4 rounded-lg", children: [
                            "“",
                            transcription,
                            "”"
                        ] }),
                    pholonText && /* @__PURE__ */ jsx("p", { className: "text-white bg-blue-500/50 p-4 rounded-lg max-w-2xl", children: pholonText })
                ] }),
            /* @__PURE__ */ jsx("div", { className: "absolute bottom-10 left-0 right-0 flex justify-center z-10", children: isMediaAvailable ? /* @__PURE__ */ jsx(RecordingButton, {
                    isRecording,
                    onTouchStart: onStart,
                    onTouchEnd: onEnd,
                    isThinking: isProcessing,
                    currentStatus
                }) : /* @__PURE__ */ jsx("p", { className: "text-white", children: "Microphone non disponible" }) }),
            /* @__PURE__ */ jsx(AudioVisualizer, { audioChunks })
        ] });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: Index
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-DJscNxyd.js", "imports": ["/assets/jsx-runtime-D5FwP9M8.js", "/assets/components-CS_CX-aa.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-Br48R3nD.js", "imports": ["/assets/jsx-runtime-D5FwP9M8.js", "/assets/components-CS_CX-aa.js", "/assets/context-DXaP42PW.js"], "css": ["/assets/root-DFTkgX88.css"] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-DmQTqfRz.js", "imports": ["/assets/jsx-runtime-D5FwP9M8.js", "/assets/context-DXaP42PW.js"], "css": [] } }, "url": "/assets/manifest-b8373aee.js", "version": "b8373aee" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": true, "v3_lazyRouteDiscovery": true, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
    "root": {
        id: "root",
        parentId: void 0,
        path: "",
        index: void 0,
        caseSensitive: void 0,
        module: route0
    },
    "routes/_index": {
        id: "routes/_index",
        parentId: "root",
        path: void 0,
        index: true,
        caseSensitive: void 0,
        module: route1
    }
};
export { serverManifest as assets, assetsBuildDirectory, basename, entry, future, isSpaMode, mode, publicPath, routes };
