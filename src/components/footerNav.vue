<template>
  <footer class="footer bg-dark text-white-50 text-left">
    <div class="d-flex m-0 p-4 h-100 w-100">
      <div class="follow flex-grow-1 d-flex align-items-center w-100 h-100">
        <a href="https://github.com/MillionDollarDapp" target="_blank" v-b-tooltip.hover title="Github">
          <img src="@/assets/GitHub-Mark-Light-32px.png" width="32px" height="32px">
        </a>

        <a href="https://twitter.com/MillionUSD_DAPP" target="_blank" v-b-tooltip.hover title="Twitter">
          <img src="@/assets/Twitter_Social_Icon_Circle_White.png" width="32px" height="32px">
        </a>

        <a href="https://t.me/MillionDollarDapp" target="_blank" v-b-tooltip.hover title="Telegram">
          <img src="@/assets/telegram_circle_white.png" width="32px" height="32px">
        </a>
      </div>

      <div class="status d-flex">
        <div class="network d-flex flex-column">
          <div class="d-flex">
            <div class="label">Network:</div>
            <div class="value">{{ network }}</div>
          </div>
          <div class="d-flex" v-if="blockexplorer && this.$store.state.web3.networkId">
            <div class="label">Smart Contracts:</div>
            <div class="value">
              <div><a :href="`${blockexplorer}/address/${mdappToken}`" target="_blank">MDAPPToken  <external-link-icon/></a></div>
              <div><a :href="`${blockexplorer}/address/${mdapp}`" target="_blank">MDAPP  <external-link-icon/></a></div>
              <div><a :href="`${blockexplorer}/address/${mdappSale}`" target="_blank">MDAPPSale  <external-link-icon/></a></div>
            </div>
          </div>
        </div>
        <div class="web3 d-flex flex-column">
          <div class="d-flex">
            <div class="label">Web3 version:</div>
            <div class="value">{{ version }}</div>
          </div>
          <div class="d-flex">
            <div class="label">Endpoint:</div>
            <div class="value">{{ endpoint }}</div>
          </div>
          <div class="d-flex">
            <div class="label">Status:</div>
            <div class="value">{{ this.$store.state.web3.connectionState }}</div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import { NETWORKS } from '../util/constants/networks'
import { ExternalLinkIcon } from 'vue-feather-icons'

export default {
  name: 'footerNav',
  components: {
    ExternalLinkIcon
  },

  data () {
    return {
      version: 'n/a',
      network: 'n/a',
      blockexplorer: null,
      mdapp: this.$store.state.mdappContractInstance ? this.$store.state.mdappContractInstance().options.address : null,
      mdappSale: this.$store.state.saleContractInstance ? this.$store.state.saleContractInstance().options.address : null,
      mdappToken: this.$store.state.tokenContractInstance ? this.$store.state.tokenContractInstance().options.address : null
    }
  },

  computed: {
    endpoint () {
      return process.env.WEB3_ENDPOINT
    },

    web3DataTrigger () {
      return this.$store.state.trigger.web3Data
    },

    mdappTrigger () {
      return this.$store.state.trigger.mdapp
    },
    saleTrigger () {
      return this.$store.state.trigger.sale
    },
    tokenTrigger () {
      return this.$store.state.trigger.token
    }
  },

  watch: {
    web3DataTrigger () {
      this.version = this.$store.state.web3.web3Watcher().version
      this.network = NETWORKS[this.$store.state.web3.networkId].name
      this.blockexplorer = NETWORKS[this.$store.state.web3.networkId].blockexplorerBaseURL
    },

    mdappTrigger () {
      this.mdapp = this.$store.state.mdappContractInstance().options.address
    },
    saleTrigger () {
      this.mdappSale = this.$store.state.saleContractInstance().options.address
    },
    tokenTrigger () {
      this.mdappToken = this.$store.state.tokenContractInstance().options.address
    }
  }
}
</script>

<style scoped>
.footer {
  margin-top: 5px;
  font-size: 0.8rem;
}
.follow {
  height: 100%;
}
.follow a {
  margin-right: 20px;
}

.label {
  font-weight: 700;
  text-align: right;
  margin-right: 10px;
}

.network .label {
  width: 105px;
}
.network .value {
  width: 98px;
}

.web3 {
  margin-left: 30px;
}
.web3 .label {
  width: 90px;
}

a {
  color: inherit;
  outline: none !important;
}
a svg {
  display: none;
  width: 12px;
  vertical-align: -3px;
  height: 1rem;
  transition: none;
}
a:hover svg {
  display: inline-block;
}
</style>
