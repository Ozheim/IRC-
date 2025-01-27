// Import des modules nécessaires
import { Server } from "socket.io"; // Socket.IO
import { createServer } from "http"; // Serveur HTTP pour Socket.IO
import { PrismaClient } from "@prisma/client"; // Prisma

// Initialisation de Prisma
const prisma = new PrismaClient();
const httpServer = createServer();

// Initialisation du serveur HTTP et de Socket.IO
const server = createServer(); // Serveur HTTP simple
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3001", // Autorise les requêtes depuis l'origine
    methods: ["GET", "POST"], // Méthodes HTTP autorisées
    credentials: true, // Si tu utilises des cookies ou des sessions
  },
}); // Initialisation de Socket.IO

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
  console.log("Un utilisateur s'est connecté");

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

  socket.on("listChannels", async () => {
    const availableChannels = Object.keys(channels);
    socket.emit("message", {
      nickname: "System",
      message: `Channels disponibles : ${availableChannels.join(", ")}`,
    });
  });

  socket.on("listUsers", async (channelName) => {
    const usersInChannel = Array.from(
      io.sockets.adapter.rooms.get(channelName) || []
    );
    const userNames = usersInChannel.map((id) => users[id]);
    socket.emit("message", {
      nickname: "System",
      message: `Utilisateurs dans ${channelName} : ${userNames.join(", ")}`,
    });
  });

  socket.on("disconnect", async () => {
    const user = await getUser(socket.id);
    console.log(`${user} s'est déconnecté`);
    await removeUser(socket.id);
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
