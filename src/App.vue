<template>
  <div id="app" class="d-flex flex-column align-items-stretch">
    <div class="navigation">
      <navbar :buyPossible="buyPossible" :showDropdownPing="showDropdownPing" v-on:highlight-claimed="blinkClaimed" v-on:toggleNSFW="toggleNSFW"/>
    </div>
    <div class="helper" v-if="this.$route.meta.showHelper">
      <helper-list/>
    </div>
    <div id="content" class="flex-grow-1 flex-shrink-0 d-flex flex-column justify-content-center">
      <!--<div id="content" class="d-flex justify-content-center align-items-center">-->
      <router-view :class="{'invisible': this.$route.name != 'mdapp'}" name="content" :highlightClaimed="highlightClaimed" :showNSFW="showNSFW"
                   v-on:changeBuyPossible="changeBuyPossible"
                   v-on:showTxLog="showDropdownPing = !showDropdownPing"/>

      <router-view id="route-overlay" name="overlay" class="pt-4 pb-4"/>
    </div>
    <footer-nav/>

    <particles-js/>

    <div id="welcome-modal-content" style="display: none">
      <div class="text-left">
        <h3 class="mb-3">Welcome!</h3>
        <p>
          The <span class="font-weight-bold">MillionDollarDAPP</span> is a homage to the <a href="http://www.milliondollarhomepage.com" target="_blank">Million Dollar Homepage</a>
          from 2005. It maintains <span class="font-weight-bold">1,000,000 pixels</span> which are sold for <span class="font-weight-bold">$1 each</span>.<br />
          In contrast to the original, the MillionDollarDapp utilizes latest Web 3.0 technologies to operate in a complete decentralized manner.
        </p>
        <p>
          It allows you placing ads without cencorship, editing their content and deleting them. But beware: <span class="font-weight-bold">History cannot be changed!</span>
          Every action you take on this DAPP creates an immutable record on the Ethereum Blockchain - <span class="font-weight-bold">forever!</span>
          Images are recognized by their "fingerprint" on IPFS (Interplanetary Filesystem) and served as long as anyone in the universe has interest in it.
        </p>
        <p>
          That allows us to look at the site for any given time in the past. Nobody is able to change records once they are written.
          Everybody can mirror the site and automatically sees the same contents. Fascinating, huh?
        </p>
        <p>
          To be allowed to place an ad, one needs so called <span class="font-weight-bold">MDAPP</span> (ERC20 compliant) tokens which are locked as long as you occupy space.
          Each token represents 10x10 pixels. At the same time, these are the minimum dimensions of your add. The tokens are transferable once all 10,000 tokens have been sold.
        </p>
        <p class="greet text-left">
          Build in Karlsruhe, Germany
        </p>
        <div class="text-right"><b-button class="closeWelcomeBtn" variant="primary">OK</b-button></div>
      </div>
    </div>
  </div>
</template>

<script>
import web3manager from './util/web3Manager'
import HelperList from '@/components/helperList'
import ParticlesJs from '@/components/particlesJs'
import Navbar from '@/components/navbar'
import FooterNav from '@/components/footerNav'
import { NETWORKS } from './util/constants/networks'

export default {
  name: 'App',
  beforeCreate () {
    web3manager.init()
  },
  components: {
    HelperList,
    Navbar,
    ParticlesJs,
    FooterNav
  },

  data () {
    return {
      highlightClaimed: true, // Toggler. Each time it changes, the users pixels blink
      showDropdownPing: false, // Each switch between true/false triggers the transaction log to show
      showNSFW: false,
      getNetworkAttempts: 0,

      missingTokens: 0,
      pixelPriceWei: 0,
      buyPossible: false
    }
  },

  mounted () {
    this.showWelcome()
  },

  methods: {
    showWelcome () {
      // Wait for getting a web3 connection.
      if (this.$store.state.web3.networkId === null && this.getNetworkAttempts < 10) {
        setTimeout(() => { this.showWelcome() }, 100)
        this.getNetworkAttempts++
        return
      }

      if (this.$store.state.web3.networkId === null) {
        // Inform user about connection problems.
        this.$swal({
          type: 'info',
          html: `We're sorry. It seems like no stable connection could be established to the Ethereum network. Please refresh
                 this site and/or try it again in a few minutes.`,
          heightAuto: false,
          showConfirmButton: false
        })
      } else if (this.$store.state.web3.networkId === process.env.DEFAULT_NETWORK) {
        // Show welcome modal.
        let content = document.getElementById('welcome-modal-content').innerHTML

        this.$swal({
          type: 'info',
          width: 900,
          customClass: 'welcome-modal',
          html: content,
          heightAuto: false,
          showConfirmButton: false,
          onOpen: () => {
            let btn = document.querySelector('.welcome-modal .closeWelcomeBtn')
            btn.addEventListener('click', () => {
              this.$swal.close()
            })
          }
        })
      } else if (process.env.NODE_ENV === 'production') {
        // Show wrong network modal.
        let name = NETWORKS[this.$store.state.web3.networkId].name

        this.$swal({
          type: 'warning',
          title: 'Test Network',
          html: `You're connected to the <span class="font-weight-bold">${name}</span> network. Please switch to Mainnet for the 'real' version.`,
          heightAuto: false,
          showConfirmButton: true
        })
      }
    },

    hideWelcome () {
      console.log('closing....')
    },

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

<style lang="scss">
@import "~bootstrap/scss/bootstrap.scss";

html, body {
  min-height: 100% !important;
  height: 100% !important;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  min-height: 100% !important;
  min-width: 1251px;
}

.navigation {
  z-index: 10;
}

/*****************
 * Route Overlay *
 *****************/
#content {
  position: relative;
}

.invisible {
  position: absolute;
  display: none;
}

#route-overlay {
  min-height: 100%;
  width: 100%;
  z-index: 5;
  background-color: #FFF;
}

/*****************
 * Welcome Modal *
 *****************/
.welcome-modal {
  flex-direction: row !important;
}

.welcome-modal .swal2-header {
  padding: 0 15px;

  display: flex;
  flex-direction: column;
  text-align: center;
}
.welcome-modal .swal2-header .swal2-icon {
  margin-top: 0;
}

.welcome-modal .swal2-content {
  padding-left: 20px;
}

.welcome-modal .greet {
  font-size: 0.8rem;
}

.welcome-modal .footnotes {
  color: #A0A0A0;
  font-size: 0.6rem;
}

/*********
 * Other *
 *********/
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

a {
  outline: none !important;
  text-decoration: none !important;
  transition: color .3s;
}
a:hover:not(.btn) {
  color: $blue !important;
}
</style>
