import { createRouter, createWebHistory } from 'vue-router';
import { checkMe } from '@/functions/check-me';
import LoginView from '@/views/LoginView.vue';
import LogoutView from '@/views/LogoutView.vue';
import CreateAccountView from '@/views/CreateAccountView.vue';
import PasswordView from '@/views/PasswordView.vue';
import PasswordGeneratorView from '@/views/PasswordGeneratorView.vue';
import PasswordManageView from '@/views/PasswordManageView.vue';

const routes = [
  { path: '/login', component: LoginView },
  { path: '/logout', component: LogoutView },
  { path: '/create', component: CreateAccountView },
  { path: '/password', component: PasswordView},
  { path: '/password-generator', component: PasswordGeneratorView },
  { path: '/password-management', component: PasswordManageView }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  console.log('route guard triggered');
  
  const isAuthenticated = await checkMe();
  console.log('isAuthenticated:', isAuthenticated);

  // // Log the current route (where they are coming from)
  // console.log('User is coming from:', from.fullPath); // or from.path, from.name

  // // Log the destination route
  // console.log('User is navigating to:', to.fullPath); // or to.path, to.name

  // Access the 'authenticated' property
  const authState = isAuthenticated.authenticated;

  // Store the true/false value in Chrome storage
  chrome.storage.sync.set({ 'state': authState }, function() {
    console.log('Value is set to:', authState);
  });

  next();
});

export default router;

