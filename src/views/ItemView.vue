<template>
  <div class="ion-page">
    <ion-content class="ion-padding">
      <Search />
      <ItemDetails />
    </ion-content>
  </div>
</template>

<script>
import Search from "@/components/Search";
import ItemDetails from "@/components/ItemDetails";
export default {
  name: "home",
  components: {
    Search,
    ItemDetails
  },
  data() {
    return {};
  },
  methods: {}
};
</script>
