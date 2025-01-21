import { reactive } from "vue";

export const useUserStore = () => {
  const state = reactive({
    user: {
      username: "",
    },
  });

  return {
    state,
    get username() {
      return state.user.username;
    },
    updateNickname(newNickname) {
      return new Promise((resolve, reject) => {
        if (newNickname && newNickname !== state.user.username) {
          state.user.username = newNickname;
          resolve();
        } else {
          reject();
        }
      });
    },
    setUser(newUser) {
      state.user = newUser;
    },
  };
};
