const users = new Map();

export const addUser = (socketId, nickname) => {
  users.set(socketId, nickname);
};

export const removeUser = (socketId) => {
  users.delete(socketId);
};

export const getUser = (socketId) => {
  return users.get(socketId);
};

export const getAllUsers = () => {
  return Array.from(users.values());
};
