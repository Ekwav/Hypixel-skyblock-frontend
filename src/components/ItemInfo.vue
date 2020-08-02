<template>
  <div>
    <!-- Diagram -->
    <ItemPriceGraph v-show="search_type == 'item'"></ItemPriceGraph>
    <PlayerDetails v-show="search_type == 'player'"></PlayerDetails>
  </div>
</template>

<script>
import ItemPriceGraph from "./ItemPriceGraph.vue";
import PlayerDetails from "./PlayerDetails";
import { bus } from "../main";
import { numberFormat } from "highcharts";
export default {
  name: "item-info",
  components: {
    ItemPriceGraph,
    PlayerDetails
  },
  data() {
    return {
      search_type: undefined,
      fetchspan: undefined
    };
  },
  mounted() {
    bus.$on("search-changed", oToSearch => {
      this.search_type = oToSearch.type;
    });
  },
  methods: {}
};
</script>

<style scoped>
:root {
  --ion-grid-columns: 2;
}
</style>
