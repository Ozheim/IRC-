import { createServer } from "http";
import { Server } from "socket.io";
import { addUser, removeUser, getUser } from "./users.js";
import {
  channels,
  createChannel,
  deleteChannel,
  addMessage,
} from "./channels.js";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Un utilisateur s'est connecté");

  socket.on("userConnected", (nickname) => {
    addUser(socket.id, nickname);
    console.log(`${nickname} est connecté`);
  });l

  socket.on("joinChannel", (channelName) => {
    createChannel(channelName);
    socket.join(channelName);
    socket.emit("messageHistory", channels[channelName]); 
    io.to(channelName).emit("message", {ll
      nickname: "System",
      message: `${getUser(socket.id)} a rejoint ${channelName}`,
    });
  });

  socket.on("sendMessage", ({ channelName, message, nickname }) => {
    const newMessage = { nickname, message };
    addMessage(channelName, newMessage);
    io.to(channelName).emit("message", newMessage);
  });

  socket.on("disconnect", () => {
    const user = getUser(socket.id);
    console.log(`${user} s'est déconnecté`);
    removeUser(socket.id);
  });
});

httpServer.listen(3001, () => {
  console.log("Serveur Socket.IO lancé sur le port 3001");
});
