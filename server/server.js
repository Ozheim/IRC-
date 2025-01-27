import { Server } from "socket.io";
import { createServer } from "http";
import { PrismaClient } from "@prisma/client";
import { CommandHandler } from "./CommandService.js";
import { addUser, removeUser, getUser, getAllUsers } from "./user.js";
import { channel } from "diagnostics_channel";

const prisma = new PrismaClient();
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const channels = {}; // Déclare channels ici, globalement dans le fichier

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
      channels[channelName] = []; // Si le channel n'existe pas, crée-le
    }
    channels[channelName].push(message); // Ajoute le message au channel
    console.log(`Message ajouté à ${channelName} :`, message);
  }

  socket.on("sendMessage", async ({ channelName, message, nickname }) => {
    // Check if the message starts with "/"
    if (message.startsWith("/")) {
      // Process the command by passing the socket, command, and parameters
      const [command, ...params] = message.split(" ");
      const response = CommandHandler.processCommand(io, command, ...params);

      console.log("Command response:", response); // Add this line for debugging
      socket.emit("");

      // If the command returns a response, send it back to the user
      if (response) {
        socket.emit("commandResponse", response);
      }
      return; // Stop further processing of the message
    }

    console.log("Message reçu :", message);
    const newMessage = { channelName, nickname, message };

    // Ajoute le message au channel

    await addMessage(channelName, newMessage);

    // Diffuse le message à tous les utilisateurs du channel
    // console.log(channelName, newMessage);
    io.emit("message", newMessage);
  });

  socket.on("disconnect", () => {
    const user = getUser(socket.id);
    console.log(`${user} s'est déconnecté.`);
    removeUser(socket.id);
  });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`Serveur Socket.IO lancé sur http://localhost:${PORT}`);
});
