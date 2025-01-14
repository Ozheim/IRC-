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
export default {
  data() {
    return {
      channels: [
        { id: 1, name: 'Général' },
        { id: 2, name: 'Privé' },
        { id: 3, name: 'Gras de nunu' }
      ],
      currentChannel: 'Général'
    };
  },
  methods: {
    selectChannel(channelName) {
      this.currentChannel = channelName;
    }
  }
};

definePageMeta({
  middleware: 'auth'
});
</script>



