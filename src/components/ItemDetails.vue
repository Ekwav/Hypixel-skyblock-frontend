<template>
  <div>
    <FetchspanButtons></FetchspanButtons>
    <div style='height: 60vh'>
      <canvas id='priceChart'></canvas>
    </div>
    <ion-item>
      <ion-label>Average Price</ion-label>
      <ion-badge slot='end' color='light'>{{average_price}}</ion-badge>
    </ion-item>
  </div>
</template>

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
      priceChart: undefined,
      enchantmentFilter: undefined
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
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                callback: function(value, index, values) {
                  return numberFormat(value, 0);
                }
              }
            }
          ],
          xAxes: [
            {
              type: "time"
            }
          ]
        }
      }
    });
    bus.$on("fetchspan-changed", newFetchspan => {
      this.fetchspan = newFetchspan;
      if (this.item) {
        this.getChartData(this.item);
      }
    });
    bus.$on("initialize-fetchspan", newFetchspan => {
      this.fetchspan = newFetchspan;
      this.updateToRouteParams();
      this.getChartData(this.item);
    });
  },
  watch: {
    $route: function(to, from) {
      this.updateToRouteParams();
      this.getChartData();
    }
  },
  methods: {
    getChartData() {
      let sRequestType = "itemPrices";
      let oRequestBody = {
        name: this.item.name,
        start: Math.round(this.fetchspan / 1000)
      };
      if (
        this.enchantmentFilter &&
        this.enchantmentFilter.enchantmentID !== undefined &&
        this.enchantmentFilter.level !== undefined
      ) {
        oRequestBody.enchantments = [
          [this.enchantmentFilter.enchantmentID, this.enchantmentFilter.level]
        ];
      }
      this.$ws.send(
        new WebSocketRequest(
          sRequestType,
          JSON.stringify(oRequestBody),
          resp => {
            if (resp.type == "itemResponse") {
              let data = JSON.parse(resp.data);
              data.map(item => new Date(item.end));
              data = data.sort((a, b) => {
                return a.end > b.end ? 1 : -1;
              });
              let nPriceSum = 0;
              this.priceChart.options.title.text =
                "Price for 1 " + this.item.name;
              this.priceChart.data.labels = data.map(item => item.end);
              this.priceChart.data.datasets[0].data = data.map(item => {
                nPriceSum += item.price;
                return item.price;
              });
              this.priceChart.update();
              this.average_price = numberFormat(
                Math.round((nPriceSum / data.length) * 100.0) / 100.0,
                0
              );
            }
          },
          err => {
          }
        )
      );
    },
    createChart(chartId, chartData) {
      const ctx = document.getElementById(chartId);
      return new Chart(ctx, {
        type: chartData.type,
        data: chartData.data,
        options: chartData.options
      });
    },
    updateToRouteParams() {
      this.item.name = this.$route.params.name;
      this.enchantmentFilter = this.$route.query.enchantmentFilter
        ? JSON.parse(this.$route.query.enchantmentFilter)
        : undefined;
    }
  }
};
</script>

<style>
/* style */
</style>