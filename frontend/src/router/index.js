import { createRouter, createWebHistory } from 'vue-router';
import { checkMe } from '@/functions/check-me';
import LoginView from '@/views/LoginView.vue';
import WelcomeView from '@/views/WelcomeView.vue';
import CreateAccountView from '@/views/CreateAccountView.vue';
import PasswordView from '@/views/PasswordView.vue';

const routes = [
  { path: '/login', component: LoginView },
  { path: '/welcome', component: WelcomeView },
  { path: '/create', component: CreateAccountView },
  { path: '/password', component: PasswordView}
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  console.log('route guard triggered');
  
  const isAuthenticated = await checkMe();
  console.log('isAuthenticated:', isAuthenticated);

  // Access the 'authenticated' property
  const authState = isAuthenticated.authenticated;

  // Store the true/false value in Chrome storage
  chrome.storage.sync.set({ 'state': authState }, function() {
    console.log('Value is set to:', authState);
  });

  next();
});

export default router;

