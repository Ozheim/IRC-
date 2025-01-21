io.on("connection", (socket) => {
  console.log("Un utilisateur s'est connecté");

  socket.on("userConnected", (nickname) => {
    addUser(socket.id, nickname);
    console.log(`${nickname} est connecté`);
  });

  socket.on("joinChannel", (channelName) => {
    createChannel(channelName);
    socket.join(channelName);
    socket.emit("messageHistory", channels[channelName]);
    io.to(channelName).emit("message", {
      nickname: "System",
      message: `${getUser(socket.id)} a rejoint ${channelName}`,
    });
  });

  socket.on("sendMessage", ({ channelName, message, nickname }) => {
    if (message.trim() === "/list") {
      // Récupérer tous les utilisateurs connectés
      const allUsers = Array.from(getAllUsers());
      socket.emit("message", {
        nickname: "System",
        message: `Utilisateurs connectés : ${allUsers.join(", ")}`,
      });
    } else {
      const newMessage = { nickname, message };
      addMessage(channelName, newMessage);
      io.to(channelName).emit("message", newMessage);
    }
  });

  socket.on("listChannels", () => {
    const availableChannels = Object.keys(channels);
    socket.emit("message", {
      nickname: "System",
      message: `Channels disponibles : ${availableChannels.join(", ")}`,
    });
  });

  socket.on("listUsers", (channelName) => {
    const usersInChannel = Array.from(io.sockets.adapter.rooms.get(channelName) || []);
    const userNames = usersInChannel.map((id) => getUser(id));
    socket.emit("message", {
      nickname: "System",
      message: `Utilisateurs dans ${channelName} : ${userNames.join(", ")}`,
    });
  });

  socket.on("disconnect", () => {
    const user = getUser(socket.id);
    console.log(`${user} s'est déconnecté`);
    removeUser(socket.id);
  });
});
