import dotenv from "dotenv";
dotenv.config();

import { Server } from "socket.io";
import { createServer } from "http";
import { PrismaClient } from "@prisma/client";
import { CommandHandler } from "./CommandService.js";
import { addUser, removeUser, getUser } from "./user.js";

const prisma = new PrismaClient();
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // vérifiez l'origine en fonction de votre configuration
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Création des channels par défaut
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

const channels = {};

// Fonction d'ajout de message avec persistance en BDD
async function addMessage(channelName, message) {
  if (!channels[channelName]) {
    channels[channelName] = [];
  }
  channels[channelName].push(message);
  console.log(`Message ajouté à ${channelName} :`, message);

  // Récupérer le channel et le pseudo pour stocker la référence
  const channelRecord = await prisma.channel.findUnique({ where: { name: channelName } });
  const pseudoRecord = await prisma.pseudo.findUnique({ where: { name: message.nickname } });
  if (channelRecord && pseudoRecord) {
    const newMessage = await prisma.message.create({
      data: {
        content: message.message,
        channelId: channelRecord.id,
        pseudoId: pseudoRecord.id,
      },
    });
    console.log(`Message added to channel "${channelName}":`, newMessage);
  }
}

io.on("connection", (socket) => {
  console.log("Un utilisateur s'est connecté :", socket.id);

  // Par défaut, le socket rejoint le canal "Général"
  socket.currentChannel = "Général";
  socket.join("Général");

  socket.on("userConnected", async (nickname) => {
    addUser(socket.id, nickname);
    try {
      // Utilisation d'upsert pour éviter l'erreur si le pseudo existe déjà
      await prisma.pseudo.upsert({
        where: { name: nickname },
        update: {},
        create: { name: nickname },
      });
      console.log(`${nickname} est connecté.`);
    } catch (error) {
      console.error("Erreur lors de la création du pseudo :", error.message);
    }
  });

  // Lorsqu'un utilisateur rejoint un canal, charger l'historique des messages
  socket.on("joinChannel", async (channelName) => {
    socket.leave(socket.currentChannel);
    socket.currentChannel = channelName;
    socket.join(channelName);
    socket.emit("joinedChannel", channelName);
    // Charger l'historique depuis la BDD
    const channelRecord = await prisma.channel.findUnique({ where: { name: channelName } });
    if (channelRecord) {
      const channelMessages = await prisma.message.findMany({
        where: { channelId: channelRecord.id },
        include: { pseudo: true },
        orderBy: { id: "asc" },
      });
      const mappedMessages = channelMessages.map((m) => ({
        nickname: m.pseudo ? m.pseudo.name : "Système",
        message: m.content,
        isSystem: m.pseudo ? (m.pseudo.name === "Système") : true,
        channelName: channelName,
      }));
      socket.emit("loadMessages", { channelName, messages: mappedMessages });
    } else {
      socket.emit("loadMessages", { channelName, messages: [] });
    }
  });

  socket.on("getCommands", () => {
    const commands = CommandHandler.availableCommands;
    socket.emit("commandsList", commands);
  });

  socket.on("sendMessage", async ({ channelName, message, nickname }) => {
    // Si le message est une commande, le traiter et ne pas le diffuser comme message classique
    if (message.startsWith("/")) {
      const [command, ...params] = message.split(" ");
      const response = await CommandHandler.processCommand(socket, command, ...params);
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

// Création des channels par défaut avant de lancer le serveur
await createDefaultChannels();

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Serveur Socket.IO lancé sur http://localhost:${PORT}`);
});
