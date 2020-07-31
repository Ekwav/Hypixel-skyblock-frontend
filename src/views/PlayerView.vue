<template>
  <div class="ion-page">
    <ion-content class="ion-padding">
      <Search />
      <PlayerDetails />
    </ion-content>
  </div>
</template>

<script>
import Search from "@/components/Search";
import PlayerDetails from "@/components/PlayerDetails";
export default {
  name: "home",
  components: {
    Search,
    PlayerDetails
  },
  data() {
    return {};
  },
  methods: {}
};
</script>
