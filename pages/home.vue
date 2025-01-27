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
      }

      socket.value = io("http://localhost:4000");

      socket.value.emit("joinChannel", currentChannel.value);

      socket.value.on("message", (msg) => {
        const channel = msg.channelName || currentChannel.value;

        if (!messages[channel]) {
          messages[channel] = [];
        }

        messages[channel].push(msg);
      });
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
