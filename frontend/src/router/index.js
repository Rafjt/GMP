import { createRouter, createWebHistory } from 'vue-router';
import { checkMe } from '@/functions/check-me';
import LoginView from '@/views/LoginView.vue';
import LogoutView from '@/views/LogoutView.vue';
import CreateAccountView from '@/views/CreateAccountView.vue';
import PasswordView from '@/views/PasswordView.vue';
import PasswordGeneratorView from '@/views/PasswordGeneratorView.vue';
import PasswordManageView from '@/views/PasswordManageView.vue';
import SettingView from '@/views/SettingView.vue'
import { refreshAuth } from '@/composables/useAuth';

const routes = [
  { path: '/login', component: LoginView },
  { path: '/logout', component: LogoutView },
  { path: '/create', component: CreateAccountView },
  { path: '/password', component: PasswordView, meta: { requiresAuth: true } },
  { path: '/password-generator', component: PasswordGeneratorView, meta: { requiresAuth: true } },
  { path: '/password-management', component: PasswordManageView, meta: { requiresAuth: true } },
  { path: '/setting', component: SettingView, meta: {requiresAuth: true}},
  { path: '/', redirect: '/login' }, // Redirection par défaut
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  console.log('route guard triggered');

  await refreshAuth(); // met à jour isAuthenticated et chrome.storage.sync
  next();
});


export default router;
