<template>
        <div>
            <div class="">
            <ul class="">
                <li v-for="channel in channels" :key="channel.id" @click="selectChannel(channel.name)">
                <a href="#">{{ channel.name }}</a>
                </li>
            </ul>

        </div>
        <div>
            <h1>{{ currentChannel }} </h1>
            <input type="text" placeholder="votre message">
        </div>
     </div>
</template>

<script>
import { io } from "socket.io-client";
import { ref, onMounted } from "vue";

export default {
  setup() {
    const socket = ref(null);
    const channels = ref([
      { id: 1, name: "Général" },
      { id: 2, name: "Privé" },
      { id: 3, name: "Gras de nunu" },
    ]);
    const currentChannel = ref("Général");
    const messagesByChannel = ref({});
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
        if (!messagesByChannel.value[msg.channelName]) {
          messagesByChannel.value[msg.channelName] = [];
        }
        messagesByChannel.value[msg.channelName].push(msg);
      });
    });

    const sendMessage = () => {
      if (message.value.trim()) {
        const newMessage = {
          channelName: currentChannel.value,
          message: message.value,
          nickname: nickname.value,
        };
        socket.value.emit("sendMessage", newMessage);

        if (!messagesByChannel.value[currentChannel.value]) {
          messagesByChannel.value[currentChannel.value] = [];
        }
        messagesByChannel.value[currentChannel.value].push(newMessage);
        message.value = "";
      }
    };

    const selectChannel = (channelName) => {
      currentChannel.value = channelName;
      socket.value.emit("joinChannel", channelName);
    };

    return {
      channels,
      currentChannel,
      messagesByChannel,
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
