<template>
  <div class="chat-container">
 
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>Canaux</h2>
      </div>
      <ul class="channel-list">
        <li
          v-for="channel in channels"
          :key="channel.id"
          @click="selectChannel(channel.name)"
          :class="{
            'active-channel': currentChannel === channel.name,
          }"
        >
          {{ channel.name }}
        </li>
      </ul>
    </div>

    <!-- Contenu principal : messages -->
    <div class="main-content">
      <!-- Barre d'entête -->
      <div class="header">
        <h1>
          Messages pour : <span>{{ currentChannel }}</span>
        </h1>
      </div>

      <!-- Zone des messages -->
      <div id="chat-messages" class="message-container">
        <div
          v-for="(msg, index) in messages[currentChannel] || []"
          :key="index"
          :class="{
            'message-right': msg.nickname === nickname,
            'message-left': msg.nickname !== nickname,
          }"
        >
          <div class="message">
            <strong v-if="msg.nickname !== nickname">
              {{ msg.nickname }}
            </strong>
            <p>{{ msg.message }}</p>
          </div>
        </div>

        <p v-if="!(messages[currentChannel]?.length)" class="no-messages">
          Aucun message pour ce canal.
        </p>
      </div>

      <!-- Zone d'envoi de message -->
      <div class="input-container">
        <input
          v-model="message"
          type="text"
          placeholder="Tapez votre message..."
          @keydown.enter="sendMessage"
        />
        <button @click="sendMessage">
          Envoyer
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";
import { ref, reactive, onMounted, onUnmounted } from "vue";

export default {
  setup() {
    const socket = ref(null);
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

      socket.value = io("http://localhost:3001");

      socket.value.emit("joinChannel", currentChannel.value);

      socket.value.on("message", (msg) => {
        if (!messages[msg.channelName]) {
          messages[msg.channelName] = [];
        }
        messages[msg.channelName].push(msg);
      });

      socket.value.on("users", (users) => {
        console.log("Liste des utilisateurs :", users);
      });

      socket.value.on("channels", (filtered) => {
        console.log("Liste des channels :", filtered);
      });

      socket.value.on("error", (msg) => {
        console.error("Erreur reçue du serveur :", msg);
      });

      socket.value.on("success", (msg) => {
        console.log("Message de succès :", msg);
      });

      socket.value.on("joinedChannel", (channelName) => {
        currentChannel.value = channelName;
      });

      socket.value.on("channelCreated", (channelName) => {
        console.log(`Nouveau channel créé : ${channelName}`);
      });

      socket.value.on("channelDeleted", (channelName) => {
        console.log(`Channel supprimé : ${channelName}`);
      });

      socket.value.on("nicknameChanged", (newNick) => {
        nickname.value = newNick;
      });

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

        messages[currentChannel.value].push({
          nickname: nickname.value,
          message: msg,
        });

        message.value = "";

        const chatContainer = document.getElementById("chat-messages");
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
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