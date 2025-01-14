// server.js
const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Un utilisateur s'est connecté");

  socket.on("joinChannel", (channelName) => {
    socket.join(channelName);
    io.to(channelName).emit(
      "message",
      `Un utilisateur a rejoint le canal ${channelName}`
    );
  });

  socket.on("sendMessage", ({ channelName, message, nickname }) => {
    io.to(channelName).emit("message", { nickname, message });
  });

  socket.on("disconnect", () => {
    console.log("Un utilisateur s'est déconnecté");
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Serveur Socket.IO lancé sur le port ${PORT}`);
});
