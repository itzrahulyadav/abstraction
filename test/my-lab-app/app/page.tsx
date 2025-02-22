"use client";
import { useState, useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

export default function Home() {
  const [isLabRunning, setIsLabRunning] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const startLab = async () => {
    setIsLabRunning(true);
    if (!terminalRef.current) return;

    // Initialize xterm.js
    if (!xtermRef.current) {
      xtermRef.current = new Terminal({
        cursorBlink: true,
        theme: { background: '#1a1a1a', foreground: '#ffffff' },
      });
      const fitAddon = new FitAddon();
      xtermRef.current.loadAddon(fitAddon);
      xtermRef.current.open(terminalRef.current);
      fitAddon.fit();

      // Resize terminal on window resize
      window.addEventListener('resize', () => fitAddon.fit());
    }

    xtermRef.current?.writeln('Starting lab...');

    try {
      const response = await fetch('/api/start-lab', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to start lab');
      const data = await response.json();
      const taskArn = data.taskArn;

      // Connect to WebSocket server on EC2
      wsRef.current = new WebSocket('ws://3.110.166.174:8080'); // Replace with EC2 IP
      wsRef.current.onopen = () => {
        wsRef.current?.send(JSON.stringify({ taskArn }));
        xtermRef.current?.writeln('Lab ready! Type commands (e.g., whoami, echo "Hello"):');
      };
      wsRef.current.onmessage = (event) => {
        const { output } = JSON.parse(event.data);
        xtermRef.current?.writeln(output);
      };
      wsRef.current.onerror = (error) => {
        xtermRef.current?.writeln('WebSocket error occurred');
        console.error(error);
      };
      wsRef.current.onclose = () => xtermRef.current?.writeln('Lab connection closed');

      // Handle user input
      xtermRef.current?.onData((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ command: data }));
        }
      });
    } catch (error) {
      xtermRef.current?.writeln('Error: ' + (error as Error).message);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      wsRef.current?.close();
      xtermRef.current?.dispose();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col p-8 bg-gray-100">
      <h1 className="text-3xl mb-8">Online Lab MVP</h1>
      <button
        onClick={startLab}
        disabled={isLabRunning}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 mb-4"
      >
        {isLabRunning ? 'Lab Running...' : 'Start Lab'}
      </button>
      <div
        ref={terminalRef}
        className="w-full max-w-4xl h-96 bg-black rounded-md overflow-hidden"
      />
    </div>
  );
}