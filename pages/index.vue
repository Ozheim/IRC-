<template>
  <div class="first-container">
    <div class="title-container">
      <h1 class="title-index">
        Bienvenue sur <span class="RelayChat">RelayChat+</span>
      </h1>
    </div>
    <div class="pseudoWrapper">
    <div class="pseudo-container">
      <h2 class="pseudo-title">Choisissez un pseudo :</h2>
      <form @submit.prevent="submitPseudo">
        <input
          type="text"
          v-model="pseudo"
          placeholder="Ozheim"
          required
          class="pseudo-input"
        />
        <input
          type="submit"
          value="Se Connecter"
          class="pseudo-submit"
        />
      </form>
      <p v-if="responseMessage" class="response-message">
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
