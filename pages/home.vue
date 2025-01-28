<template>
  <div>
    <div>
      <ul>
        <li
          v-for="channel in channels"
          :key="channel.id"
          @click="selectChannel(channel.name)"
        >
          <a href="#">{{ channel.name }}</a>
        </li>
      </ul>
    </div>

    <div>
      <p>Messages pour le canal : {{ currentChannel }}</p>
      <p>Clés disponibles dans messages : {{ Object.keys(messages) }}</p>
      <div id="chat-messages">
        <p v-for="(msg, index) in (messages[currentChannel] || [])" :key="index">
          <strong>{{ msg.nickname }}</strong>: {{ msg.message }}
        </p>
        <p v-if="!(messages[currentChannel]?.length)">Aucun message pour ce canal.</p>
      </div>
      <input
        v-model="message"
        type="text"
        placeholder="Tapez votre message"
        @keydown.enter="sendMessage"
      />
      <button @click="sendMessage">Envoyer</button>
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";
import { ref, reactive, onMounted, onUnmounted } from "vue";

export default {
  setup() {
    const socket = ref(null); // Socket.IO instance
    const channels = ref([
      { id: 1, name: "Général" },
      { id: 2, name: "Privé" },
      { id: 3, name: "Gras de nunu" },
    ]);
    const currentChannel = ref("Général");
    const messages = reactive({
      Général: [],
      Privé: [],
      "Gras de nunu": [],
    });
    const message = ref("");
    const nickname = ref("");

    onMounted(() => {
  const storedPseudo = localStorage.getItem("pseudo");
  if (storedPseudo) {
    nickname.value = storedPseudo;
  } else {
    window.location.href = "/";
    return;
  }

  socket.value = io("http://localhost:4000");

// join 
  socket.value.emit("joinChannel", currentChannel.value);


  socket.value.on("message", (msg) => {
    console.log("Message reçu côté client :", msg);
    if (!messages[msg.channelName]) {
      messages[msg.channelName] = [];
    }
    messages[msg.channelName].push(msg);
  });

// users 
  socket.value.on("users", (users) => {
    console.log("Liste des utilisateurs :", users);
  });

// check list 
  socket.value.on("channels", (filtered) => {
    console.log("Liste des channels :", filtered);
  });

// listen errors 
  socket.value.on("error", (msg) => {
    console.error("Erreur reçue du serveur :", msg);
  });

// listen success
  socket.value.on("success", (msg) => {
    console.log("Message de succès :", msg);
  });

 // notyf 
  socket.value.on("joinedChannel", (channelName) => {
    console.log(`Vous avez rejoint le channel : ${channelName}`);
    currentChannel.value = channelName;
  });

// chan created
  socket.value.on("channelCreated", (channelName) => {
    console.log(`Nouveau channel créé : ${channelName}`);
  });

  // chan deleted 
  socket.value.on("channelDeleted", (channelName) => {
    console.log(`Channel supprimé : ${channelName}`);
  });

 // change nickname 
  socket.value.on("nicknameChanged", (newNick) => {
    console.log(`Votre nouveau pseudo est : ${newNick}`);
    nickname.value = newNick;
  });

// leaved chanel   
  socket.value.on("leftChannel", (channelName) => {
    console.log(`Vous avez quitté le channel : ${channelName}`);
  });
});



    onUnmounted(() => {
      if (socket.value) {
        socket.value.disconnect(); 
      }
    });

    const sendMessage = () => {
      if (message.value.trim()) {
        const msg = message.value.trim();

        socket.value.emit("sendMessage", {
          channelName: currentChannel.value,
          message: msg,
          nickname: nickname.value,
        });

        message.value = "";
      }
    };

    const selectChannel = (channelName) => {
      if (currentChannel.value !== channelName) {
        socket.value.emit("joinChannel", channelName);
        currentChannel.value = channelName;

        if (!messages[channelName]) {
          messages[channelName] = [];
        }
      }
    };

    return {
      channels,
      currentChannel,
      messages,
      message,
      nickname,
      sendMessage,
      selectChannel,
    };
  },
};
</script>

<style scoped>
#chat-messages {
  border: 1px solid red;
  height: 300px;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 10px;
}

input {
  width: 100%;
  padding: 8px;
  margin-top: 10px;
}

button {
  padding: 8px 15px;
  margin-top: 10px;
}
</style>
