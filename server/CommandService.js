import { useChannelStore } from "./channel.store.js";
import { useUserStore } from "./user.store.js";

export class CommandHandler {
  static availableCommands = [
    { cmd: "/join", details: "channel: Rejoindre un channel spécifique." },
    {
      cmd: "/list",
      details: "[recherche]: Affiche les channels disponibles sur le serveur.",
    },
    {
      cmd: "/users",
      details: "Affiche les utilisateurs présents dans le channel actuel.",
    },
    { cmd: "/nick", details: "pseudo: Change votre pseudo sur le serveur." },
    { cmd: "/create", details: "channel: Crée un channel avec le nom donné." },
    { cmd: "/delete", details: "channel: Supprime un channel existant." },
    { cmd: "/leave", details: "channel: Quitte le channel spécifié." },
  ];

  static invalidArgumentMessage() {
    return "Les arguments fournis pour cette commande ne sont pas valides.";
  }

  static processCommand(socket, command, ...params) {
    switch (command) {
      case "/join":
        return params.length === 1
          ? this.accessChannel(socket, params[0])
          : this.invalidArgumentMessage();
      case "/list":
        return this.fetchChannels(socket, params[0] || "");
      case "/users":
        return this.getActiveUsers(socket);
      case "/nick":
        return params.length === 1
          ? this.changeNickname(socket, params[0])
          : this.invalidArgumentMessage();
      case "/create":
        return params.length === 1
          ? this.createNewChannel(socket, params[0])
          : this.invalidArgumentMessage();
      case "/delete":
        return params.length === 1
          ? this.removeChannel(socket, params[0])
          : this.invalidArgumentMessage();
      case "/leave":
        return params.length === 1
          ? this.exitChannel(socket, params[0])
          : this.invalidArgumentMessage();
      default:
        return "Commande inconnue ou non prise en charge.";
    }
  }

  static accessChannel(socket, channelName) {
    const channelStore = useChannelStore();
    if (!channelStore.channels.some((ch) => ch.name === channelName)) {
      return socket.emit(
        "error",
        `Erreur : le channel "${channelName}" n'existe pas.`
      );
    }
    channelStore.joinChannel(channelName);
    socket.join(channelName);
    socket.emit("success", `Bienvenue dans le channel "${channelName}".`);
    socket.to(channelName).emit("message", {
      nickname: "Système",
      message: `Un utilisateur a rejoint "${channelName}".`,
    });
  }

  static fetchChannels(socket, filter = "") {
    const channelStore = useChannelStore();
    const filtered = channelStore.channels.filter((channel) =>
      channel.name.includes(filter)
    );
    if (!filtered.length) {
      return socket.emit("error", "Aucun channel trouvé.");
    }
    socket.emit("channels", filtered);
  }

  static getActiveUsers(socket) {
    const channelStore = useChannelStore();
    const users = channelStore.getCurrentChannelUsers();
    socket.emit("users", users);
  }

  static changeNickname(socket, newNick) {
    const userStore = useUserStore();
    try {
      userStore.updateNickname(newNick);
      socket.emit("success", `Votre pseudo est maintenant : ${newNick}`);
    } catch {
      socket.emit("error", `Le pseudo "${newNick}" est déjà utilisé.`);
    }
  }

  static createNewChannel(socket, name) {
    const channelStore = useChannelStore();
    if (channelStore.channels.some((ch) => ch.name === name)) {
      return socket.emit("error", `Erreur : le channel "${name}" existe déjà.`);
    }
    channelStore.createChannel(name);
    socket.emit("success", `Channel "${name}" créé avec succès.`);
  }

  static removeChannel(socket, name) {
    const channelStore = useChannelStore();
    if (!channelStore.channels.some((ch) => ch.name === name)) {
      return socket.emit(
        "error",
        `Erreur : le channel "${name}" n'existe pas.`
      );
    }
    channelStore.deleteChannel(name);
    socket.emit("success", `Channel "${name}" supprimé avec succès.`);
  }

  static exitChannel(socket, name) {
    const channelStore = useChannelStore();
    if (channelStore.currentChannel !== name) {
      return socket.emit("error", `Vous n'êtes pas dans le channel "${name}".`);
    }
    channelStore.leaveChannel(name);
    socket.leave(name);
    socket.emit("success", `Vous avez quitté le channel "${name}".`);
    socket.join("Général");
  }
}
