import { useChannelStore } from "@/server/channel.store"; // Assurez-vous que ce fichier existe
import { useUserStore } from "@/server/user.store"; // Assurez-vous que ce fichier existe

export class CommandService {
  static commands = [
    { command: "/join", description: "channel: Rejoindre le channel spécifié." },
    { command: "/list", description: "[recherche]: Lister tous les channels disponibles sur le serveur." },
    { command: "/users", description: "Lister les utilisateurs connectés dans le channel actuel." },
    { command: "/nick", description: "pseudo: Définir votre pseudo sur le serveur." },
    { command: "/create", description: "channel: Créer un channel avec le nom spécifié." },
    { command: "/delete", description: "channel: Supprimer un channel avec le nom spécifié." },
    { command: "/leave", description: "channel: Quitter le channel spécifié." },
  ];

  static showArgumentError() {
    return "Mauvais type d'argument pour cette commande !";
  }

  static executeCommand(command, ...args) {
    switch (command) {
      case "/join":
        if (args.length === 1) return this.joinChannel(args[0]);
        return this.showArgumentError();
      case "/list":
        return this.listChannels(args[0]);
      case "/users":
        return this.listUsers();
      case "/nick":
        if (args.length === 1) return this.setNickname(args[0]);
        return this.showArgumentError();
      case "/create":
        if (args.length === 1) return this.createChannel(args[0]);
        return this.showArgumentError();
      case "/delete":
        if (args.length === 1) return this.deleteChannel(args[0]);
        return this.showArgumentError();
      case "/leave":
        if (args.length === 1) return this.leaveChannel(args[0]);
        return this.showArgumentError();
      default:
        return "Commande non reconnue !";
    }
  }

  static joinChannel(channelName) {
    const channelStore = useChannelStore();
    if (!channelStore.channels.find((channel) => channel.name === channelName)) {
      return `Le channel ${channelName} n'existe pas.`;
    }
    channelStore.joinChannel(channelName);
    return `Vous avez rejoint le channel ${channelName}.`;
  }

  static listChannels(search = "") {
    const channelStore = useChannelStore();
    const filteredChannels = channelStore.channels.filter((channel) =>
      channel.name.includes(search)
    );
    const message = filteredChannels.map((channel) => `- ${channel.name}`).join("\n");
    return `Liste des channels disponibles :\n${message}`;
  }

  static listUsers() {
    const channelStore = useChannelStore();
    const users = channelStore.getCurrentChannelUsers();
    if (!users.length) {
      return "Aucun utilisateur n'est connecté dans ce channel.";
    }
    return `Utilisateurs connectés : ${users.join(", ")}`;
  }

  static setNickname(newNickname) {
    const userStore = useUserStore();
    try {
      userStore.updateNickname(newNickname);
      return `Votre pseudo a été mis à jour : ${newNickname}`;
    } catch (error) {
      return `Le pseudo "${newNickname}" est déjà pris.`;
    }
  }

  static createChannel(channelName) {
    const channelStore = useChannelStore();
    if (channelStore.channels.find((channel) => channel.name === channelName)) {
      return `Le channel "${channelName}" existe déjà.`;
    }
    channelStore.createChannel(channelName);
    return `Channel "${channelName}" créé avec succès.`;
  }

  static deleteChannel(channelName) {
    const channelStore = useChannelStore();
    if (!channelStore.channels.find((channel) => channel.name === channelName)) {
      return `Le channel "${channelName}" n'existe pas.`;
    }
    channelStore.deleteChannel(channelName);
    return `Channel "${channelName}" supprimé avec succès.`;
  }

  static leaveChannel(channelName) {
    const channelStore = useChannelStore();
    if (channelStore.currentChannel !== channelName) {
      return `Vous n'êtes pas dans le channel "${channelName}".`;
    }
    channelStore.leaveChannel(channelName);
    channelStore.joinChannel("Général");
    return `Vous avez quitté le channel "${channelName}".`;
  }
}
