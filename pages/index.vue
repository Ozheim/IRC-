<template>
    <div class="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div
            class="w-full max-w-md p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 transform transition hover:scale-105 hover:shadow-lg">
            <h1 class="text-4xl font-extrabold text-center text-white mb-8">
                Bienvenue sur <span class="text-orange-400">RelayChat+</span>
            </h1>

        <div>
            <h2 class="">Choisissez un pseudo :</h2>
            <form @submit.prevent="submitPseudo">
                <input type="text" v-model="pseudo" placeholder="Ozheim" required class="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400">
                <input type="submit" value="Se Connecter" class="mt-4 w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600" >
            </form>
                <p v-if="responseMessage" class="mt-6 text-orange-400 font-medium text-center">
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
                this.$router.push({ path: '/home'});
                localStorage.setItem('pseudo', this.pseudo);


            } catch (error) {
                console.error("Erreur lors de l'enregistrement :", error);
                this.responseMessage = "Erreur lors de l'enregistrement.";
            }
        },
    },
};
</script>
