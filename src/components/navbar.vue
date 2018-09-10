<template>
  <b-navbar type="dark" toggleable="md" variant="dark">
    <div class="d-flex m-0 p-0 w-100">
      <b-navbar-brand href="#" class="flex-shrink-1 p-0"><img src="@/assets/logo.png" height="50px" style="margin-top: 4px;"/></b-navbar-brand>
      <div class="d-flex flex-column flex-grow-1 w-100">
        <div class="d-flex flex-row justify-content-start" style="flex-wrap: nowrap">
          <b-collapse is-nav id="nav_collapse">
            <b-navbar-nav class="text-nowrap">
              <b-nav-item href="#">Home</b-nav-item>
              <b-nav-item href="#">The Story</b-nav-item>
              <b-nav-item href="#">FAQ</b-nav-item>
              <b-nav-item href="#">Whitepaper</b-nav-item>
            </b-navbar-nav>

            <b-button id="quickBuyBtn" class="ml-2" variant="success" size="sm" @click="buyBtnPressed" v-b-tooltip.hover title="Buy MDAPP to claim your pixels"
              v-if="buyPossible && web3Data.coinbase">
              Buy Now!
            </b-button>

            <b-row align-h="end" class="highlight ml-auto">
              <template v-if="web3Data.isInjected">
                <template v-if="web3Data.coinbase">
                  <b-col>
                    <user-icon/>
                    <b-nav-text>{{ $store.getters.coinbaseShort }}</b-nav-text>
                  </b-col>
                  <!-- Balances -->
                  <b-col md="auto">
                    <b-nav-text>
                      <b-badge v-b-tooltip.hover :title="'Exchange rate: $' + this.$store.state.ethusd / 100">{{ web3Data.balanceEth }} ETH</b-badge>
                    </b-nav-text>
                  </b-col>
                  <b-col md="auto" class="p-0 icon-col"><arrow-right-icon/></b-col>
                  <b-col md="auto">
                    <b-nav-text>
                      <b-badge v-b-tooltip.html.hover="balanceTooltip">
                        <template v-if="this.$store.getters.unlockedTokens !== null">
                          {{ this.$store.getters.unlockedTokens }}
                        </template>
                        <template v-else>
                          <img src="@/assets/throbber/throbber-light-grey.gif" width="11px" height="11px"/>
                        </template>
                        MDAPP
                      </b-badge>
                    </b-nav-text>
                  </b-col>
                  <b-col md="auto" class="p-0 icon-col icons-nospace"><arrow-left-icon/><arrow-right-icon/></b-col>
                  <b-col md="auto">
                    <b-nav-text>
                      <b-badge v-if="this.$store.getters.claimedPixels !== null" v-b-tooltip.hover title="Amount of claimed pixels">{{ this.$store.getters.claimedPixels }} Pixels</b-badge>
                      <b-badge v-else><img src="@/assets/throbber/throbber-light-grey.gif" width="11px" height="11px"/> Pixels</b-badge>
                    </b-nav-text>
                  </b-col>
                </template>
                <!-- NSFW Toggle -->
                <b-col md="auto" :class="web3Data.coinbase ? 'mx-0 px-0' : ''" v-if="this.$store.state.trigger.forceNSFW && (this.$store.state.forceNSFW.size > 0 || this.$store.state.adsWithNSFW > 0)">
                  <b-nav-text>
                    <toggle-button :value="false" :labels="{checked: 'Yes', unchecked: 'No'}"
                                   :color="{checked: '#48ce60', unchecked: '#d84343', disabled: '#CCCCCC'}"
                                   @change="toggleNSFW"
                                   v-b-tooltip.hover title="Show NSFW content?"/>
                  </b-nav-text>
                </b-col>
                <!-- Transactions log -->
                <b-col md="auto" class="px-0" v-if="web3Data.coinbase">
                  <b-dropdown variant="link" ref="txLogDropdown" no-caret right class="tx-dropdown">
                    <template slot="button-content">
                      <activity-icon v-b-tooltip.hover title="Transactions log"/>
                      <div class="pending-indicator" v-if="$store.getters.hasPendingTx"/>
                    </template>
                    <div class="header">
                      <div class="tx-log-title font-weight-bold">Transactions log</div>
                      <div class="tx-log-subtitle mt-1">Your interactions with the Million Dollar DAPP.</div>
                    </div>
                    <div class="content">
                      <template v-if="transactions.length > 0">
                        <ul class="tx-log-list px-4 pt-4">
                          <li is="tx-item" v-for="[key, tx] in transactions" :key="key" :tx="tx" :trigger="$store.state.trigger.tx"/>
                        </ul>
                      </template>
                      <template v-else>
                        <div class="w-100 py-5 text-center">No transactions found.</div>
                      </template>
                    </div>
                  </b-dropdown>
                </b-col>
              </template>
              <template v-if="!web3Data.isInjected || !web3Data.coinbase">
                <b-col md="auto"><user-icon/> <b-nav-text>Please install and unlock <a href="https://metamask.io/" target="_blank">Metamask</a></b-nav-text></b-col>
              </template>
            </b-row>
          </b-collapse>

          <b-navbar-toggle target="nav_collapse" class="ml-auto"></b-navbar-toggle>
        </div>
        <div class="d-flex justify-content-start text-white sub-nav">
          <!--<div class="slogan text-white-50 ml-3">...be part of history!</div>-->
          <div class="slogan text-white-50 pl-2">
            1,000,000 pixels &#9675; $1 per pixel &#9675; 100 pixels per token
          </div>
          <div class="flex-grow-1 d-flex justify-content-end sub-nav-right text-white-50">
            <template v-if="web3Data.coinbase">
              <template v-if="!this.$store.state.soldOut">
                <div class="mr-2">Your referral code:</div>
                <div class="mr-2">{{ referral }}</div>
                <div class="mr-2"><file-text-icon id="copyReferralBtn" class="link" v-b-tooltip.hover title="Copy to clipboard" @click="copyToClipboard"/></div>
              </template>
              <div v-if="!this.$store.state.soldOut || (this.$store.state.withdrawableBalance !== 0 && this.$store.state.withdrawableBalance.gt(0))">
                <b-badge v-if="!this.$store.state.withdrawableBalance || this.$store.state.withdrawableBalance.eq(this.web3.utils.toBN(0))"
                         v-b-tooltip.hover title="Share your referral code to get 10% of all ETH spent at purchases of MDAPP using your code.">{{ 0 }} ETH</b-badge>
                <b-badge v-else class="link" @click="withdrawReferralBalance" v-b-tooltip.hover title="Click to withdraw your referral balance">{{ this.$store.getters.withdrawableBalanceEthShort }} ETH</b-badge>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <modal-buy id="modalBuyNav" :selectedTokenQty="1" :pixelPriceEth="this.$store.getters.pixelPriceWei" :buyPossible="buyPossible" v-on:showTxLog="$refs.txLogDropdown.visible = true"/>
  </b-navbar>
