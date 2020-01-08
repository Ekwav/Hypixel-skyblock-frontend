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
              placeholder="search item or player"
              ref="searchbar"
              :value="searchInput"
              debounce="100"
              style="width: 95vw !important"
              @ionChange="search($event)"
            >
            </ion-searchbar>
          </ion-row>
          <ion-list v-if="suggestions.length > 0">
            <ion-row v-for="item in suggestions" v-bind:key="item.data.name">
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
              <ion-item button="true" @click="item_or_player_selected($event, item)">
                {{
                item.data.name
                }}
              </ion-item>
            </ion-row>
          </ion-list>
        </ion-grid>
      </ion-toolbar>
    </form>
  </ion-item>
</template>

<script>
import { WebSocketRequest } from "@/utils/websocket";
import { bus } from "../main";
import storedItems from "../utils/items.json";
export default {
  name: "Search",
  data() {
    return {
      searchInput: "",
      items: storedItems,
      suggestions: []
    };
  },
  mounted() {
    // setFocus only works after some delay
    // loading default item also only works correctly if delayed
    // no better way found
    setTimeout(() => {
      this.$refs.searchbar.setFocus();
    }, 500);

    // delay of 0ms because then function is called after
    // rendering is finished
    // no better way found
    setTimeout(() => {
      bus.$emit("search-changed", {
        type: "item",
        data: { name: "Diamond" }
      });
    }, 0);
  },
  methods: {
    search(e) {
      let sToSearch = e.target.value;
      if (sToSearch) {
        sToSearch = sToSearch.toLowerCase();
        var aMatches = this.items.filter(item =>
          item.toLowerCase().startsWith(sToSearch)
        );
        aMatches = aMatches.map(item => {
          return { type: "item", data: { name: item } };
        });
        if (aMatches.length > 5) {
          aMatches = aMatches.slice(0, 5);
          this.suggestions = aMatches;
          this.loadImagesForSuggestions();
        } else if (aMatches.length < 5) {
          this.search_players(sToSearch, aPlayerNames => {
            if (aMatches.length + aPlayerNames.length > 5) {
              aPlayerNames = aPlayerNames.slice(0, 5 - aMatches.length);
            }
            this.suggestions = aMatches.concat(aPlayerNames);
            this.loadImagesForSuggestions();
          });
        }
      } else {
        this.suggestions = [];
      }
    },
    search_players(sSearch, callback) {
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
            console.log(err);
          }
        )
      );
    },
    item_or_player_selected(e, oSelected) {
      if (!oSelected) {
        return;
      }
      this.clearSearchFields();
      bus.$emit("search-changed", oSelected);
    },
    onSubmit(e) {
      e.preventDefault();
      if (this.suggestions[0]) {
        this.item_or_player_selected(null, this.suggestions[0]);
      }
    },
    clearSearchFields() {
      this.searchInput = null;
      this.suggestions = [];
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
                            suggestion.data.name === data.Name
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
