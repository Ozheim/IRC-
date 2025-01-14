import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app';

export default defineNuxtRouteMiddleware(() => {
  if (typeof window !== 'undefined') {
    const pseudo = localStorage.getItem('pseudo');
    if (!pseudo) {
      return navigateTo('/'); 
    }
  }
});
