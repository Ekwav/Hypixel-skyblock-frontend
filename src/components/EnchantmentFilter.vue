<template>
  <div>
    <ion-item class="enchantmentFilter">
      <ion-select
        ok-text="Select"
        cancel-text="Abort"
        placeholder="Choose enchantment"
        class="enchantmentFilterSelect"
        @ionChange="onFilterChange($event)"
      >
        <ion-select-option
          v-for="enchantment in enchantments"
          v-bind:value="enchantment.id"
          v-bind:key="enchantment.id"
        >{{ enchantment.name }}</ion-select-option>
      </ion-select>
      <ion-select
        ok-text="Select"
        cancel-text="Abort"
        placeholder="Choose level"
        class="enchantmentFilterSelect"
        @ionChange="onLevelChange($event)"
      >
        <ion-select-option
          v-for="level in [1,2,3,4,5,6]"
          v-bind:key="level"
          v-bind:value="level"
        >{{ level }}</ion-select-option>
      </ion-select>
    </ion-item>
  </div>
</template>

<script>
import { WebSocketRequest } from "../utils/websocket";
export default {
  name: "EnchantmentFilter",
  props: {
    filter: Object
  },
  data() {
    return {
      enchantments: []
    };
  },
  mounted() {
    this.loadEnchantments();
  },
  methods: {
    loadEnchantments() {
      let This = this;
      This.$ws.send(
        new WebSocketRequest("getAllEnchantments", "", resp => {
          This.enchantments = This.convertEnchantmentsIntoObjects(
            JSON.parse(resp.data)
          );
          This.formatEnchantments();
        })
      );
    },
    onFilterChange($event) {
      this.filter.enchantmentID = parseInt($event.target.value);
      this.checkForNewValidFilterEventFire();
    },
    onLevelChange($event) {
      this.filter.level = parseInt($event.target.value);
      this.checkForNewValidFilterEventFire();
    },
    formatEnchantments() {
      for (let i = 0; i < this.enchantments.length; i++) {
        var enchantment = this.enchantments[i];
        enchantment.name = enchantment.name.replace("_", " ");
        enchantment.name = this.capitalizeWords(enchantment.name);
      }
    },
    capitalizeWords(text) {
      return text.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    },
    convertEnchantmentsIntoObjects(enchantments) {
      var enchantmentsAsObjects = [];
      enchantments.forEach((enchantment, i) => {
        let enchantmentObject = {
          id: i,
          name: enchantment
        };
        enchantmentsAsObjects.push(enchantmentObject);
      });
      return enchantmentsAsObjects;
    },
    /**
     * Feuert das Event NewValidFilter, wenn ein Filter geändert wurde,
     * und jetzt beide Filter gefüllt sind.
     */
    checkForNewValidFilterEventFire() {
      if (this.filter && this.filter.enchantmentID && this.filter.level) {
        this.$emit("onNewValidFilter", null);
      }
    }
  }
};
</script>

<style>
</style>