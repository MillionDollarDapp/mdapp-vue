<template>
  <div class="route-mdapp">
    <!--Show admin panel for contract owner and withdrawal account-->
    <div v-if="this.owner !== null && this.wallet !== null && (this.web3.coinbase === this.owner || this.web3.coinbase === this.wallet)"><admin-panel/></div>

    <div v-if="showPresale"><sale-countdown title="Presale" v-bind:start="startTimePresale" v-bind:end="endTimePresale" v-on:is-finished="hidePresale" v-on:has-started="preSaleActive = true"/></div>
    <div v-if="showSale"><sale-countdown title="Sale" v-bind:start="startTimeSale" v-bind:end="0" v-on:has-started="saleStarted"/></div>

    <div :class="showNSFW ? 'show-nsfw' : 'hide-nsfw'">
      <pixels :buyPossible="buyPossible" :highlightClaimed="highlightClaimed" v-on:showTxLog="$emit('showTxLog')"/>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Pixels from '@/components/pixels'
import SaleCountdown from '@/components/saleCountdown'
import AdminPanel from '@/components/adminPanel'

export default {
  name: 'mdapp',
  components: {
    AdminPanel,
    Pixels,
    SaleCountdown
  },

  props: {
    highlightClaimed: Boolean,
    showNSFW: Boolean
  },

  data () {
    return {
      showPresale: false,
      showSale: false,
      startTimePresale: 0,
      endTimePresale: 0,
      startTimeSale: 0,
      saleEnded: false,
      preSaleActive: false,
      saleActive: false,
      claimStartPresale: 0,
      claimStartAll: 0
    }
  },

  computed: {
    ...mapState(['owner', 'wallet', 'web3']),
    buyPossible () {
      return (!this.$store.state.soldOut && (this.preSaleActive || this.saleActive))
    }
  },

  watch: {
    buyPossible (val) {
      this.$emit('changeBuyPossible', val)
    }
  },

  mounted () {
    this.proceedSaleDates()
  },

  methods: {
    proceedSaleDates () {
      if (this.$store.state.startTimeSale === 0) {
        setTimeout(() => {
          this.proceedSaleDates()
        }, 100)
        return
      }

      this.startTimePresale = this.$store.state.startTimePresale
      this.endTimePresale = this.$store.state.endTimePresale
      this.startTimeSale = this.$store.state.startTimeSale

      // Show the presale countdown component?
      if (this.startTimePresale > Date.now()) {
        this.preSaleActive = false
        this.showPresale = true
      } else if (this.endTimePresale > Date.now()) {
        this.preSaleActive = true
        this.showPresale = true
      } else {
        this.preSaleActive = false
        this.showPresale = false
      }

      // Show the sale countdown component?
      if (!this.showPresale) {
        if (this.startTimeSale > Date.now()) {
          this.saleActive = false
          this.showSale = true
        } else {
          this.saleActive = true
          this.showSale = false
        }
      }
    },

    hidePresale () {
      this.showPresale = false
      this.showSale = true
      this.preSaleActive = false
    },

    saleStarted () {
      this.showSale = false
      this.saleActive = true
    }
  }
}
</script>

<style scoped>
</style>
