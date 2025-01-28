<template>
  <div class="min-h-screen bg-gray-800 text-white flex">
    <!-- Liste des canaux -->
    <div class="w-1/4 bg-gray-900 p-4 flex flex-col">
      <h2 class="text-lg font-bold mb-4">Canaux</h2>
      <ul class="space-y-2 flex-1 overflow-y-auto">
        <li
          v-for="channel in channels"
          :key="channel.id"
          @click="selectChannel(channel.name)"
          class="cursor-pointer hover:text-orange-400"
          :class="{ 'text-orange-400': currentChannel === channel.name }"
        >
          <a href="#" class="block text-base font-medium">{{ channel.name }}</a>
        </li>
      </ul>
    </div>

    <!-- Zone de messages -->
    <div class="flex-1 flex flex-col">
      <!-- En-tête -->
      <div class="bg-gray-700 p-4 shadow-lg">
        <h1 class="text-xl font-bold">
          Messages pour : <span class="text-orange-400">{{ currentChannel }}</span>
        </h1>
      </div>

      <!-- Liste des messages -->
      <div
        id="chat-messages"
        class="flex-1 bg-gray-700 p-4 rounded-lg overflow-y-auto space-y-4"
      >
        <p
          v-for="(msg, index) in messages[currentChannel] || []"
          :key="index"
          class="bg-gray-600 p-3 rounded-lg"
        >
          <strong class="text-orange-400">{{ msg.nickname }}</strong> : {{ msg.message }}
        </p>
        <p v-if="!(messages[currentChannel]?.length)" class="text-gray-400 text-center">
          Aucun message pour ce canal.
        </p>
      </div>

      <!-- Envoi de message -->
      <div class="p-4 bg-gray-800 flex items-center space-x-4">
        <input
          v-model="message"
          type="text"
          placeholder="Tapez votre message..."
          class="flex-1 px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:ring focus:ring-orange-400"
          @keydown.enter="sendMessage"
        />
        <button
          @click="sendMessage"
          class="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 focus:outline-none focus:ring focus:ring-orange-400"
        >
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

        // Ajouter le message localement
        messages[currentChannel.value].push({
          nickname: nickname.value,
          message: msg,
        });

        message.value = "";

        // Scroll automatiquement en bas
        const chatContainer = document.getElementById("chat-messages");
        chatContainer.scrollTop = chatContainer.scrollHeight;
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
#chat-messages::-webkit-scrollbar {
  width: 8px;
}

#chat-messages::-webkit-scrollbar-thumb {
  background-color: #4a5568;
  border-radius: 4px;
}

#chat-messages::-webkit-scrollbar-thumb:hover {
  background-color: #2d3748;
}

input:focus {
  outline: none;
}
</style>
