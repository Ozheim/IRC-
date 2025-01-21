import { reactive } from "vue";

export const useChannelStore = () => {
  const state = reactive({
    channels: [], // Liste des channels
    currentChannel: "Général",
    botMessages: [], // Messages générés par le bot
  });

  return {
    state,
    get channels() {
      return state.channels;
    },
    get currentChannel() {
      return state.currentChannel;
    },
    addBotMessage(message) {
      state.botMessages.push(message);
    },
    getCurrentChannelUsers() {
      const channel = state.channels.find(
        (channel) => channel.name === state.currentChannel
      );
      return channel ? channel.users || [] : [];
    },
    joinChannel(channelName) {
      state.currentChannel = channelName;
    },
    createChannel(channelName) {
      if (!state.channels.find((channel) => channel.name === channelName)) {
        state.channels.push({ name: channelName, users: [] });
      }
    },
    deleteChannel(channelName) {
      state.channels = state.channels.filter(
        (channel) => channel.name !== channelName
      );
    },
    leaveChannel(channelName) {
      state.currentChannel = "Général";
      state.channels = state.channels.map((channel) =>
        channel.name === channelName
          ? { ...channel, users: channel.users.filter((u) => u !== state.currentUser) }
          : channel
      );
    },
  };
};