</template>

<script>
import Raven from 'raven-js'
import TxItem from '@/components/txItem'
import ModalBuy from '@/components/modalBuy'
import utils from '../util/utils'
import saleContract from '../util/interactions/saleContract'
import {newTransaction} from '../util/transaction'
import web3Manger from '../util/web3Manager'
import { UserIcon, ArrowRightIcon, ArrowLeftIcon, ActivityIcon, FileTextIcon } from 'vue-feather-icons'

export default {
  name: 'navbar',
  components: {
    ModalBuy,
    TxItem,

    ActivityIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    FileTextIcon,
    UserIcon
  },

  props: {
    buyPossible: Boolean,
    showDropdownPing: Boolean // each switch between true/false triggers the dropdown to show
  },

  watch: {
    showDropdownPing () {
      this.$refs.txLogDropdown.visible = true
    }
  },

  computed: {
    web3Data () {
      return this.$store.state.web3
    },
    web3 () {
      return web3Manger.getInstance()
    },
    transactions () {
      // Conditions is always true and is only used to trigger a recalculation.
      if (this.$store.state.trigger.tx) {
        let txs = Array.from(this.$store.state.transactions)
        // Reverse order.
        let result = []
        for (let i = txs.length - 1; i >= 0; i -= 1) {
          result.push(txs[i])
        }
        return result
      }
    },

    referral () {
      let prefix = window.location.href
      if (prefix.indexOf('?') !== -1) {
        prefix = prefix.substr(0, prefix.indexOf('?'))
      }
      prefix += '?r='

      return prefix + utils.address2Referral(this.web3Data.coinbase)
    }
  },

  methods: {
    buyBtnPressed () {
      this.$root.$emit('bv::show::modal', 'modalBuyNav')
    },

    withdrawReferralBalance () {
      saleContract.withdrawBalance().then((txHash, err) => {
        if (err) {
          Raven.captureException(err)
          let msg = `${err.message.substr(0, 1).toUpperCase()}${err.message.substr(1)}`
          this.$swal({
            type: 'error',
            title: 'Error',
            html: msg,
            heightAuto: false,
            showConfirmButton: false
          })
          newTransaction(txHash, 'withdrawBalance', {error: msg}, 'error')
        } else {
          this.$swal({
            type: 'success',
            title: 'Transaction sent',
            html: `Transfer is now allowed.<br />Track tx progress on <a href="${this.$store.getters.blockExplorerBaseURL}/tx/${txHash}" target="_blank">etherscan.io</a> or at the top right of this site.`,
            heightAuto: false,
            showConfirmButton: false
          })

          newTransaction(txHash, 'withdrawBalance', {}, 'pending')
        }
      }).catch(e => {
        Raven.captureException(e)
      })
    },

    copyToClipboard () {
      this.$root.$emit('bv::hide::tooltip', 'copyReferralBtn')
      let el = document.getElementById('copyReferralBtn')
      let tooltipText = el.getAttribute('data-original-title')

      if (window.clipboardData && window.clipboardData.setData) {
        // IE specific code path to prevent textarea being shown while dialog is visible.
        window.clipboardData.setData('Text', this.referral)

        el.setAttribute('data-original-title', 'Copied!')
        this.$root.$emit('bv::show::tooltip', 'copyReferralBtn')
        setTimeout(() => {
          this.$root.$emit('bv::hide::tooltip', 'copyReferralBtn')
          el.setAttribute('data-original-title', tooltipText)
        }, 1000)
      } else if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
        let textarea = document.createElement('textarea')
        textarea.textContent = this.referral
        textarea.style.position = 'fixed' // Prevent scrolling to bottom of page in MS Edge.
        document.body.appendChild(textarea)
        textarea.select()

        try {
          document.execCommand('copy') // Security exception may be thrown by some browsers.

          el.setAttribute('data-original-title', 'Copied!')
          this.$root.$emit('bv::show::tooltip', 'copyReferralBtn')
          setTimeout(() => {
            this.$root.$emit('bv::hide::tooltip', 'copyReferralBtn')
            el.setAttribute('data-original-title', tooltipText)
          }, 1000)
        } catch (e) {
          Raven.captureException(e)
          return false
        } finally {
          document.body.removeChild(textarea)
        }
      }
    },

    balanceTooltip () {
      let output = `<div class="d-flex flex-column">
        <div class="d-flex justify-content-between">
          <div>Transferable:</div><div>${this.$store.state.transferableTokens !== null ? this.$store.state.transferableTokens : `<img src="${require('../assets/throbber/throbber-black.gif')}" width="16px" height="16px"/>`} MDAPP</div>
        </div>
        <div class="d-flex justify-content-between">
          <div>Locked in pixels:</div><div>${this.$store.state.lockedTokens !== null ? this.$store.state.lockedTokens : `<img src="${require('../assets/throbber/throbber-black.gif')}" width="16px" height="16px"/>`} MDAPP</div>
        </div>
        <div class="d-flex justify-content-between">
          <div>Unlocked:</div><div>${this.$store.getters.unlockedTokens !== null ? this.$store.getters.unlockedTokens : `<img src="${require('../assets/throbber/throbber-black.gif')}" width="16px" height="16px"/>`} MDAPP</div>
        </div>`

      if (this.$store.state.adStartAll > Date.now()) {
        output += `<div class="d-flex justify-content-between">
            <div>Presale balance:</div><div>${this.$store.state.presaleTokens !== null ? this.$store.state.presaleTokens : `<img src="${require('../assets/throbber/throbber-black.gif')}" width="16px" height="16px"/>`} MDAPP</div>
          </div>`
      }

      output += `<hr/>
        <div v-if="!this.$store.getters.transferAllowed" class="text-left">
          Your tokens are transferable once all 10,000 tokens have been distributed.
        </div>
      </div>`

      return output
    },

    toggleNSFW () {
      this.$emit('toggleNSFW')
    },

    highlightClaimed () {
      this.$emit('highlight-claimed')
    }
  }
}
</script>
<style scoped>
  .link {
    cursor: pointer;
  }

  label.vue-js-switch {
    margin: -3px 0 0 0;
  }

  .slogan {
    font-size: 0.8rem;
  }
