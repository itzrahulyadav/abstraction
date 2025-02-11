// "use client";

// import { useEffect, useRef } from "react";
// import { Terminal } from "@xterm/xterm";
// import "@xterm/xterm/css/xterm.css";

// const WebTerminal: React.FC = () => {
//     const terminalRef = useRef<HTMLDivElement | null>(null);

//     useEffect(() => {
//         if (!terminalRef.current) return;

//         const term = new Terminal({
//             cursorBlink: true,
//             theme: { background: "#663399", foreground: "#ffffff" },
//         });

//         term.open(terminalRef.current);

//         // const socket = new WebSocket("ws://localhost:8080/ws");
//         // const socket = new WebSocket('https://8080-itzrahulyada-containerx-a0psbpkdix7.ws-us117.gitpod.io')
//         const socket = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws`);

//         socket.onopen = () => term.writeln("Connected to backend...");
//         socket.onmessage = (event: MessageEvent) => term.write(event.data);
//         socket.onclose = () => term.writeln("\r\nConnection closed.");
//         socket.onerror = (err) => console.error("WebSocket error:", err);

//         term.onData((data: string) => socket.send(data));

//         return () => {
//             socket.close();
//             term.dispose();
//         };
//     }, []);

//     return <div ref={terminalRef} className="h-screen w-full bg-black" />;
// };

// export default WebTerminal;

"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

const WebTerminal: React.FC = () => {
    const terminalRef = useRef<HTMLDivElement | null>(null);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            theme: { background: "#000000", foreground: "#ffffff" },
        });

        term.open(terminalRef.current);

        const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
        setSocket(ws);

        ws.onopen = () => term.writeln("Connected to backend...");
        ws.onmessage = (event: MessageEvent) => term.write(event.data);
        ws.onclose = () => term.writeln("\r\nConnection closed.");
        ws.onerror = (err) => console.error("WebSocket error:", err);

        term.onData((data: string) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            } else {
                console.warn("WebSocket not ready. Message skipped:", data);
            }
        });

        return () => {
            ws.close();
            term.dispose();
        };
    }, []);

    return <div ref={terminalRef} className="h-screen w-full bg-black" />;
};

export default WebTerminal;
