<template>
  <div>
    <FetchspanButtons></FetchspanButtons>
    <div style="height: 60vh">
      <canvas id="priceChart"></canvas>
    </div>
    <ion-item class="ionitem">
      <ion-label>Average Price</ion-label>
      <ion-badge slot="end" color="light">{{average_price}}</ion-badge>
    </ion-item>
    <ion-item class="ionitem">
      <ion-label>Average Price (no outliers)</ion-label>
      <ion-badge slot="end" color="light">{{average_no_outliers}}</ion-badge>
    </ion-item>
    <ion-item class="ionitem">
      <ion-label>Growth Trend</ion-label>
      <ion-badge slot="end" style="backgroundColor: white" v-bind:style="growthTrend > 0 ? {color: 'green'} : {color: 'red'}">{{growthTrend}}%</ion-badge>
    </ion-item>
  </div>
</template>

<style>
  @media only screen and (max-width: 899px) {
    .ionitem {
      width: 100%;
    }
  }
  @media only screen and (min-width: 900px) {
    .ionitem {
      width: 50%;
      display: inline-block;
    }
  }
</style>

<script>
import { WebSocketRequest } from "@/utils/websocket";
import { bus } from "../main";
import { numberFormat } from "highcharts";
import FetchspanButtons from "./FetchspanButtons";
import Chart from "chart.js";
export default {
  name: "ItemPriceGraph",
  components: {
    FetchspanButtons
  },
  data() {
    return {
      fetchspan: undefined,
      item: {},
      average_price: 0,
      average_price_blank: 0,
      average_no_outliers: 0,
      growthTrend: 0,
      cached_data: [],
      priceChart: undefined
    };
  },
  mounted() {
    this.priceChart = this.createChart("priceChart", {
      type: "line",
      data: {
        datasets: [
          {
            label: "price",
            borderColor: "#22A7F0",
            fill: false
          }
        ]
      },
      options: {
        maintainAspectRatio: false,
        title: {
          display: true,
          text: "Item price"
        },
        tooltips: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: function(tooltipItem, data) {
              return numberFormat(tooltipItem.value, 0);
            },
            title: function(tooltipItem, data) {
              let d = new Date(tooltipItem[0].label);
              return d.toLocaleTimeString() + ", " + d.toLocaleDateString();
            }
          }
        },
        elements: {
          point: {
            radius: 0
          }
        },
        scales:{
          yAxes:[{
            ticks:{
              beginAtZero: true,
              callback: function(value,index,values){
                return numberFormat(value,0);
              }
            }
          }],
          xAxes:[{
            type: 'time'
          }]
        }
      }
    });
    bus.$on("search-changed", oToSearch => {
      this.item = oToSearch;
      this.getChartData(oToSearch);
    });
    bus.$on("fetchspan-changed", newFetchspan => {
      this.fetchspan = newFetchspan;
      if (this.item) {
        this.getChartData(this.item);
      }
    });
    bus.$on("initialize-fetchspan", newFetchspan => {
      this.fetchspan = newFetchspan;
    });
  },
  methods: {
    getChartData(oToSearch) {
      let sRequestType = "";
      let oRequestBody = {};
      if (oToSearch.type !== "item") {
        return;
      }
      sRequestType = "itemPrices";
      oRequestBody.name = oToSearch.data.name;
      oRequestBody.start = Math.round(this.fetchspan / 1000);
      oRequestBody = JSON.stringify(oRequestBody);
      this.$ws.send(
        new WebSocketRequest(
          sRequestType,
          oRequestBody,
          resp => {
            if (resp.type == "itemResponse") {
              let data = JSON.parse(resp.data);
              data.map(item => new Date(item.end));
              data = data.sort((a, b) => {
                return a.end > b.end ? 1 : -1;
              });
              console.log("Data: ");
              console.log(data);
              this.cached_data = data;
              let nPriceSum = 0;
              this.priceChart.options.title.text = "Price for 1 " + oToSearch.data.name;
              this.priceChart.data.labels = data.map(item => item.end);
              this.priceChart.data.datasets[0].data = data.map(item => {
                nPriceSum += item.price;
                return item.price;
              });
              this.priceChart.update();
              this.average_price_blank = Math.round(nPriceSum / data.length);
              this.average_price = numberFormat(
                Math.round((nPriceSum / data.length) * 100.0) / 100.0,
                0
              );
              this.getPriceNoOutliers(oToSearch);
              this.growthTrend = this.getGrowthTrend(oToSearch);
            }
          },
          err => {
            console.log("err callback");
            console.log(err);
          }
        )
      );
    },
    getPriceNoOutliers(oToSearch) {
      let nPriceSum = 0;
      let nItems = 0;
      for (let item of this.cached_data) {
        if (item.price < this.average_price_blank * 2) {
          nPriceSum += item.price;
          nItems++;
        }
      }
      this.average_no_outliers = numberFormat(
        Math.round((nPriceSum / nItems) * 100.0) / 100.0,
        0
      );
    },
    getGrowthTrend(oToSearch) {
      let bsum = 0;
      for (let i = 0; i < 10; i++) {
        bsum += this.cached_data[i].price;
      }
      const bavg = bsum / 5; //only 5 cus we multiplying by 2
      let tsum = 0;
      let tc = 0;
      for (let i = 0; i < 10; i++) {
        if (this.cached_data[i].price < bavg && this.cached_data[i].price > (bavg / 8)) {
          tsum += this.cached_data[i].price;
          tc++;
        }
      }
      const tbavg = tsum / tc;
      let esum = 0;
      for (let i = this.cached_data.length - 1; i > this.cached_data.length - 11; i--) {
        esum += this.cached_data[i].price;
      }
      const eavg = esum / 5; //only 5 cus we multiplying by 2
      let tesum = 0;
      let tec = 0;
      for (let i = this.cached_data.length - 1; i > this.cached_data.length - 11; i--) {
        if (this.cached_data[i].price < eavg && this.cached_data[i].price > (eavg / 8)) {
          tesum += this.cached_data[i].price;
          tec++;
        }
      }
      const teavg = tesum / tec;
      const gt = (teavg - tbavg) / tbavg * 100;
      const displaygt = Number(gt.toString().slice(0, 4));
      return displaygt;
    },
    createChart(chartId, chartData) {
      const ctx = document.getElementById(chartId);
      return new Chart(ctx, {
        type: chartData.type,
        data: chartData.data,
        options: chartData.options
      });
    }
  }
};
</script>

<style>
/* style */
</style>