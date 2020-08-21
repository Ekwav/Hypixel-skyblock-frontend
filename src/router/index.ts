import Vue from "vue";
import { IonicVueRouter } from "@ionic/vue";
import Home from "../views/Home.vue";
import PlayerView from "../views/PlayerView.vue";
import ItemView from "../views/ItemView.vue";

Vue.use(IonicVueRouter);

const routes = [
  {
    path: "/",
    redirect: "/item/Aspect of the End"
  },
  {
    path: "/player/:name/:uuid",
    name: "playerDetails",
    component: PlayerView
  },
  {
    path: "/item/:name",
    name: "itemDetails",
    component: ItemView
  }
];

const router = new IonicVueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
