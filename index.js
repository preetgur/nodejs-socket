const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

let clients = {};
let messageQueue = [];
let connectedUsers = {};

io.on("connection", (socket) => {


  const { username } = socket.handshake.query;
  clients[socket.id] = username;
  io.emit('updateUsers', clients);

  
  socket.on('join', roomName => {
    socket.join(roomName);
    console.log(`########## rooom joined by ${socket.id} with room ${roomName} `)
    io.to(socket.id).emit('joinRoomSuccess', roomName);
    
  });

  
  socket.on("login", (username) => {
    console.log("#### user login ####", username, socket.id);
    clients[username] = socket;
    socket.emit("connected", {
      msg: `user connected with socket.id : ${socket.id}`,
      id: socket.id,
    });

    deliverPendingMessages(username);
    console.log("message queue ###", messageQueue);
  });

 // handle user disconnection
 socket.on('disconnect', () => {
  console.log("#### user disconnected ####",socket.id)
  delete clients[socket.id];
  io.emit('updateUsers', clients);
});

  // // handle connection request
  // socket.on('connectToUser', userId => {
    
  //   console.log("### clients ####",clients)
  //   // for (const iterator of clients) {
  //     console.log("##### iterator ####",clients[userId])
  //   // }
  //   // const targetUser = clients.find(user => user.id === userId);
  //   // console.log("##### target id ######",targetUser)
  //   if (clients[userId]) {
  //   console.log("##### socket id ######",socket.id)

  //     io.to(userId).emit('connectionRequest', {
  //       from: username,
  //       id: socket.id
  //     });
  //   }
  // });


    // handle connection request
    socket.on('connectToUser', userId => {
      const targetUser = clients[userId];
    console.log("##### target id ######",targetUser.id)

      if (targetUser) {
        io.to(userId).emit('connectionRequest', {
          from: username,
          id: socket.id
        });
      }
    });

    // request rooms 
    socket.on('requestRooms', () => {
      console.log("##### list roooms ######",socket.rooms)
      socket.emit('ListRooms', socket.rooms);
    });

   // handle connection acceptance
   socket.on('acceptConnection', userId => {
    const targetUser = clients[userId];
    let roomName;
    console.log("#### accept connectiojn #####",targetUser)
    if (targetUser) {
      roomName = `${socket.id}-${userId}`;
      socket.join(roomName);
      // io.to(userId).emit('connectToRoom', roomName);
    

      io.to(userId).emit('joinRoom', roomName);
      io.to(roomName).emit('connectionEstablished', {
        room: roomName,
        users: [clients[socket.id], targetUser]
      });
    }

  });


  socket.on("send message", (recipient, message) => {
    console.log("####### send message #####", recipient, message);
    const recipientSocket = clients[recipient];
    // console.log("####### recipient socket ######",recipientSocket)
    if (recipientSocket) {
      console.log("### inside if ###", recipientSocket.emit());

      recipientSocket.emit("receive_message", message);
    } else {
      console.log(`User ${recipient} is not online. Adding message to queue.`);
      socket.emit("notconnected", {
        msg: `User ${recipient} is not online`,
      });
      messageQueue.push({
        recipient: recipient,
        message: message,
      });

      console.log("######## messge queure ######", messageQueue);
    }
  });

    // handle messages
    socket.on('sendMessage', (room, message) => {
      io.to(room).emit('newMessage', {
        from: clients[socket.id],
        message
      });

    });


});




function deliverPendingMessages(username) {
  const pendingMessages = messageQueue.filter((m) => m.recipient === username);
  pendingMessages.forEach((m) => {
    clients[username].emit("receive_message", m.message);
  });
  messageQueue = messageQueue.filter((m) => m.recipient !== username);
}

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});
