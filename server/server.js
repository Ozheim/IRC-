import dotenv from "dotenv";
dotenv.config();

import { Server } from "socket.io";
import { createServer } from "http";
import { PrismaClient } from "@prisma/client";
import { CommandHandler } from "./CommandService.js";
import { addUser, removeUser, getUser, getAllUsers } from "./user.js";

const prisma = new PrismaClient();
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const channels = {};

io.on("connection", (socket) => {
  console.log("Un utilisateur s'est connecté :", socket.id);

  socket.on("userConnected", (nickname) => {
    addUser(socket.id, nickname);
    console.log(`${nickname} est connecté.`);
  });

  socket.on("getCommands", () => {
    const commands = CommandHandler.availableCommands;
    socket.emit("commandsList", commands);
  });

  async function addMessage(channelName, message) {
    if (!channels[channelName]) {
      channels[channelName] = [];
    }
    channels[channelName].push(message);
    console.log(`Message ajouté à ${channelName} :`, message);
  }

  socket.on("sendMessage", async ({ channelName, message, nickname }) => {
    if (message.startsWith("/")) {
      const [command, ...params] = message.split(" ");
      const response = CommandHandler.processCommand(
        socket,
        command,
        ...params
      );

      console.log("Command response:", response);
      socket.emit("commandResponse", response);
      return;
    }

    console.log("Message reçu :", message);
    const newMessage = { channelName, nickname, message };

    await addMessage(channelName, newMessage);

    io.emit("message", newMessage);
  });

  socket.on("disconnect", () => {
    const user = getUser(socket.id);
    console.log(`${user} s'est déconnecté.`);
    removeUser(socket.id);
  });
});

// 📌 Création des channels par défaut avant le lancement du serveur
await createDefaultChannels();

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur Socket.IO lancé sur http://localhost:${PORT}`);
});
