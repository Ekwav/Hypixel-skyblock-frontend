<template>
  <div>
    <ion-segment @ionChange="segmentButtonChanged($event)">
      <ion-segment-button value="auctions" checked>
        <ion-label>Auctions</ion-label>
      </ion-segment-button>
      <ion-segment-button value="bids">
        <ion-label>Bids</ion-label>
      </ion-segment-button>
    </ion-segment>

    <ion-list v-if="selectedSegmentButton == 'auctions'" class="fixedScrollBox">
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

    <ion-list v-if="selectedSegmentButton == 'bids'" class="fixedScrollBox">
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
      selectedSegmentButton: "auctions"
    };
  },
  mounted() {
    bus.$on("search-changed", oToSearch => {
      this.player = oToSearch;
      this.getNewPlayerAuctions(oToSearch);
    });
  },
  methods: {
    getNewPlayerAuctions(oToSearch) {
      if (oToSearch.type !== "player") {
        return;
      }
      let oRequestBody = JSON.stringify({
        uuid: oToSearch.data.uuid,
        amount: 5,
        offset: this.auctions.length
      });
      let This = this;
      this.$ws.send(
        new WebSocketRequest("playerAuctions", oRequestBody, resp => {
          let newAuctions = JSON.parse(resp.data);
          if (newAuctions.length === 0) {
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
          This.auctions.push(newAuctions);
        })
      );
    },
    getNewPlayerBids(oToSearch) {
      if (oToSearch.type !== "player") {
        return;
      }
      let oRequestBody = JSON.stringify({
        uuid: oToSearch.data.uuid,
        amount: 5,
        offset: this.bids.length
      });
      let This = this;
      this.$ws.send(
        new WebSocketRequest("playerBids", oRequestBody, resp => {
          let newBids = JSON.parse(resp.data);
          if (newBids.length === 0) {
            return;
          }
          This.bids.push(newBids);
        })
      );
    },
    segmentButtonChanged(event) {
      this.selectedSegmentButton = event.detail.value;
    },
    formatNumber(number) {
      return numberFormat(number, 0);
    }
  }
};
</script>

<style>
.fixedScrollBox {
  height: 70vh;
  overflow-y: scroll;
}
.auctionAndBidItemHeader {
  min-height: 35px;
}
ion-card {
  color: black;
  border: 1px solid grey;
}
</style>
