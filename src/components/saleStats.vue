<template>
  <div class="sale-stats p-3 d-flex flex-column justify-content-center">
    <div id="chart"/>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import * as am4core from '@amcharts/amcharts4/core'
import * as am4charts from '@amcharts/amcharts4/charts'
import am4themesAnimated from '@amcharts/amcharts4/themes/animated'

am4core.useTheme(am4themesAnimated)

export default {
  name: 'saleStats',

  data () {
    return {
      chart: null
    }
  },

  computed: {
    ...mapState(['supply', 'bounties', 'maxSupply'])
  },

  watch: {
    supply () {
      this.updateData()
    },

    bounties () {
      this.updateData()
    }
  },

  mounted () {
    this.initChart()
  },

  beforeDestroy () {
    if (this.chart) {
      this.chart.dispose()
    }
  },

  methods: {
    initChart () {
      let chart = am4core.create('chart', am4charts.PieChart)
      this.chart = chart

      chart.innerRadius = am4core.percent(45)

      let pieSeries = chart.series.push(new am4charts.PieSeries())
      pieSeries.fontSize = '0.75rem'
      pieSeries.dataFields.value = 'tokens'
      pieSeries.dataFields.category = 'distribution'
      pieSeries.labels.template.fill = am4core.color('white')
      pieSeries.ticks.template.stroke = am4core.color('white')
      pieSeries.tooltip.getFillFromObject = false
      pieSeries.tooltip.background.fill = am4core.color('#343a40')
      pieSeries.slices.template.tooltipText = '{value.value}'

      let label = chart.chartContainer.createChild(am4core.Label)
      label.text = 'Sale Stats'
      label.fill = am4core.color('white')
      label.align = 'center'
      label.isMeasured = false
      label.x = am4core.percent(50)
      label.horizontalCenter = 'middle'
      label.y = am4core.percent(45)

      this.updateData()
    },

    updateData () {
      this.chart.data = [{
        'distribution': 'Sold',
        'tokens': this.supply - this.bounties
      }, {
        'distribution': 'Bounty',
        'tokens': this.bounties
      }, {
        'distribution': 'Available',
        'tokens': this.maxSupply - this.supply
      }]
    }
  }
}
</script>

<style scoped lang='scss'>
  @import '~bootstrap/scss/bootstrap.scss';

  #chart {
    width: 100%;
    height: 200px;
  }
</style>
