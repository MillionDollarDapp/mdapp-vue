<template>
  <div id="app" class="d-flex flex-column align-items-stretch">
    <div class="navigation">
      <navbar :buyPossible="buyPossible" :showDropdownPing="showDropdownPing" v-on:highlight-claimed="blinkClaimed" v-on:toggleNSFW="toggleNSFW"/>
    </div>
    <div class="helper">
      <helper-list/>
    </div>
    <div id="content" class="flex-grow-1 flex-shrink-0 d-flex flex-column justify-content-center">
      <!--<div id="content" class="d-flex justify-content-center align-items-center">-->
      <router-view :highlightClaimed="highlightClaimed" :showNSFW="showNSFW"
                   v-on:changeBuyPossible="changeBuyPossible"
                   v-on:showTxLog="showDropdownPing = !showDropdownPing"/>
    </div>
  </div>
</template>

<script>
import filters from './util/filters/filters'
import HelperList from '@/components/helperList'
import Navbar from '@/components/navbar'

export default {
  name: 'App',
  beforeCreate () {
    (async () => {
      await this.$store.dispatch('registerWeb3')

      Promise.all([
        this.$store.dispatch('getSaleContractInstance'),
        this.$store.dispatch('getMdappContractInstance'),
        this.$store.dispatch('getTokenContractInstance')
      ]).then(() => {
        filters.init()
      })
    })()
  },
  components: {
    HelperList,
    Navbar
  },

  data () {
    return {
      highlightClaimed: true, // Toggler. Each time it changes, the users pixels blink
      showDropdownPing: false, // Each switch between true/false triggers the transaction log to show
      showNSFW: false,

      missingTokens: 0,
      pixelPriceEth: 0,
      buyPossible: false
    }
  },

  methods: {
    blinkClaimed () {
      this.highlightClaimed = !this.highlightClaimed
    },

    toggleNSFW () {
      this.showNSFW = !this.showNSFW
    },

    changeBuyPossible (val) {
      this.buyPossible = val
    }
  }
}
</script>

<style>
html, body, #app {
  min-height: 100% !important;
  height: 100%;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.navigation {
  z-index: 10;
}

.tooltip hr {
  width: 100%;
  border: 0;
  height: 1px;
  background-color: #CCC;
  color: #CCC;
}

.line-breakable {
  white-space: normal;
}

.modal-backdrop {
  z-index: 1065 !important; /* Between Popover (1060) and Modal content (1070) */
}
.modal {
  z-index: 1066 !important;
}
</style>
