const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
var CryptoJS = require("crypto-js");

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

io.on("connection", (socket) => {
  socket.on("login", (username) => {
    console.log("#### user login ####", username, socket.id);
    clients[username] = socket;
    deliverPendingMessages(username);
    console.log("message queue ###", messageQueue);
  });

  socket.on("send message", (recipient, message) => {
    console.log("####### send message #####", recipient, message);
    const recipientSocket = clients[recipient];
    // console.log("####### recipient socket ######",recipientSocket)
    if (recipientSocket) {
      console.log("### inside if ###", recipientSocket.emit());
      let bytes = CryptoJS.AES.decrypt(message, "secret key 123");
      let originalText = bytes.toString(CryptoJS.enc.Utf8);

      console.log(originalText); // 'my message'
      recipientSocket.emit("receive_message", originalText);
    } else {
      console.log(`User ${recipient} is not online. Adding message to queue.`);
      messageQueue.push({
        recipient: recipient,
        message: message,
      });

      console.log("######## messge queure ######", messageQueue);
    }
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
