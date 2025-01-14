<template>
    <div>
        <h1>Bienvenue sur RelayChat+</h1>

        <div>
            <h2>Choisissez un pseudo :</h2>
            <form @submit.prevent="submitPseudo">
                <input type="text" v-model="pseudo" placeholder="Ozheim" required>
                <input type="submit" value="Se Connecter">
            </form>

            <p v-if="responseMessage">{{ responseMessage }}</p>
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
                this.$router.push({ path: '/home'});
                localStorage.setItem('pseudo', this.pseudo);


            } catch (error) {
                console.error('Erreur lors de l\'enregistrement :', error);
                this.responseMessage = 'Erreur lors de l\'enregistrement.';
            }
        },
    },
};
</script>

<style>

</style>
