// CommandService.js
import { PrismaClient } from "@prisma/client";
import { addUser, removeUser, getUser } from "./user.js";

export class CommandHandler {
  static availableCommands = [
    { cmd: "/join", details: "channel: Rejoindre un channel spécifique." },
    {
      cmd: "/list",
      details: "[recherche]: Affiche les channels disponibles sur le serveur.",
    },
    { cmd: "/users", details: "Affiche les utilisateurs présents dans le channel actuel." },
    { cmd: "/nick", details: "pseudo: Change votre pseudo sur le serveur." },
    { cmd: "/create", details: "channel: Crée un channel avec le nom donné." },
    { cmd: "/delete", details: "channel: Supprime un channel existant." },
    { cmd: "/leave", details: "channel: Quitte le channel spécifié." },
    { cmd: "/clear_all", details: "Efface toutes les données (messages et pseudos)." },
  ];

  static invalidArgumentMessage() {
    return "Les arguments fournis pour cette commande ne sont pas valides.";
  }

  static async processCommand(socket, command, ...params) {
    switch (command) {
      case "/join":
        return params.length === 1
          ? await this.accessChannel(socket, params[0])
          : this.invalidArgumentMessage();
      case "/list":
        return await this.fetchChannels(socket, params[0] || "");
      case "/users":
        return await this.getActiveUsers(socket);
      case "/nick":
        return params.length === 1
          ? await this.changeNickname(socket, params[0])
          : this.invalidArgumentMessage();
      case "/create":
        return params.length === 1
          ? await this.createNewChannel(socket, params[0])
          : this.invalidArgumentMessage();
      case "/delete":
        return params.length === 1
          ? await this.removeChannel(socket, params[0])
          : this.invalidArgumentMessage();
      case "/leave":
        return params.length === 1
          ? await this.exitChannel(socket, params[0])
          : this.invalidArgumentMessage();
      case "/clear_all":
        return params.length === 0
          ? await this.clearAllData(socket)
          : this.invalidArgumentMessage();
      default:
        return "Commande inconnue ou non prise en charge.";
    }
  }

  static async accessChannel(socket, channelName) {
    const prisma = new PrismaClient();
    const channel = await prisma.channel.findFirst({
      where: { name: { equals: channelName, mode: "insensitive" } },
    });
    if (!channel) {
      socket.emit("error", `Erreur : le channel "${channelName}" n'existe pas.`);
      return `Erreur : le channel "${channelName}" n'existe pas.`;
    }
    socket.leave(socket.currentChannel);
    socket.currentChannel = channel.name;
    socket.join(channel.name);
    socket.emit("success", `Bienvenue dans le channel "${channel.name}".`);
    socket.emit("joinedChannel", channel.name);
    socket.to(channel.name).emit("message", {
      nickname: "Système",
      message: `Un utilisateur a rejoint "${channel.name}".`,
    });
    return `Vous avez rejoint le channel "${channel.name}".`;
  }

  static async fetchChannels(socket, filter = "") {
    const prisma = new PrismaClient();
    const channels = await prisma.channel.findMany({
      where: {
        name: { contains: filter, mode: "insensitive" },
      },
    });
    if (!channels.length) {
      socket.emit("error", "Aucun channel trouvé.");
      return "Aucun channel trouvé.";
    }
    socket.emit("channels", channels);
    return channels;
  }

  static async getActiveUsers(socket) {
    const roomName = socket.currentChannel;
    if (!roomName) {
      socket.emit("error", "Vous n'êtes dans aucun channel.");
      return "Vous n'êtes dans aucun channel.";
    }
    const clients = socket.adapter.rooms.get(roomName) || new Set();
    const userList = [];
    for (const clientId of clients) {
      const user = getUser(clientId);
      if (user) userList.push(user);
    }
    socket.emit("users", userList);
    return userList;
  }

  static async changeNickname(socket, newNick) {
    const oldNick = getUser(socket.id);
    if (!oldNick) {
      socket.emit("error", "Utilisateur non trouvé.");
      return "Utilisateur non trouvé.";
    }
    const prisma = new PrismaClient();
    try {
      await prisma.pseudo.update({
        where: { name: oldNick },
        data: { name: newNick },
      });
      removeUser(socket.id);
      addUser(socket.id, newNick);
      socket.emit("success", `Votre pseudo est maintenant : ${newNick}`);
      socket.emit("nicknameChanged", newNick);
      return `Votre pseudo est maintenant : ${newNick}`;
    } catch (error) {
      socket.emit("error", `Le pseudo "${newNick}" est déjà utilisé.`);
      return `Erreur: ${error.message}`;
    }
  }

  static async createNewChannel(socket, name) {
    const prisma = new PrismaClient();
    const existing = await prisma.channel.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing) {
      socket.emit("error", `Erreur : le channel "${name}" existe déjà.`);
      return `Erreur : le channel "${name}" existe déjà.`;
    }
    await prisma.channel.create({ data: { name } });
    socket.emit("success", `Channel "${name}" créé avec succès.`);
    return `Channel "${name}" créé avec succès.`;
  }

  static async removeChannel(socket, name) {
    const prisma = new PrismaClient();
    const existing = await prisma.channel.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (!existing) {
      socket.emit("error", `Erreur : le channel "${name}" n'existe pas.`);
      return `Erreur : le channel "${name}" n'existe pas.`;
    }
    await prisma.channel.delete({ where: { id: existing.id } });
    socket.emit("success", `Channel "${existing.name}" supprimé avec succès.`);
    return `Channel "${existing.name}" supprimé avec succès.`;
  }

  static async exitChannel(socket, name) {
    if (socket.currentChannel.toLowerCase() !== name.toLowerCase()) {
      socket.emit("error", `Vous n'êtes pas dans le channel "${name}".`);
      return `Vous n'êtes pas dans le channel "${name}".`;
    }
    try {
      socket.leave(name);
      socket.currentChannel = "Général";
      socket.join("Général");
      socket.emit(
        "success",
        `Vous avez quitté le channel "${name}". Vous êtes maintenant dans "Général".`
      );
      socket.emit("joinedChannel", "Général");
      return `Vous avez quitté le channel "${name}". Vous êtes maintenant dans "Général".`;
    } catch (error) {
      socket.emit("error", "Impossible de quitter le channel.");
      return "Impossible de quitter le channel.";
    }
  }

  static async clearAllData(socket) {
    const prisma = new PrismaClient();
    try {
      // Supprimer tous les messages
      await prisma.message.deleteMany({});
      // Supprimer tous les pseudos
      await prisma.pseudo.deleteMany({});
      // Notifier tous les clients pour qu'ils effacent leur historique local
      socket.server.emit("clearAllData", "Toutes les données ont été effacées.");
      socket.emit("success", "Toutes les données ont été effacées avec succès.");
      return "Toutes les données ont été effacées avec succès.";
    } catch (error) {
      socket.emit("error", "Erreur lors de la suppression des données : " + error.message);
      return "Erreur lors de la suppression des données : " + error.message;
    }
  }
}
