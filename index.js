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

// io.on("connection", (socket) => {
//   console.log(`User Connected: ${socket.id}`);

//   socket.on("join_room", (data) => {
//     console.log("### room joied ####",data)
//     socket.join(data);
//   });

//   socket.on("send_message", (data) => {
//     socket.to(data.room).emit("receive_message", data);
//   });
// });



// 

let clients = {};
let messageQueue = [];

io.on('connection', socket => {
  socket.on('login', username => {

    console.log("#### user login ####",username,socket.id)
    clients[username] = socket;
    deliverPendingMessages(username);
    console.log("###### client #######",clients.conn)
  console.log("message queue ###",messageQueue)

  });


  socket.on('send message', (recipient, message) => {
    console.log("####### send message #####",recipient,message)
    const recipientSocket = clients[recipient];
    // console.log("####### recipient socket ######",recipientSocket)
    if (recipientSocket) {
        console.log("### inside if ###",recipientSocket.emit())
      recipientSocket.emit('receive_message', message);
    } else {
      console.log(`User ${recipient} is not online. Adding message to queue.`);
      messageQueue.push({
        recipient: recipient,
        message: message
      });

      console.log("######## messge queure ######",messageQueue)
    }
  });
});

function deliverPendingMessages(username) {
  const pendingMessages = messageQueue.filter(m => m.recipient === username);
  pendingMessages.forEach(m => {
    clients[username].emit('receive_message', m.message);
    
  });
  messageQueue = messageQueue.filter(m => m.recipient !== username);
}


server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});