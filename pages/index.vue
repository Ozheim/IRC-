<template>
    <div class="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div
            class="w-full max-w-md p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 transform transition hover:scale-105 hover:shadow-lg">
            <h1 class="text-4xl font-extrabold text-center text-white mb-8">
                Bienvenue sur <span class="text-orange-400">RelayChat+</span>
            </h1>

            <div>
                <h2 class="text-lg font-medium mb-4 text-gray-300">Choisissez un pseudo :</h2>
                <form @submit.prevent="submitPseudo" class="space-y-6">
                    <input type="text" v-model="pseudo" placeholder="Ozheim" required
                        class="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-orange-500">
                    <input type="submit" value="Envoyer"
                        class="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 cursor-pointer">
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
            } catch (error) {
                console.error("Erreur lors de l'enregistrement :", error);
                this.responseMessage = "Erreur lors de l'enregistrement.";
            }
        },
    },
};
</script>
