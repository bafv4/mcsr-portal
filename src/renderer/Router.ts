import { createRouter, createWebHashHistory } from "vue-router";

// pages
import Home from "./vue/pages/Home.vue";
import Setup from "./vue/pages/Setup.vue";
import SetupComplete from './vue/pages/SetupComplete.vue';
import Test from './vue/components/Test.vue';

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/setup/",
    name: "Setup",
    component: Setup,
  },
  {
    path: '/complete/',
    component: SetupComplete
  },
  {
    path: '/test/',
    name: 'Test',
    component: Test
  }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes
});