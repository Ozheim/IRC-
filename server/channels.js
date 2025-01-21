export const channels = {};

export const createChannel = (channelName) => {
  if (!channels[channelName]) {
    channels[channelName] = [];
  }
};

export const deleteChannel = (channelName) => {
  delete channels[channelName];
};

export const addMessage = (channelName, message) => {
  if (channels[channelName]) {
    channels[channelName].push(message);
  }
};
