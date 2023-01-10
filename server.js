const server = require('./index');
const io = require('socket.io')(server);



// On the server
const clients = {};

io.on('connection', socket => {
  socket.on('login', username => {
    clients[username] = socket;
  });

  socket.on('send message', (recipient, message) => {
    const recipientSocket = clients[recipient];
    if (recipientSocket) {
      recipientSocket.emit('message', message);
    } else {
      console.log(`User ${recipient} is not online.`);
    }
  });
});

// // On the client
// const socket = io();

// // Login with a username
// socket.emit('login', 'alice');

// // Send a message to a specific user
// socket.emit('send message', 'bob', 'Hello, Bob!');
