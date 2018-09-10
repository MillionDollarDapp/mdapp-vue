<template>
  <div>
    <div id="dummy-area" :style="`width: ${dummy.w}px; height: ${dummy.h}px; top: ${dummy.t}px; left: ${dummy.l}px;`"></div>

    <b-popover target="dummy-area" ref="popover">
      <template>
        <div class="popover-header d-flex justify-content-between">
          <div class="title">Available actions</div>
          <div class="close-button"><button @click="closePopover" class="close">x</button></div>
        </div>

        <!-- User selected an area -->
        <b-container class="popover-content" v-if="!collides">
          <!-- Show infos about selected area -->
          <b-row align-h="between" class="mt-2 font-weight-bold">
            <b-col md="auto">Selected area:</b-col>
            <b-col md="auto">{{ selectedArea.getWidth() }} &times; {{ selectedArea.getHeight() }} pixels</b-col>
          </b-row>
          <hr/>
          <!-- When user owns tokens... -->
          <template v-if="this.$store.state.balance > 0">
            <b-row align-h="between">
              <b-col md="auto" v-if="!this.claimPossible || this.claimAllActive">Unlocked tokens <span class="font-weight-bold">required</span>:</b-col>
              <b-col md="auto" v-else>Presale tokens <span class="font-weight-bold">required</span>:</b-col>
              <b-col md="auto" class="text-right">{{ selectedArea.getTokenQty() }} MDAPP</b-col>
            </b-row>

            <b-row align-h="between">
              <template v-if="!this.claimPossible || this.claimAllActive">
                <b-col md="auto">Unlocked tokens <span class="font-weight-bold">available</span>:</b-col>
                <b-col md="auto" class="text-right">{{ this.$store.getters.unlockedTokens }} MDAPP</b-col>
              </template>
              <template v-else>
                <b-col md="auto">Presale tokens <span class="font-weight-bold">available</span>:</b-col>
                <b-col md="auto" class="text-right">{{ this.$store.state.presaleTokens }} MDAPP</b-col>
              </template>

            </b-row>
            <!-- Case 1: no claim period active at all -->
            <template v-if="!claimPossible">
              <b-row class="my-3">
                <b-col class="text-center font-weight-bold">Claiming is not yet active. Please be patient.</b-col>
              </b-row>
              <b-row align-h="between">
                <template v-if="presaleClaimStartsIn > 0">
                  <b-col md="auto" cols="auto">Presale participants:</b-col>
                  <b-col md="auto" cols="8" class="text-right">
                    <countdown v-bind:time="presaleClaimStartsIn">
                      <template slot-scope="props">
                        <div class="d-flex justify-content-md-center">
                          <template v-if="props.days > 0"><div class="mr-2">{{ props.days }}<span class="time-label ml-1">days</span></div></template>
                          <template v-if="props.hours > 0 || props.days > 0"><div class="mr-2">{{ props.hours }}<span class="time-label ml-1">hours</span></div></template>
                          <template v-if="props.days < 1">
                            <template v-if="props.minutes > 0 || props.hours > 0"><div class="mr-2">{{ props.minutes }}<span class="time-label ml-1">min</span></div></template>
                            <template v-if="props.hours < 1"><div>{{ props.seconds }}<span class="time-label ml-1">sec</span></div></template>
                          </template>
                        </div>
                      </template>
                    </countdown>
                  </b-col>
                  <div class="w-100"/>
                </template>
                <template v-if="allClaimStartsIn > 0">
                  <b-col md="auto" cols="auto">All token holders:</b-col>
                  <b-col md="auto" cols="8" class="text-right">
                    <countdown v-bind:time="allClaimStartsIn">
                      <template slot-scope="props">
                        <div class="d-flex justify-content-md-center">
                          <template v-if="props.days > 0"><div class="mr-2">{{ props.days }}<span class="time-label ml-1">days</span></div></template>
                          <template v-if="props.hours > 0 || props.days > 0"><div class="mr-2">{{ props.hours }}<span class="time-label ml-1">hours</span></div></template>
                          <template v-if="props.days < 1">
                            <template v-if="props.minutes > 0 || props.hours > 0"><div class="mr-2">{{ props.minutes }}<span class="time-label ml-1">min</span></div></template>
                            <template v-if="props.hours < 1"><div>{{ props.seconds }}<span class="time-label ml-1">sec</span></div></template>
                          </template>
                        </div>
                      </template>
                    </countdown>
                  </b-col>
                </template>
              </b-row>
            </template>
            <!-- Case 2: only presale-claim period active -->
            <template v-else-if="claimPresaleActive && !claimAllActive && this.$store.state.presaleTokens === 0">
              <b-row class="my-3">
                <b-col class="text-center font-weight-bold line-breakable">Claiming is currently only possible for our presale participants. Please be patient.</b-col>
              </b-row>
              <b-row align-h="between">
                <b-col md="auto">All token holders:</b-col>
                <b-col md="auto" class="text-right">
                  <countdown v-bind:time="allClaimStartsIn">
                    <template slot-scope="props">
                      <div class="d-flex justify-content-md-center">
                        <template v-if="props.days > 0"><div class="mr-2">{{ props.days }}<span class="time-label ml-1">days</span></div></template>
                        <template v-if="props.hours > 0 || props.days > 0"><div class="mr-2">{{ props.hours }}<span class="time-label ml-1">hours</span></div></template>
                        <template v-if="props.days < 1">
                          <template v-if="props.minutes > 0 || props.hours > 0"><div class="mr-2">{{ props.minutes }}<span class="time-label ml-1">min</span></div></template>
                          <template v-if="props.hours < 1"><div>{{ props.seconds }}<span class="time-label ml-1">sec</span></div></template>
                        </template>
                      </div>
                    </template>
                  </countdown>
                </b-col>
              </b-row>
            </template>
            <b-row v-if="!this.userCanClaim && this.claimPossible" class="justify-content-center text-center">
              <b-col v-if="this.claimAllActive"><b-alert variant="info" show class="mt-1 mb-0">You need <span class="font-weight-bold">{{ missingTokens }}</span> more MDAPP tokens.</b-alert></b-col>
              <b-col v-else><b-alert variant="info" show class="mt-1 mb-0">Not enough presale tokens available.</b-alert></b-col>
            </b-row>
            <b-row v-if="this.userCanClaim" class="mt-3 font-italic">
              <b-col class="line-breakable notice">
                If multiple people claim the same pixels at the same time, the one whose transaction gets processed earlier by the Ethereum network will get them.
                If another one was faster, you get your MDAPP refunded.
              </b-col>
            </b-row>
            <b-row>
              <b-col class="text-center"><b-button variant="success" :disabled="!this.userCanClaim" @click="claimBtnPressed">Claim pixels</b-button></b-col>
            </b-row>
          </template>

          <!-- Show a divider if the above and below template is visible -->
          <hr v-if="!this.$store.state.soldOut && this.$store.state.balance > 0 && missingTokens > 0" class="divider"/>

          <!-- When tokens can be bought... -->
          <template v-if="!this.$store.state.soldOut && missingTokens > 0">
            <b-row>
              <b-col v-if="selectedArea.getTokenQty() > this.$store.getters.unlockedTokens">
                <p>Buy <span class="font-weight-bold">{{ missingTokens }} MDAPP</span> tokens to claim an area of this size.<br />1 MDAPP can claim 1 square (= 100 pixels).</p>
              </b-col>
            </b-row>
            <b-row align-h="between">
              <b-col md="auto">Pixels:</b-col><b-col md="auto" class="text-right">{{selectedArea.getPixels()}}</b-col>
            </b-row>
            <b-row align-h="between">
              <b-col md="auto">Price per pixel:</b-col><b-col md="auto" class="text-right">$1 ({{ pixelPriceEth.toFixed(8) }} ETH)</b-col>
            </b-row>
            <b-row align-h="between">
              <b-col md="auto">Total cost:</b-col><b-col md="auto" class="text-right">${{ selectedArea.getTokenQty() * 100 }} ({{ costEth.toFixed(8) }} ETH)</b-col>
            </b-row>
            <b-row>
              <b-col class="text-center"><b-button variant="success" :disabled="!buyPossible" @click="buyBtnPressed">Buy {{ missingTokens }} MDAPP Token(s)</b-button></b-col>
            </b-row>
          </template>

          <!-- No buying possible and no tokens available... -->
        </b-container>
        <b-container v-else class="popover-content">
          <p class="mb-0"><strong>Your selection is colliding with already claimed pixels.</strong></p>
        </b-container>
      </template>
    </b-popover>
  </div>
