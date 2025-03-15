import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import WelcomeView from '@/views/WelcomeView.vue';
import CreateAccountView from '@/views/CreateAccountView.vue';

const routes = [
  { path: '/', component: LoginView },
  { path: '/welcome', component: WelcomeView },
  { path: '/create', component: CreateAccountView }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;

