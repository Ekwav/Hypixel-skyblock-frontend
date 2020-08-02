<template>
  <div class="playerdetails">
    <ion-segment @ionChange="segmentButtonChanged($event)">
      <ion-segment-button value="auctions" checked>
        <ion-label>Auctions</ion-label>
      </ion-segment-button>
      <ion-segment-button value="bids">
        <ion-label>Bids</ion-label>
      </ion-segment-button>
    </ion-segment>

    <ion-list v-if="selectedSegmentButton == 'auctions'" id="auctionList">
      <ion-card v-for="auction in auctions" v-bind:key="auction.auctionId">
        <ion-grid>
          <ion-card-title class="auctionAndBidItemHeader">{{ auction.itemName }}</ion-card-title>
          <ion-row>
            <ion-col>
              <ion-label>Highest:</ion-label>
              {{ formatNumber(auction.highestBid) }}
            </ion-col>
          </ion-row>
        </ion-grid>
      </ion-card>
    </ion-list>
    <ion-infinite-scroll
      v-if="selectedSegmentButton == 'auctions'"
      @ionInfinite="getNewPlayerAuctions(player, 10, $event)"
    >
      <ion-infinite-scroll-content loading-spinner="bubbles" loading-text="Loading more data..."></ion-infinite-scroll-content>
    </ion-infinite-scroll>

    <ion-list v-if="selectedSegmentButton == 'bids'" id="bidList">
      <ion-card v-for="bid in bids" v-bind:key="bid.auctionId">
        <ion-grid>
          <ion-card-title class="auctionAndBidItemHeader">
            {{
            bid.itemName
            }}
          </ion-card-title>
          <ion-row>
            <ion-col>
              <ion-label>Own:</ion-label>
              {{ formatNumber(bid.highestOwn) }}
            </ion-col>
            <ion-col>
              <ion-label>Highest:</ion-label>
              {{ formatNumber(bid.highestBid) }}
            </ion-col>
          </ion-row>
        </ion-grid>
      </ion-card>
    </ion-list>
    <ion-infinite-scroll
      v-if="selectedSegmentButton == 'bids'"
      @ionInfinite="getNewPlayerBids(player, 10, $event)"
    >
      <ion-infinite-scroll-content loading-spinner="bubbles" loading-text="Loading more data..."></ion-infinite-scroll-content>
    </ion-infinite-scroll>
  </div>
</template>

<script>
import { WebSocketRequest } from "@/utils/websocket";
import { bus } from "../main";
import { numberFormat } from "highcharts";
export default {
  data() {
    return {
      auctions: [],
      bids: [],
      player: {},
      allBidsLoaded: false,
      allAuctionsLoaded: false,
      selectedSegmentButton: "auctions"
    };
  },
  mounted() {
    bus.$on("search-changed", this.searchChangedHandler);
  },
  methods: {
    searchChangedHandler(oToSearch) {
      this.player = oToSearch;
      this.bids = [];
      this.auctions = [];
      this.allBidsLoaded = false;
      this.allAuctionsLoaded = false;
      this.selectedSegmentButton = "auctions";
      this.loadInitialAuctions();
      this.loadInitalBids();
    },
    getNewPlayerAuctions(oToSearch, numberOfAuctions, $event, callback) {
      if (oToSearch.type !== "player") {
        return;
      }
      let oRequestBody = JSON.stringify({
        uuid: oToSearch.data.uuid,
        amount: numberOfAuctions,
        offset: this.auctions.length
      });
      let This = this;
      this.$ws.send(
        new WebSocketRequest("playerAuctions", oRequestBody, resp => {
          let newAuctions = JSON.parse(resp.data);
          if (newAuctions.length === 0) {
            This.allAuctionsLoaded = true;
            return;
          }
          newAuctions = newAuctions.map(auction => {
            if (auction.highestBid == 0) {
              auction.priceFormatted = "no bid";
            } else {
              auction.priceFormatted = numberFormat(auction.highestBid, 0);
            }
            return auction;
          });
          This.auctions = This.auctions.concat(newAuctions);
          if ($event) {
            $event.target.complete();
          }
          if (callback && typeof callback === "function") {
            callback();
          }
        })
      );
    },
    getNewPlayerBids(oToSearch, numberOfBids, $event, callback) {
      if (oToSearch.type !== "player") {
        return;
      }
      let oRequestBody = JSON.stringify({
        uuid: oToSearch.data.uuid,
        amount: numberOfBids,
        offset: this.bids.length
      });
      let This = this;
      this.$ws.send(
        new WebSocketRequest("playerBids", oRequestBody, resp => {
          let newBids = JSON.parse(resp.data);
          if (newBids.length === 0) {
            This.allBidsLoaded = true;
            return;
          }
          This.bids = This.bids.concat(newBids);
          if ($event) {
            $event.target.complete();
          }
          if (callback && typeof callback === "function") {
            callback();
          }
        })
      );
    },
    segmentButtonChanged(event) {
      this.selectedSegmentButton = event.detail.value;
    },
    formatNumber(number) {
      return numberFormat(number, 0);
    },
    loadInitialAuctions() {
      let This = this;
      This.getNewPlayerAuctions(This.player, 25, undefined, () => {
        if (This.auctions.length < 20 && !This.allAuctionsLoaded) {
          This.loadInitialAuctions();
        }
      });
    },
    loadInitalBids() {
      let This = this;
      This.getNewPlayerBids(This.player, 25, undefined, () => {
        if (This.bids.length < 20 && !This.allBidsLoaded) {
          This.loadInitalBids();
        }
      });
    }
  }
};
</script>

<style>
ion-card {
  color: black;
  border: 1px solid grey;
  min-height: 5vh;
}
</style>
