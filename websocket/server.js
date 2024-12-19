const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const axios = require('axios'); 

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('WebSocket server is running');
});

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:8081', 
    methods: ['GET', 'POST'],
    credentials: true 
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  jwt.verify(token, 'secretkey', (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.username = decoded.username;
    next();
  });
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.username);
    socket.join(socket.username);

    socket.on('private message', async (data) => {
        try {
            const { to, message } = data;
            console.log('New message:', { from: socket.username, to, message });

            const response = await axios.post('http://backend:3001/messages', {
                from: socket.username,
                to,
                message
            });

            if (response.status === 201) {
                io.to(to).emit('private message', {
                    from: socket.username,
                    message,
                });

                socket.emit('message sent', {
                    to,
                    message,
                });
            } else {
                throw new Error('Failed to save message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });
});

server.listen(3002, () => {
  console.log('WebSocket server running on port 3002');
});