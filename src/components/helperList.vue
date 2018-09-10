<template>
  <div id="helperListWrapper" class="text-left">
    <b-card no-body id="helperList">
      <b-tabs card v-model="showStep">

        <!--Install MetaMask-->
        <b-tab :title-link-class="tabClass(0)">
          <template slot="title">
            <div class="d-flex align-items-center">
              <span>1) Install MetaMask</span>
              <check-circle-icon v-if="0 < currentStep"/>
              <clock-icon v-if="0 === currentStep"/>
            </div>
          </template>

          <div class="step-item d-flex align-items-center" :class="tabClass(0)">
            <div>
              In order to get your own pixels, you need to install the MetaMask extension within your browser.
              Please visit <a href="https://metamask.io" target="_blank">https://metamask.io</a> for further instructions.
            </div>
            <div class="flex-grow-1 px-4 text-center">
              <img src="@/assets/metamask-fox.svg" width="50px" height="50px"/>
            </div>
          </div>
        </b-tab>

        <!--Unlock account-->
        <b-tab :title-link-class="tabClass(1)">
          <template slot="title">
            <div class="d-flex align-items-center">
              <span>2) Unlock account</span>
              <check-circle-icon v-if="1 < currentStep"/>
              <clock-icon v-if="1 === currentStep"/>
            </div>
          </template>

          <div class="step-item d-flex align-items-center" :class="tabClass(1)">
            <div>
              Open the MetaMask extension (<img src="@/assets/metamask-fox.svg" width="18px" height="18px"/> - symbol at the
              top right of your browser) and follow the instructions to unlock or create an account. See
              <a href="https://www.youtube.com/watch?v=6Gf_kRE4MJU" target="_blank">this video</a> for a brief
              introduction to MetaMask.
            </div>
          </div>
        </b-tab>

        <!--Get Ether-->
        <b-tab :title-link-class="tabClass(2)">
          <template slot="title">
            <div class="d-flex align-items-center">
              <span>3) Get Ether</span>
              <check-circle-icon v-if="2 < currentStep"/>
              <clock-icon v-if="2 === currentStep"/>
            </div>
          </template>

          <div class="step-item d-flex align-items-center" :class="tabClass(2)">
            <div v-if="$store.state.web3.networkId === 4">
              Load your account with some Ether. As we are on a testnet, you can get them for free at the <a href="https://faucet.rinkeby.io/" target="_blank">Rinkeby Faucet</a>.
            </div>
            <div v-else>
              Load your account with some Ether. You can buy them on several exchanges.
            </div>
          </div>
        </b-tab>

        <!--Buy MDAPP-->
        <b-tab :title-link-class="tabClass(3)">
          <template slot="title">
            <div class="d-flex align-items-center">
              <span>4) Buy MDAPP</span>
              <check-circle-icon v-if="3 < currentStep"/>
              <clock-icon v-if="3 === currentStep"/>
            </div>
          </template>

          <div class="step-item d-flex align-items-center" :class="tabClass(3)">
            <div>
              Select the area dimensions you want to claim by clicking on a square and dragging the mouse to the opposite
              corner of the area while holding the mouse button pressed.<br />
              After releasing the mouse button a dialog opens which shows you the amount of MDAPP tokens required to claim this area.
              Then click on the "Buy" - button and complete the checkout.
            </div>
          </div>
        </b-tab>

        <!--Claim pixels-->
        <b-tab :title-link-class="tabClass(4)">
          <template slot="title">
            <div class="d-flex align-items-center">
              <span>5) Claim pixels</span>
              <check-circle-icon v-if="4 < currentStep"/>
              <clock-icon v-if="4 === currentStep"/>
            </div>
          </template>

          <div class="step-item d-flex align-items-center" :class="tabClass(4)">
            <div>
              Select the area you want to claim. If you have enough MDAPP tokens and if none of the selected pixels are owned
              by someone else, then you'll be able to click the claim button.
            </div>
          </div>
        </b-tab>

        <!--Upload image-->
        <b-tab :title-link-class="tabClass(5)">
          <template slot="title">
            <div class="d-flex align-items-center">
              <span>6) Upload image</span>
              <check-circle-icon v-if="5 < currentStep"/>
              <clock-icon v-if="5 === currentStep"/>
            </div>
          </template>

          <div class="step-item d-flex align-items-center" :class="tabClass(5)">
            <div>
              Click on your ad, then select "Edit data". All fields except the image are optional. After selecting your
              image, you'll be prompted to select the visible part of the image (in case it hasn't the exact same dimensions
              as your ad).
            </div>
          </div>
        </b-tab>
      </b-tabs>
    </b-card>

    <!--Open Button-->
    <div id="helperOpenButton" class="bg-dark text-white text-center mb-3" v-on:click="open" v-b-tooltip.hover title="How to place your ad">
      How to place your ad
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import { CheckCircleIcon, ClockIcon } from 'vue-feather-icons'
import Velocity from 'velocity-animate'
import 'velocity-animate/velocity.ui'

