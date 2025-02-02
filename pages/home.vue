<template>
  <div class="chat-container">
    <!-- Sidebar : Liste des channels -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>Canaux</h2>
      </div>
      <ul class="channel-list">
        <li
          v-for="channel in channels"
          :key="channel.id"
          @click="selectChannel(channel.name)"
          :class="{ 'active-channel': currentChannel === channel.name }"
        >
          {{ channel.name }}
        </li>
      </ul>
    </div>

    <!-- Contenu principal -->
    <div class="main-content">
      <div class="header">
        <h1>
          <span>{{ currentChannel }}</span>
        </h1>
      </div>

      <!-- Zone d'affichage des messages -->
      <div id="chat-messages" class="message-container">
        <div
          v-for="(msg, index) in messages[currentChannel] || []"
          :key="index"
          :class="{
            'message-system': msg.isSystem,
            'message-user': !msg.isSystem
          }"
        >
          <template v-if="!msg.isSystem">
            <div class="message-header">
              <strong>{{ msg.nickname }}</strong>
            </div>
            <div class="message-body">
              <p>{{ msg.message }}</p>
            </div>
          </template>
          <template v-else>
            <div class="system-message">
              <p>{{ msg.message }}</p>
            </div>
          </template>
        </div>
      </div>

      <!-- Zone de saisie -->
      <div class="input-container">
        <input
          v-model="message"
          type="text"
          placeholder="Tapez votre message..."
          @keydown.enter="sendMessage"
        />
        <button @click="sendMessage">Envoyer</button>
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

    const scrollChat = () => {
      const chatContainer = document.getElementById("chat-messages");
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    };

    onMounted(() => {
      const storedPseudo = localStorage.getItem("pseudo");
      if (storedPseudo) {
        nickname.value = storedPseudo;
      } else {
        window.location.href = "/";
        return;
      }

      socket.value = io("http://localhost:3001");

      // Rejoindre le canal par défaut et enregistrer l'utilisateur
      socket.value.emit("joinChannel", currentChannel.value);
      socket.value.emit("userConnected", nickname.value);

      // Réception des messages diffusés par le serveur
      socket.value.on("message", (msg) => {
        msg.isSystem = (msg.nickname === "Système");
        if (!messages[msg.channelName]) {
          messages[msg.channelName] = [];
        }
        messages[msg.channelName].push(msg);
        scrollChat();
      });

      // Chargement de l'historique lors du joinChannel
      socket.value.on("loadMessages", (data) => {
        if (data && data.channelName) {
          messages[data.channelName] = data.messages;
          scrollChat();
        }
      });

      // Réception de la réponse d'une commande
      socket.value.on("commandResponse", (response) => {
        messages[currentChannel.value].push({
          nickname: "Système",
          message: response,
          isSystem: true,
          channelName: currentChannel.value,
        });
        scrollChat();
      });

      // Écoute de l'événement clearAllData pour effacer l'historique local
      socket.value.on("clearAllData", (msg) => {
        for (const key in messages) {
          messages[key] = [];
        }
        messages[currentChannel.value].push({
          nickname: "Système",
          message: msg,
          isSystem: true,
          channelName: currentChannel.value,
        });
        scrollChat();
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

      socket.value.on("nicknameChanged", (newNick) => {
        nickname.value = newNick;
      });
    });

    onUnmounted(() => {
      if (socket.value) {
        socket.value.disconnect();
      }
    });

    const sendMessage = () => {
      if (message.value.trim()) {
        const msgText = message.value.trim();
        // Envoi du message (s'il s'agit d'une commande, le serveur le traite et renvoie uniquement la réponse)
        socket.value.emit("sendMessage", {
          channelName: currentChannel.value,
          message: msgText,
          nickname: nickname.value,
        });
        message.value = "";
        scrollChat();
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
.chat-container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 250px;
  border-right: 1px solid #ccc;
  padding: 10px;
}

.channel-list {
  list-style: none;
  padding: 0;
}

.channel-list li {
  padding: 5px;
  cursor: pointer;
}

.channel-list li.active-channel {
  background-color: #eee;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.message-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.input-container {
  padding: 10px;
  border-top: 1px solid #ccc;
  display: flex;
}

.input-container input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.input-container button {
  margin-left: 10px;
  padding: 8px 12px;
}

.message-user {
  margin-bottom: 10px;
  text-align: left;
}

.message-header {
  font-weight: bold;
  margin-bottom: 2px;
}

.message-body {
  background: #f1f1f1;
  padding: 8px;
  border-radius: 4px;
}

.message-system {
  margin-bottom: 10px;
  margin-left: 20px;
  font-style: italic;
  color: gray;
  text-align: left;
}

.system-message p {
  margin: 0;
}
</style>
