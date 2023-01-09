const http = require("http");

const WebSocket = require("ws");

// Set up the WebSocket server
const wss = new WebSocket.Server({ port: 8085 });

// Set up an object to store the clients, keyed by client ID
const clients = {};

wss.on("connection", (ws) => {
  // Assign a unique ID to each client
  const clientId = Date.now();
  clients[clientId] = ws;

  // Send the client ID back to the client
  ws.send(JSON.stringify({ clientId }));

  ws.on("message", (message) => {
    console.log(`Received message from client ${clientId} => ${message}`);

    // Parse the message to extract the sender and recipient IDs
    const { sender, recipient, text } = JSON.parse(message);

    // Forward the message to the recipient, if they are connected
    const recipientConnection = clients[recipient];
    console.log("##### recepetent connection #####", recipientConnection);
    if (
      recipientConnection &&
      recipientConnection.readyState === WebSocket.OPEN
    ) {
      recipientConnection.send(JSON.stringify({ sender, text }));
    }
  });

  ws.on("close", () => {
    console.log(`Client ${clientId} disconnected`);
    // delete clients[clientId];
  });
});

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  console.log("### header #####", req.headers);

  if (req.method === "GET" && req.url === "/login") {
    console.log("### header #####", req.headers);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "This is login page" }));
  }
  if (req.method === "POST" && req.url === "/login") {
    console.log("this is post login");
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "This is login page" }));
  }
});

server.listen(8080, () => {
  console.log("server is listening on port 8080");
});
