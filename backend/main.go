package main

import (
    "fmt"
    "log"
    "net/http"
    "os/exec"
    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool { return true },
}

func handleTerminal(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println("WebSocket upgrade failed:", err)
        return
    }
    defer conn.Close()

    // cmd := exec.Command("bash")
	cmd := exec.Command("podman", "run", "-it", "--rm", "ubuntu", "/bin/bash") 
    stdin, _ := cmd.StdinPipe()
    stdout, _ := cmd.StdoutPipe()
    stderr, _ := cmd.StderrPipe()

    go func() {
        buffer := make([]byte, 1024)
        for {
            n, err := stdout.Read(buffer)
            if err != nil {
                break
            }
            conn.WriteMessage(websocket.TextMessage, buffer[:n])
        }
    }()

    go func() {
        buffer := make([]byte, 1024)
        for {
            n, err := stderr.Read(buffer)
            if err != nil {
                break
            }
            conn.WriteMessage(websocket.TextMessage, buffer[:n])
        }
    }()

    cmd.Start()
    for {
        _, message, err := conn.ReadMessage()
        if err != nil {
            break
        }
        stdin.Write(message)
    }
}

func main() {
    http.HandleFunc("/ws", handleTerminal)
    fmt.Println("Server running on http://localhost:8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
