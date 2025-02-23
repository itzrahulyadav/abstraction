import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  let taskArn = null;

  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());
    if (data.taskArn) {
      taskArn = data.taskArn;
      ws.send(JSON.stringify({ output: 'Lab connected. Run commands!' }));
    } else if (data.command) {
      const cmd = spawn('aws', [
        'ecs',
        'execute-command',
        '--cluster',
        'lab-cluster',
        '--task',
        taskArn,
        '--command',
        data.command,
        '--interactive',
      ]);

      cmd.stdout.on('data', (output) => ws.send(JSON.stringify({ output: output.toString() })));
      cmd.stderr.on('data', (error) => ws.send(JSON.stringify({ output: error.toString() })));
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

console.log('WebSocket server running on port 8080');