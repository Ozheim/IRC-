// Import des modules nécessaires
import { Server } from "socket.io";
import { createServer } from "http";
import { PrismaClient } from "@prisma/client";

// Initialisation de Prisma
const prisma = new PrismaClient();

// Initialisation du serveur HTTP
const httpServer = createServer();

// Initialisation de Socket.IO avec le serveur HTTP
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // Remplace par l'origine de ton frontend
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Variables en mémoire pour stocker les utilisateurs et canaux
const users = {};
const channels = {};

// Fonctions utilitaires
async function addUser(id, nickname) {
  users[id] = nickname;
}

async function getUser(id) {
  return users[id];
}

async function removeUser(id) {
  delete users[id];
}

async function createChannel(channelName) {
  if (!channels[channelName]) {
    channels[channelName] = [];
  }
}

async function addMessage(channelName, message) {
  if (!channels[channelName]) {
    channels[channelName] = [];
  }
  channels[channelName].push(message);
}

// Gestion des connexions Socket.IO
io.on("connection", (socket) => {
  console.log("Un utilisateur s'est connecté :", socket.id);

  socket.on("userConnected", async (nickname) => {
    await addUser(socket.id, nickname);
    console.log(`${nickname} est connecté`);
  });

  socket.on("joinChannel", async (channelName) => {
    await createChannel(channelName);
    socket.join(channelName);
    socket.emit("messageHistory", channels[channelName]);
    io.to(channelName).emit("message", {
      nickname: "System",
      message: `${await getUser(socket.id)} a rejoint ${channelName}`,
    });
  });

  socket.on("sendMessage", async ({ channelName, message, nickname }) => {
    console.log("Message reçu :", message);
    if (message.trim() === "/list") {
      const allUsers = Object.values(users);
      socket.emit("message", {
        nickname: "System",
        message: `Utilisateurs connectés : ${allUsers.join(", ")}`,
      });
    } else {
      const newMessage = { nickname, message };
      await addMessage(channelName, newMessage);
      io.to(channelName).emit("message", newMessage);
    }
  });

  socket.on("disconnect", async () => {
    const user = await getUser(socket.id);
    console.log(`${user} s'est déconnecté`);
    await removeUser(socket.id);
  });
});

// Démarrage du serveur HTTP
const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`Serveur Socket.IO lancé sur http://localhost:${PORT}`);
});
