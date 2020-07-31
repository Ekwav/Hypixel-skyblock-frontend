<template>
  <div>
    <ion-item class='enchantmentFilter'>
      <ion-select ok-text='Select' cancel-text='Abort' placeholder='Choose enchantment' class='enchantmentFilterSelect' v-bind:value='selectedEnchantmentID' @ionChange='onFilterChange($event)'>
        <ion-select-option v-for='enchantment in enchantments' v-bind:value='enchantment.id' v-bind:key='enchantment.id'>{{ enchantment.name }}</ion-select-option>
      </ion-select>
      <ion-select ok-text='Select' cancel-text='Abort' placeholder='Choose level' class='enchantmentFilterSelect' v-bind:value='selectedLevel' @ionChange='onLevelChange($event)'>
        <ion-select-option v-for='level in [1, 2, 3, 4, 5, 6]' v-bind:key='level' v-bind:value='level'>{{ level }}</ion-select-option>
      </ion-select>
    </ion-item>
  </div>
</template>

<script>
import { WebSocketRequest } from "../utils/websocket";
export default {
  name: "EnchantmentFilter",
  data() {
    return {
      enchantments: [],
      selectedLevel: 0,
      selectedEnchantmentID: 0
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
          This.preSelectFromRoute();
        })
      );
    },
    onFilterChange($event) {
      var newEnchantment = parseInt($event.target.value);
      var oldEnchantment = this.getFilterFromURLQuery().enchantmentID;
      if (newEnchantment === oldEnchantment) {
        return;
      }
      this.$router.push({
        path: "/item/" + this.$route.params.name,
        query: {
          enchantmentFilter: JSON.stringify({
            enchantmentID: newEnchantment,
            level: this.selectedLevel
          })
        }
      });
      this.checkForNewValidFilterEventFire();
    },
    onLevelChange($event) {
      var newLevel = parseInt($event.target.value);
      var oldLevel = this.getFilterFromURLQuery().level;
      if (newLevel === oldLevel) {
        return;
      }
      this.$router.push({
        path: "/item/" + this.$route.params.name,
        query: {
          enchantmentFilter: JSON.stringify({
            enchantmentID: this.selectedEnchantmentID,
            level: newLevel
          })
        }
      });
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
      if (this.selectedLevel && this.selectedEnchantmentID) {
        this.$emit("onNewValidFilter", null);
      }
    },
    preSelectFromRoute() {
      var filter = this.$route.query.enchantmentFilter;
      if (filter) {
        filter = JSON.parse(filter);
        this.selectedLevel = filter.level;
        this.selectedEnchantmentID = filter.enchantmentID;
      }
    },
    /**
     * Gibt den Filter, welcher in der URL übergeben wird, als JSON-Objekt zurück.
     * Fall kein Filter vorhanden ist, wird ein leeren Objekt zurückgegeben
     */
    getFilterFromURLQuery() {
      var filter = this.$route.query.enchantmentFilter;
      return filter ? JSON.parse(this.$route.query.enchantmentFilter) : {};
    }
  }
};
</script>

<style></style>
