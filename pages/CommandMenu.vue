<template>
  <div>
    <h2>Liste des Commandes</h2>
    <input
      v-model="searchTerm"
      type="text"
      placeholder="Rechercher une commande..."
      class="border p-2 rounded w-full mb-4"
    />
    <ul>
      <li v-for="cmd in filteredCommands" :key="cmd.cmd">
        <strong>{{ cmd.cmd }}</strong>: {{ cmd.details }}
      </li>
    </ul>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { io } from "socket.io-client";

export default {
  name: "CommandMenu",
  setup() {
    const socket = ref(null);
    const commands = ref([]);
    const searchTerm = ref("");

    // Initialisation de Socket.IO
    onMounted(() => {
      if (typeof window !== "undefined") {
        socket.value = io("http://localhost:4000");

        // Émet l'événement pour récupérer les commandes
        socket.value.emit("getCommands");

        // Écoute la réponse du backend
        socket.value.on("commandsList", (data) => {
          console.log("Commandes reçues :", data); // Vérification dans la console
          commands.value = data;
        });
      }
    });

    // Filtrer les commandes selon la recherche
    const filteredCommands = computed(() =>
      commands.value.filter(
        (cmd) =>
          cmd.cmd.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
          cmd.details.toLowerCase().includes(searchTerm.value.toLowerCase())
      )
    );

    return {
      commands,
      searchTerm,
      filteredCommands,
    };
  },
};
</script>

<style scoped>
input {
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
