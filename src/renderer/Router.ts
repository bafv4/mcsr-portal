import { createRouter, createWebHashHistory } from "vue-router";

// pages
import Home from "./vue/pages/Home.vue";
import Dest from "./vue/pages/steps/Dest.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/dest/",
    name: "Dest",
    component: Dest,
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes
});