</template>

<script>
import Raven from 'raven-js'
import { mapState } from 'vuex'
import mdappContract from '../util/interactions/mdappContract'
import { newTransaction } from '../util/transaction'
import web3Manager from '../util/web3Manager'

import VueCountdown from '@xkeshi/vue-countdown'

export default {
  name: 'canvasPopover',
  components: {
    'countdown': VueCountdown
  },

  props: {
    buyPossible: Boolean,
    collides: Boolean,
    dummy: Object,
    show: Boolean,
    selectedArea: Object,
    targetEl: String
  },
  data () {
    return {
      claimPresaleActive: false,
      claimAllActive: false,
      presaleClaimStartsIn: null,
      allClaimStartsIn: null
    }
  },
  computed: {
    ...mapState(['adStartPresale', 'adStartAll', 'presaleTokens']),

    claimPossible () {
      return this.claimPresaleActive || this.claimAllActive
    },

    userCanClaim () {
      // Any period active?
      if (!this.claimPossible ||
        // Has user ANY tokens for claiming?
        this.$store.getters.unlockedTokens === 0 ||
        // Has he enough for the selected area?
        this.$store.getters.unlockedTokens < this.selectedArea.getTokenQty() ||
        // Does he have 'presale' tokens during presale period and are they enough for the selected area?
        (!this.claimAllActive && this.presaleTokens < this.selectedArea.getTokenQty())) {
        return false
      }
      // All good.
      return true
    },

    missingTokens () {
      return this.selectedArea.getTokenQty() - this.$store.getters.unlockedTokens
    },

    pixelPriceEth () {
      return Number(this.web3.utils.fromWei(this.$store.getters.pixelPriceWei, 'ether'))
    },
    costEth () {
      // Total cost in ETH
      return Number(this.web3.utils.fromWei(this.$store.getters.pixelPriceWei.mul(this.web3.utils.toBN(100 * this.selectedArea.getTokenQty())), 'ether'))
    },

    web3 () {
      return web3Manager.getInstance()
    }
  },

  watch: {
    show (value) {
      if (value) {
        this.showPopover()
      } else {
        this.hidePopover()
      }
    }
  },

  mounted () {
    this.isClaimActive()
  },

  methods: {
    isClaimActive () {
      // Rerun this method until we fetched the data from our contract.
      if (this.adStartAll === null || this.adStartPresale === null) {
        setTimeout(() => { this.isClaimActive() }, 100)
        return
      }

      // Presale-participants can claim first. Without a gap the rest can start claiming at a later date.
      if (this.adStartAll <= Date.now()) {
        this.claimAllActive = true
      } else if (this.adStartPresale <= Date.now()) {
        this.claimPresaleActive = true
        this.allClaimStartsIn = this.adStartAll - Date.now()

        // Run this method again when we expect the general claiming period to start.
        setTimeout(() => { this.isClaimActive() }, this.allClaimStartsIn)
      } else {
        // No claim period active.
        this.presaleClaimStartsIn = this.adStartPresale - Date.now()
        this.allClaimStartsIn = this.adStartAll - Date.now()

        // Run this method again when we expect the presale claim period to start.
        setTimeout(() => { this.isClaimActive() }, this.presaleClaimStartsIn)
      }
    },

    showPopover () {
      this.$root.$emit('bv::show::popover', this.targetEl)
      this.$emit('popover-created', this.$refs.popover)
    },
    hidePopover () {
      // Triggered by change of "watch" property
      this.$root.$emit('bv::hide::popover', this.targetEl)
    },
    closePopover () {
      // Triggered by click on close button
      this.$emit('hide')
    },

    buyBtnPressed () {
      this.$emit('buyBtnPressed')
    },
    async claimBtnPressed () {
      let x = this.selectedArea.topLeft[0]
      let y = this.selectedArea.topLeft[1]
      let w = this.selectedArea.getWidth()
      let h = this.selectedArea.getHeight()

      try {
        let [error, tx] = await mdappContract.claim(x, y, w, h)
        if (error) throw error
        tx
          .on('transactionHash', txHash => {
            this.$swal({
              type: 'success',
              title: 'Transaction sent',
              html: `Track its progress on <a href="${this.$store.getters.blockExplorerBaseURL}/tx/${txHash}" target="_blank">etherscan.io</a> or at the top right of this site.`,
              heightAuto: false,
              showConfirmButton: false,
              onAfterClose: () => {
                this.$emit('showTxLog')
              }
            })
            newTransaction(txHash, 'claim', {x: x, y: y, width: w, height: h}, 'pending')
            this.$emit('finished')
          })
          .on('error', error => {
            throw error
          })
      } catch (error) {
        let msg = error.message
        if (msg.indexOf('User denied transaction signature') === -1) {
          console.error('claimBtnPressed:', error)
          Raven.captureException(error)

          this.$swal({
            type: 'error',
            title: 'Error',
            html: `${msg.substr(0, 1).toUpperCase()}${msg.substr(1)}`,
            heightAuto: false,
            showConfirmButton: false
          })
        }
      }
    }
  }
}
</script>

<style>
  /* Popover styles must not be scoped */
  .popover {
    white-space: nowrap !important;
    max-width: 400px !important;
  }
  .popover .moving {
    opacity: 0.8;
  }

  .popover .notice {
    font-size: 0.75rem;
    color: #A0A0A0;
  }

  /* Set a margin to the selected pixels */
  .bs-popover-right {
    margin-left: 20px !important;
  }
  .bs-popover-bottom {
    margin-top: 20px !important;
  }
  .bs-popover-left {
    margin-right: 20px !important;
  }
  .bs-popover-top {
    margin-bottom: 20px !important;
  }

  .popover-body {
    padding: 0 !important;
  }
  .popover-content {
    padding: 0.5rem 0.75rem !important;
  }

  .popover button {
    margin-top: 20px;
  }
  button.close {
    margin: 0;
    font-size: 1.25rem
  }

  #dummy-area {
    position: absolute;
  }
</style>