</style>

<style lang="scss">
  @import "~bootstrap/scss/bootstrap.scss";

  #quickBuyBtn {
    border-radius: 30px;
    font-size: 0.75rem;
  }

  .navbar {
    z-index: 1;
  }

  .navbar .highlight .navbar-text {
    color: $orange;
  }

  .navbar svg {
    color: $gray-100;
    width: 18px;
    vertical-align: -5px;
  }

  .navbar .icon-col svg {
    vertical-align: -14px;
  }

  .navbar .icons-nospace svg:first-child {
    margin-right: -4px;
  }

  .navbar .icons-nospace svg:last-child {
    margin-left: -3px;
  }

  .navbar .badge {
    vertical-align: 2px;
  }

  .navbar .pending-indicator {
    background-color: #ffc107;
    border-radius: 50%;
    cursor: pointer;
    height: 6px;
    position: absolute;
    width: 6px;
    right: 10px;
    top: 25px;
  }

  .sub-nav-right {
    font-size: 0.8rem;
  }

  .sub-nav svg {
    height: 14px;
    line-height: 14px;
    vertical-align: text-bottom;
  }

  .sub-nav .badge {
    vertical-align: 1px;
  }

  /* Dropdown */
  .dropdown-menu {
    color: $gray-600;
    padding: 0 !important;
    margin: 0 !important;
    white-space: nowrap;
    box-shadow: $box-shadow-sm !important;

    .header {
      background-color: $gray-100;
      padding: 24px;
      border-top-left-radius: 0.25rem;
      border-top-right-radius: 0.25rem;

      .tx-log-title {
        color: $gray-800;
        font-size: 0.9rem;
        line-height: 20px;
      }
      .tx-log-subtitle {
        font-size: 0.75rem;
      }
    }

    .content {
      border-top: 1px solid $gray-400;
      border-bottom-left-radius: 0.25rem;
      border-bottom-right-radius: 0.25rem;
      font-size: 0.9rem;
    }
  }

  .tx-log-list {
    list-style: none;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    color: #778390;
    line-height: 1.5;

  }
</style>
