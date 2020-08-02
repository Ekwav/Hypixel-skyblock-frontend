<template>
  <div class="ion-page">
    <ion-content class="ion-padding">
      <Search v-on:get-code="getCodeInfo" v-if="homeView" />
      <ItemInfo v-if="this.homeView" v-on:switch-view="swtichView" />
    </ion-content>
  </div>
</template>

<script>
import Search from "@/components/Search";
import ItemInfo from "@/components/ItemInfo";
export default {
  name: "home",
  components: {
    Search,
    ItemInfo
  },
  data() {
    return {
      info: "",
      homeView: true,
      headline: "Home"
    };
  },
  methods: {
    async getCodeInfo(code) {
      const res = await fetch(
        "https://api.zippopotam.us/us/" + code.toString()
      );
      if (res.status == 404) {
        this.$showAlert("Bad", "Very Bad", ["Ok"]);
      } else {
        this.info = await res.json();
      }
    },
    swtichView() {
      this.homeView = !this.homeView;
      if (this.headline === "Home") {
        this.headline = "Player";
      } else {
        this.headline = "Home";
      }
    }
  }
};
</script>