export default {
  name: 'helperList',

  components: {
    CheckCircleIcon,
    ClockIcon
  },

  data () {
    return {
      showStep: 0,
      exposed: false,
      wobbleInterval: null,

      helperListEl: null,
      openBtnEl: null
    }
  },

  computed: {
    currentStep () {
      return this.$store.getters.currentHelperProgress
    }
  },

  watch: {
    currentStep (newVal) {
      this.showStep = newVal

      Vue.nextTick(() => {
        this.initPosition()
      })

      if (newVal === 6) {
        // Finished!
        setTimeout(() => {
          this.close()
        }, 1000)
      }
    }
  },

  mounted () {
    this.helperListEl = document.getElementById('helperList')
    this.openBtnEl = document.getElementById('helperOpenButton')
    this.showStep = this.currentStep

    // Ad close button
    let btn = document.createElement('button')
    btn.setAttribute('type', 'button')
    btn.setAttribute('area-label', 'Close')
    btn.setAttribute('class', 'close')
    btn.setAttribute('style', 'outline: none')
    btn.textContent = 'x'

    btn.addEventListener('click', () => {
      this.close()
      return false
    })

    let header = document.getElementById('helperListWrapper').getElementsByClassName('card-header')[0]
    if (header) header.appendChild(btn)

    // Move into position.
    Vue.nextTick(() => {
      this.initPosition()
    })

    // Start wobbling the openButton
    this.wobbleInterval = setInterval(() => {
      if (!this.exposed && this.currentStep < 6) {
        if (!document.hidden) {
          Velocity(this.openBtnEl, 'callout.tada')
        }
      }
    }, 5000)

    // Listen for window resize
    window.addEventListener('resize', this.initPosition)
  },

  beforeDestroy () {
    if (this.wobbleInterval) clearInterval(this.wobbleInterval)
  },

  methods: {
    tabClass (id) {
      if (id < this.currentStep) {
        return 'step-done'
      } else if (id === this.currentStep) {
        return 'step-current'
      }
      return 'step-next'
    },

    initPosition () {
      if (!this.exposed) {
        this.helperListEl.setAttribute('style', `margin-top: -${this.helperListEl.offsetHeight + 1}px`)
        Velocity(this.openBtnEl, { opacity: 1 }, { duration: 100 })
      }
    },

    open () {
      if (!this.exposed) {
        this.exposed = true
        Velocity(this.openBtnEl, { opacity: 0 }, {
          display: 'none',
          duration: 10,
          complete: () => {
            Velocity(this.helperListEl, { marginTop: 0 }, { duration: 300 })
          }
        })
      }
    },

    close () {
      if (this.exposed) {
        this.exposed = false
        Velocity(this.helperListEl, { marginTop: -(this.helperListEl.offsetHeight + 1) }, {
          duration: 300,
          complete: () => {
            Velocity(this.openBtnEl, { opacity: 1 }, {
              display: 'block',
              duration: 100
            })
          }
        })
      }
    }
  }
}
</script>

<style scoped>
  #helperOpenButton {
    width: 130px;
    height: 18px;
    font-size: 0.75rem;
    margin: 0 auto;
    cursor: pointer;
    border-radius: 0 0 10px 10px;
    opacity: 0;
  }
  #helperOpenButton:hover {
    color: #fd7e14 !important;
  }
</style>

<style>
  #helperListWrapper .card {
    border-width: 0;
    border-bottom-width: 1px;
    outline: none;
    opacity: 1;
  }

  #helperListWrapper .card-header-tabs {
    outline: none;
    margin-left: 0;
    margin-right: 0;
  }

  #helperListWrapper .card-header {
    border: none;
    padding-top: 0;
    padding-left: 0;
    padding-right: 0;
    outline: none;
  }
  #helperListWrapper .card-header svg {
    width: 15px;
    height: 15px;
    margin-left: 10px;
    position: relative;
  }

  #helperListWrapper .card-header .close {
    position: absolute;
    top: 7px;
    right: 10px;
  }
  #helperListWrapper .card-header li {
    margin-bottom: -2px;
  }

  #helperListWrapper .card-header a,
  #helperListWrapper .card-header a.active,
  #helperListWrapper .card-header a:hover {
    border: none;
  }

  #helperListWrapper .card-header a.active.step-done,
  #helperListWrapper .tab-content .step-done {
    color: #155724 !important;
    background-color: #c3e6cb !important;
  }

  #helperListWrapper .card-header a.active.step-current,
  #helperListWrapper .tab-content .step-current {
    color: #856404 !important;
    background-color: #ffeeba !important;
  }

  #helperListWrapper .card-header a.active.step-next,
  #helperListWrapper .tab-content .step-next {
    color: #818182 !important;
    background-color: #fdfdfe !important;
  }

  #helperListWrapper .tab-content .tab-pane {
    padding: 0;
  }

  #helperListWrapper .step-item {
    padding: 1.25rem;
  }
</style>
