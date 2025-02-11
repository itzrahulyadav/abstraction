"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

const WebTerminal: React.FC = () => {
    const terminalRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            theme: { background: "#000000", foreground: "#ffffff" },
        });

        term.open(terminalRef.current);

        const socket = new WebSocket("ws://localhost:8080/ws");

        socket.onopen = () => term.writeln("Connected to backend...");
        socket.onmessage = (event: MessageEvent) => term.write(event.data);
        socket.onclose = () => term.writeln("\r\nConnection closed.");
        socket.onerror = (err) => console.error("WebSocket error:", err);

        term.onData((data: string) => socket.send(data));

        return () => {
            socket.close();
            term.dispose();
        };
    }, []);

    return <div ref={terminalRef} className="h-screen w-full bg-black" />;
};

export default WebTerminal;
