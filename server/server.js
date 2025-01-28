import dotenv from "dotenv";
dotenv.config();

import { Server } from "socket.io";
import { createServer } from "http";
import prisma from "./prismaClient.js";
import { addUser, removeUser, getUser } from "./user.js";

console.log("📌 Modèles disponibles dans Prisma :", Object.keys(prisma));
console.log("✅ DATABASE_URL:", process.env.DATABASE_URL || "❌ Non définie ! Vérifie ton fichier .env");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// 📌 Création des channels par défaut
async function createDefaultChannels() {
  const defaultChannels = ["Général", "Privé", "Gras de nunu"];

  for (const name of defaultChannels) {
    const existingChannel = await prisma.channel.findUnique({ where: { name } });

    if (!existingChannel) {
      await prisma.channel.create({ data: { name } });
      console.log(`✅ Channel créé : ${name}`);
    }
  }
}

// 📌 Fonction pour récupérer l'ID d'un channel
async function getChannelId(channelName) {
  const channel = await prisma.channel.findUnique({
    where: { name: channelName },
    select: { id: true },
  });

  if (!channel) {
    console.error(`❌ Erreur : Channel "${channelName}" introuvable.`);
    return null;
  }

  return channel.id;
}

// 📌 Gestion des connexions Socket.IO
io.on("connection", (socket) => {
  console.log("Un utilisateur s'est connecté :", socket.id);

  // 📌 Connexion d'un utilisateur
  socket.on("userConnected", async (nickname) => {
    console.log(`📥 Pseudo reçu du client: "${nickname}"`); // Debug
    try {
      let user = await prisma.pseudo.findUnique({ where: { name: nickname } });

      if (!user) {
        user = await prisma.pseudo.create({ data: { name: nickname } });
        console.log(`✅ Nouveau pseudo enregistré : ${nickname}`);
      }

      addUser(socket.id, user.name);
      socket.emit("nicknameAccepted", user.name); // ✅ Ajout d'un retour pour le client
      console.log(`${user.name} est connecté.`);
    } catch (error) {
      console.error("❌ Erreur lors de la connexion utilisateur :", error);
    }
  });

  // 📌 Rejoindre un channel
  socket.on("joinChannel", async (channelName) => {
    try {
      socket.join(channelName);
      console.log(`👤 ${socket.id} a rejoint le canal : ${channelName}`);

      const channelId = await getChannelId(channelName);
      if (!channelId) return;

      const messages = await prisma.message.findMany({
        where: { channelId },
        include: { pseudo: true },
        orderBy: { timestamp: "asc" },
      });

      socket.emit("previousMessages", { channel: channelName, messages });
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des messages :", error);
    }
  });

  // 📌 Envoi de message
  socket.on("sendMessage", async ({ channelName, message, nickname }) => {
    try {
      const channelId = await getChannelId(channelName);
      if (!channelId) return;

      let user = await prisma.pseudo.findUnique({ where: { name: nickname } });

      if (!user) {
        user = await prisma.pseudo.create({ data: { name: nickname } });
      }

      const newMessage = await prisma.message.create({
        data: {
          content: message,
          channelId,
          pseudoId: user.id,
        },
        include: { pseudo: true },
      });

      io.to(channelName).emit("message", { channel: channelName, message: newMessage });
      console.log(`💾 Message enregistré et diffusé dans ${channelName} :`, newMessage);
    } catch (error) {
      console.error("❌ Erreur lors de l'enregistrement du message :", error);
    }
  });

  // 📌 Déconnexion d'un utilisateur
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
