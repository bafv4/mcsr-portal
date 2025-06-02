import { createRouter, createWebHashHistory } from "vue-router";

// pages
import Home from "./vue/pages/Home.vue";
import Setup from "./vue/pages/Setup.vue";

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
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes
});