<template>
  <footer class="footer bg-dark text-white-50 text-left">
    <div class="footer-inner d-flex m-0 p-4 justify-content-between">
      <div class="follow">
        <div class="d-flex flex-column justify-content-between h-100">
          <div class="d-flex">
            <a href="https://github.com/MillionDollarDapp" target="_blank" v-b-tooltip.hover title="Github">
              <img src="@/assets/GitHub-Mark-Light-32px.png" width="32px" height="32px">
            </a>

            <a href="https://twitter.com/MillionUSD_DAPP" target="_blank" v-b-tooltip.hover title="Twitter">
              <img src="@/assets/Twitter_Social_Icon_Circle_White.png" width="32px" height="32px">
            </a>

            <a href="https://t.me/MillionDollarDapp" target="_blank" v-b-tooltip.hover title="Telegram">
              <img src="@/assets/telegram_circle_white.png" width="32px" height="32px">
            </a>

            <a href="https://www.instagram.com/milliondollardapp/" target="_blank" v-b-tooltip.hover title="Instagram">
              <img src="@/assets/instagram_white.png" width="32px" height="32px">
            </a>
          </div>
          <div class="pt-3"><router-link to="/legal">Legal notice</router-link></div>
        </div>
      </div>
      <div class="partners">
        <div class="d-flex">
          <div class="pl-3 pr-3"><a class="d-inline-block" href="https://icoholder.com/en/milliondollardapp-26440" target="_blank" v-b-tooltip.hover title="Icoholder">
            <img src="https://icoholder.com/en/small-black-listed/26440.widget.svg" height="50px" alt="Icoholder - Ultimate Rated ICOs List"/>
          </a></div>
          <div class="pl-3 pr-3"><a class="d-inline-block" href="https://www.trackico.io/ico/milliondollardapp/#financial" target="_blank" v-b-tooltip.hover title="TrackICO">
              <img border="0" src="https://www.trackico.io/static/img/partner_logo_white.png" alt="TrackICO - provider of information about the best ICOs" height="50px">
            </a>
          </div>
        </div>
      </div>
      <div class="status">
        <div class="d-flex">
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
            <!--Too unreliable information from web3:-->
            <!--<div class="d-flex">-->
            <!--<div class="label">Status:</div>-->
            <!--<div class="value">{{ this.$store.state.web3.connectionState }}</div>-->
            <!--</div>-->
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import { NETWORKS } from '../util/constants/networks'
import { ExternalLinkIcon } from 'vue-feather-icons'
import web3Manager from '../util/web3Manager'

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
      let web3 = web3Manager.getInstance(true)
      if (this.$store.state.trigger.web3Watcher && this.$store.state.web3.connectionState && web3) {
        return process.env.WEB3_ENDPOINT[this.$store.state.web3.networkId]
      }
      return 'n/a'
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
      if (this.$store.state.web3.web3Watcher) {
        this.version = this.$store.state.web3.web3Watcher().version
        this.network = NETWORKS[this.$store.state.web3.networkId].name
        this.blockexplorer = NETWORKS[this.$store.state.web3.networkId].blockexplorerBaseURL
      }
    },

    mdappTrigger () {
      this.mdapp = typeof this.$store.state.mdappContractInstance === 'function' ? this.$store.state.mdappContractInstance().options.address : null
    },
    saleTrigger () {
      this.mdappSale = typeof this.$store.state.saleContractInstance === 'function' ? this.$store.state.saleContractInstance().options.address : null
    },
    tokenTrigger () {
      this.mdappToken = typeof this.$store.state.tokenContractInstance === 'function' ? this.$store.state.tokenContractInstance().options.address : null
    }
  }
}
</script>

<style scoped>
.footer {
  margin-top: 5px;
  font-size: 0.8rem;
}
.footer-inner > div {
  flex-basis: 0;
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
