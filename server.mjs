import { WebSocketServer } from 'ws';
import { Client } from 'ssh2';
import { readFileSync } from 'fs';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  let sshConn = null;
  let shellStream = null;

  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());
    console.log('Received message:', data);

    if (data.ip && !sshConn) {
      const sshConfig = {
        host: data.ip,
        port: 22,
        username: 'ec2-user',
        privateKey: readFileSync('/home/ec2-user/test.pem'),
      };
      console.log('Attempting SSH to:', sshConfig.host);

      sshConn = new Client();
      sshConn.on('ready', () => {
        console.log('SSH connection established');
        // Start a persistent shell session
        sshConn.shell((err, stream) => {
          if (err) {
            console.error('Shell error:', err);
            ws.send(JSON.stringify({ output: 'Shell error: ' + err.message }));
            return;
          }
          shellStream = stream;
          ws.send(JSON.stringify({ output: 'Lab connected. Run commands!' }));

          shellStream.on('data', (data) => {
            console.log('Shell output:', data.toString());
            ws.send(JSON.stringify({ output: data.toString() }));
          }).on('error', (err) => {
            console.error('Shell stream error:', err);
            ws.send(JSON.stringify({ output: 'Shell stream error: ' + err.message }));
          }).on('close', () => {
            console.log('Shell stream closed');
            ws.send(JSON.stringify({ output: 'Shell session closed' }));
          });
        });
      }).on('error', (err) => {
        console.error('SSH error:', err);
        ws.send(JSON.stringify({ output: 'SSH connection failed: ' + err.message }));
        sshConn = null;
      }).on('close', (hadError) => {
        console.log('SSH connection closed, hadError:', hadError);
        ws.send(JSON.stringify({ output: 'SSH connection closed' }));
      }).connect(sshConfig);
    } else if (data.command && shellStream) {
      console.log('Sending command:', data.command);
      shellStream.write(data.command + '\n'); // Send command with newline
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (shellStream) {
      shellStream.end();
      shellStream = null;
    }
    if (sshConn) {
      sshConn.end();
      sshConn = null;
    }
  });
});

console.log('WebSocket server running on port 8080');
