<template>
  <div>
    <div>
      <ul>
        <li v-for="channel in channels" :key="channel.id" @click="selectChannel(channel.name)">
          <a href="#">{{ channel.name }}</a>
        </li>
      </ul>
    </div>

    <div>
      <h1>{{ currentChannel }}</h1>
      <div id="chat-messages">
        <p v-for="(msg, index) in messages[currentChannel] || []" :key="index">
          <strong>{{ msg.nickname }}</strong>: {{ msg.message }}
        </p>
      </div>
      <input
        v-model="message"
        type="text"
        placeholder="Bienvenue" 
        @keydown.enter="sendMessage"
      />
      <button @click="sendMessage">Envoyer</button>
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";
import { ref, reactive, onMounted } from "vue";

export default {
  setup() {
    const socket = ref(null);
    const channels = ref([
      { id: 1, name: "Général" },
      { id: 2, name: "Privé" },
      { id: 3, name: "Gras de nunu" },
    ]);
    const currentChannel = ref("Général");
    const messages = reactive({}); // Store messages for each channel
    const message = ref("");
    const nickname = ref("");

    onMounted(() => {
      const storedPseudo = localStorage.getItem("pseudo");
      if (storedPseudo) {
        nickname.value = storedPseudo;
      } else {
        window.location.href = "/";
      }

      socket.value = io("http://localhost:3001");
      socket.value.emit("joinChannel", currentChannel.value);

      socket.value.on("message", (msg) => {
        if (!messages[msg.channelName]) {
          messages[msg.channelName] = [];
        }
        messages[msg.channelName].push(msg);
      });
    });

    const sendMessage = () => {
      if (message.value.trim()) {
        socket.value.emit("sendMessage", {
          channelName: currentChannel.value,
          message: message.value,
          nickname: nickname.value,
        });
        if (!messages[currentChannel.value]) {
          messages[currentChannel.value] = [];
        }
        messages[currentChannel.value].push({
          nickname: nickname.value,
          message: message.value,
        });
        message.value = "";
      }
    };

    const selectChannel = (channelName) => {
      if (currentChannel.value !== channelName) {
        socket.value.emit("joinChannel", channelName);
        currentChannel.value = channelName;
        if (!messages[channelName]) {
          messages[channelName] = []; // Initialize messages for the new channel
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
  border: 1px solid #ddd;
  height: 300px;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 10px;
}
</style>
