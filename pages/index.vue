<template>
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div class="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-200">
        <h1 class="text-3xl font-bold text-center text-gray-800 mb-8">
          Bienvenue sur <span class="text-blue-500">RelayChat+</span>
        </h1>
  
        <div>
          <h2 class="text-lg font-medium text-gray-700 mb-4">Choisissez un pseudo :</h2>
          <form @submit.prevent="submitPseudo">
            <input
              type="text"
              v-model="pseudo"
              placeholder="Ozheim"
              required
              class="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="submit"
              value="Se Connecter"
              class="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
          <p v-if="responseMessage" class="mt-6 text-blue-500 font-medium text-center">
            {{ responseMessage }}
          </p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        pseudo: '',
        responseMessage: '',
      };
    },
    methods: {
      async submitPseudo() {
        try {
          const response = await fetch('http://localhost:3000/api/postPseudo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: this.pseudo }),
          });
          const data = await response.json();
          this.responseMessage = `Pseudo enregistré : ${data.pseudo.name}`;
          console.log(data);
          this.$router.push({ path: '/home' });
          localStorage.setItem('pseudo', this.pseudo);
        } catch (error) {
          console.error("Erreur lors de l'enregistrement :", error);
          this.responseMessage = "Erreur lors de l'enregistrement.";
        }
      },
    },
  };
  </script>