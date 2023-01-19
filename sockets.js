module.exports = (io) => {
  let clients = {};

  io.on("connection", (socket) => {
    const { username } = socket.handshake.query;
    clients[socket.id] = username; // when user open app
    io.emit("updateUsers", clients);

    socket.on("join", (roomName) => {
      socket.join(roomName);
      io.to(socket.id).emit("joinRoomSuccess", roomName);
    });

    // handle user disconnection
    socket.on("disconnect", () => {
      console.log("#### user disconnected ####", socket.id);
      delete clients[socket.id];
      io.emit("updateUsers", clients);
    });

    socket.on("connectToUser", (userId) => {
      const targetUser = clients[userId];
      if (targetUser) {
        io.to(userId).emit("connectionRequest", {
          from: username,
          id: socket.id,
        });
      }
    });

    // request rooms
    socket.on("requestRooms", () => {
      socket.emit("ListRooms", socket.rooms);
    });

    // handle connection acceptance
    socket.on("acceptConnection", (userId) => {
      const targetUser = clients[userId];
      let roomName;
      if (targetUser) {
        roomName = `${socket.id}-${userId}`; // create common room
        socket.join(roomName);
        io.to(userId).emit("joinRoom", roomName);
        io.to(roomName).emit("connectionEstablished", {
          room: roomName,
          users: [clients[socket.id], targetUser],
        });
      }
    });

    socket.on("userTyping", (room, username) => {
      socket.broadcast.to(room).emit("userTyping", username);
    });

    socket.on("userTypingEnd", (room) => {
      socket.broadcast.to(room).emit("userTypingEndResp");
    });

    // handle messages
    socket.on("sendMessage", (room, message) => {
      io.to(room).emit("newMessage", {
        from: clients[socket.id],
        message,
      });
    });
  });
};
