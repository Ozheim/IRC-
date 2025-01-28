<template>
  <div class="min-h-screen flex bg-gray-100">
    <!-- Barre latérale (Canaux) -->
    <div class="w-64 bg-white flex flex-col border-r border-gray-200">
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-800">Canaux</h2>
      </div>
      <ul class="flex-1 overflow-y-auto">
        <li
          v-for="channel in channels"
          :key="channel.id"
          @click="selectChannel(channel.name)"
          class="cursor-pointer px-4 py-3 transition-colors"
          :class="{
            'bg-blue-100 text-blue-800 font-semibold': currentChannel === channel.name,
            'hover:bg-gray-100 text-gray-600': currentChannel !== channel.name,
          }"
        >
          {{ channel.name }}
        </li>
      </ul>
    </div>

    <!-- Contenu principal : messages -->
    <div class="flex-1 flex flex-col">
      <!-- Barre d'entête -->
      <div class="flex items-center p-4 bg-blue-600 shadow-md">
        <h1 class="text-xl font-semibold text-white">
          Messages pour : <span class="font-normal">{{ currentChannel }}</span>
        </h1>
      </div>

      <!-- Zone des messages -->
      <div id="chat-messages" class="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div
          v-for="(msg, index) in messages[currentChannel] || []"
          :key="index"
          class="mb-3 flex"
          :class="{
            'justify-end': msg.nickname === nickname,
            'justify-start': msg.nickname !== nickname,
          }"
        >
          <div
            class="max-w-[70%] p-3 rounded-xl text-sm shadow"
            :class="{
              'bg-blue-500 text-white rounded-tr-none': msg.nickname === nickname,
              'bg-white text-gray-700 rounded-tl-none': msg.nickname !== nickname,
            }"
          >
            <strong v-if="msg.nickname !== nickname" class="block font-semibold mb-1">
              {{ msg.nickname }}
            </strong>
            <p>{{ msg.message }}</p>
          </div>
        </div>

        <!-- Message par défaut si aucun message dans ce canal -->
        <p v-if="!(messages[currentChannel]?.length)" class="text-gray-500 text-center mt-4">
          Aucun message pour ce canal.
        </p>
      </div>

      <!-- Zone d'envoi de message -->
      <div class="p-4 bg-white border-t border-gray-200">
        <div class="flex items-center space-x-2">
          <input
            v-model="message"
            type="text"
            placeholder="Tapez votre message..."
            class="flex-1 px-4 py-2 rounded-full bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keydown.enter="sendMessage"
          />
          <button
            @click="sendMessage"
            class="px-5 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Envoyer
          </button>
        </div>
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

        // On affiche localement le message de l’utilisateur
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

<style scoped>
/* Personnalisation de la scrollbar du chat */
#chat-messages::-webkit-scrollbar {
  width: 8px;
}

#chat-messages::-webkit-scrollbar-thumb {
  background-color: #aaa;
  border-radius: 4px;
}

#chat-messages::-webkit-scrollbar-thumb:hover {
  background-color: #888;
}
</style>
