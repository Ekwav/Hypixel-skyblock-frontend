<template>
  <ion-item>
    <form @submit="onSubmit($event)">
      <ion-toolbar>
        <ion-grid>
          <ion-row>
            <!-- 
                debounce: time before ionChange is fired
            -->
            <ion-searchbar
              placeholder="Search item or player"
              ref="searchbar"
              :value="searchInput"
              debounce="100"
              style="width: 100vw !important"
              @ionChange="onSearch($event)"
            ></ion-searchbar>
          </ion-row>
          <ion-list v-if="suggestions.length > 0">
            <ion-row
              v-for="item in suggestions"
              v-bind:key="item.data.name"
              @click="itemOrPlayerSelected($event, item, false)"
            >
              <ion-thumbnail v-if="item.type == 'player'" style="--size: 35px">
                <ion-img :src="'https://crafatar.com/avatars/' + item.data.uuid"></ion-img>
              </ion-thumbnail>
              <ion-thumbnail
                v-if="item.type == 'item'"
                style="--size: 35px"
                :key="item.data.imgsrc"
              >
                <ion-img :src="item.data.imgsrc"></ion-img>
              </ion-thumbnail>
              <ion-item button="true" class="searchItem">{{item.data.name}}</ion-item>
            </ion-row>
          </ion-list>
        </ion-grid>
      </ion-toolbar>
      <EnchantmentFilter
        v-if="showEnchantmentFilter"
        @onNewValidFilter="onNewValidFilter()"
      />
    </form>
  </ion-item>
</template>

<script>
import { WebSocketRequest } from "@/utils/websocket";
import { bus } from "../main";
import storedItems from "../utils/items.json";
import EnchantmentFilter from "./EnchantmentFilter";
export default {
  name: "Search",
  components: {
    EnchantmentFilter
  },
  props: {
    showEnchantmentFilter: Boolean
  },
  data() {
    return {
      searchInput: "",
      items: storedItems,
      suggestions: [],
      enchantmentFilter: {},
      oSelected: {}
    };
  },
  mounted() {
    var searchTerm = "";
    if (this.$route.name === "itemDetails") {
      searchTerm = this.$route.params.name;
    }
    if (this.$route.name === "playerDetails") {
      searchTerm = this.$route.params.name;
    }
    this.searchInput = searchTerm;
    this.search(searchTerm).then(() => {
      this.oSelected = this.suggestions[0];
    });
  },
  methods: {
    onSearch(e) {
      this.search(e.target.value);
    },
    search(sToSearch) {
      let This = this;
      return new Promise(function(resolve, reject) {
        if (sToSearch) {
          sToSearch = sToSearch.toLowerCase();
          var aMatches = This.items.filter(item =>
            item.toLowerCase().startsWith(sToSearch)
          );
          aMatches = aMatches.map(item => {
            return { type: "item", data: { name: item } };
          });
          if (aMatches.length > 5) {
            aMatches = aMatches.slice(0, 5);
            This.suggestions = aMatches;
            This.loadImagesForSuggestions();
          } else if (aMatches.length < 5) {
            This.searchPlayer(sToSearch, aPlayerNames => {
              if (aMatches.length + aPlayerNames.length > 5) {
                aPlayerNames = aPlayerNames.slice(0, 5 - aMatches.length);
              }
              This.suggestions = aMatches.concat(aPlayerNames);
              This.loadImagesForSuggestions();
            });
          }
        } else {
          This.suggestions = [];
        }
      });
    },
    searchPlayer(sSearch, callback) {
      if (sSearch.length < 3) {
        callback([]);
      }
      this.$ws.send(
        new WebSocketRequest(
          "search",
          sSearch,
          resp => {
            if (resp.type == "searchResponse") {
              callback(
                JSON.parse(resp.data).map(sPlayer => {
                  // sPlayer[0] => name
                  // sPlayer[1] => uuid
                  return {
                    type: "player",
                    data: { name: sPlayer[0], uuid: sPlayer[1] }
                  };
                })
              );
            }
          },
          err => {
            //console.log(err);
          }
        )
      );
    },
    itemOrPlayerSelected(e, oSelected, hasQueryChanged) {
      if (!oSelected.data) {
        return;
      }
      this.oSelected = oSelected;
      switch (oSelected.type) {
        case "player":
          if (this.$route.params.uuid !== oSelected.data.uuid) {
            this.$router.push(
              "/player/" + oSelected.data.name + "/" + oSelected.data.uuid
            );
          }
          break;
        case "item":
          if (oSelected.data.name != this.$route.params.name || hasQueryChanged)
            this.$router.push({
              path: "/item/" + oSelected.data.name,
              query: {
                enchantmentFilter: JSON.stringify(this.enchantmentFilter)
              }
            });
          break;
        default:
        // TODO: Error-Handling
      }
    },
    onNewValidFilter() {
      if (this.oSelected) {
        this.itemOrPlayerSelected(null, this.oSelected, true);
      }
    },
    onSubmit(e) {
      e.preventDefault();
      if (this.suggestions[0]) {
        this.itemOrPlayerSelected(null, this.suggestions[0], false);
      }
    },
    clearSearchFields() {
      this.suggestions = [];
      this.searchInput = null;
    },
    loadImagesForSuggestions() {
      let aPromises = [];
      for (let i = 0; i < this.suggestions.length; i++) {
        const suggestion = this.suggestions[i];
        if (suggestion.type === "item") {
          if (!suggestion.data.srcimg) {
            aPromises.push(
              new Promise((resolve, reject) => {
                this.$ws.send(
                  new WebSocketRequest(
                    "itemDetails",
                    JSON.stringify(suggestion.data.name),
                    resp => {
                      if (resp.type == "itemDetailsResponse") {
                        let data = JSON.parse(resp.data);
                        let index = this.suggestions.findIndex(suggestion => {
                          return (
                            suggestion.type == "item" &&
                            data.AltNames.includes(suggestion.data.name)
                          );
                        });
                        if (index != -1) {
                          // this.suggestions[index].data.name is the binded key to the list
                          // -> to update the entry it has to change for the image to be updated
                          this.suggestions[index].data.imgsrc = data.IconUrl;
                        }
                      }
                      resolve();
                    },
                    err => {
                      reject(err);
                    }
                  )
                );
              })
            );
          }
        }
      }
      Promise.all(aPromises).then(() => {
        for (let i = 0; i < this.suggestions.length; i++) {
          const suggestion = this.suggestions[i];
          let temp = suggestion.data.name;
          suggestion.data.name = "";
          suggestion.data.name = temp;
        }
      });
    }
  }
};
</script>

<style scoped>
.searchItem {
  width: 70%;
}
@media (min-width: 900px) {
  .searchItem {
    width: 95%;
  }
}
</style>
