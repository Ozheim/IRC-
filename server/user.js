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
  const allUsers = Array.from(users.values());
  console.log("Liste des utilisateurs connectés :", allUsers);
  return allUsers;
};
