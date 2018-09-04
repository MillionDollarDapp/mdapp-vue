<template>
  <b-modal :id="id" ref="buyModalRef" size="lg" centered no-close-on-esc no-close-on-backdrop>
    <template slot="modal-title">
      <h3 v-if="step === 'tc'">Terms and Conditions (T&C)</h3>
      <h3 v-if="step === 'checkout'">Buy MDAPP Tokens</h3>
    </template>
    <template v-if="step === 'tc'">
      <!-- TERMS AND CONDITIONS -->
      <b-container fluid class="text-left">
        <b-row class="mb-3"><b-col>Please read the T&C carefully and confirm the checkboxes to continue.</b-col></b-row>
        <b-row class="mb-3">
          <b-col class="scroll-box">
            Final T&C coming soon.<br /><br />

            <strong>Token Sale Metrics</strong>
            <p>Symbol: MDAPP<br />
            Decimals: 0<br />
            Max. supply: 10,000 MDAPP<br />
            Price per Token: $100*<br />
            Hard Cap: $1,000,000<br />
            Presale: TBA<br />
            Sale: TBA<br />
            Presale pixel claiming start: TBA<br />
            Sale pixel claiming start: TBA</p>

            <!--First come - first serve<br />-->
            <!--Transaction fee<br />-->
            <!--NSFW<br />-->
            <!--Utility Token<br />-->
            <!--Trading<br />-->
            <!--No warranty<br />-->
            <!--Cencorship resistent<br />-->
            <!--Immutable<br />-->
            <!--Availability<br />-->
          </b-col>
        </b-row>

        <b-row class="mb-2">
          <b-col>
            <b-form-checkbox v-model="acceptedTC">
              I confirm that I have read and understand the Terms and Conditions and the Whitepaper and that I
              expressly accept all terms, conditions, obligations, affirmations, representations and warranties described in
              these documents and agree to be bound by them.**
            </b-form-checkbox>
          </b-col>
        </b-row>
        <b-row>
          <b-col>
            <b-form-checkbox v-model="acceptedOrigin">
              I confirm I’m not a U.S. or Singapore or People’s Republic of China citizen resident or entity
              (a "U.S. or Singapore or PRC") nor am purchasing MDAPP tokens on behalf of a U.S. or Singapore or PRC Person,
              or registered professional investor who is permitted to purchase digital tokens by regulations of respective countries.
            </b-form-checkbox>
          </b-col>
        </b-row>
      </b-container>

      <b-container fluid class="text-left footer mt-3">
        <b-row>
          <b-col>* Price based on ETH exchange rate determined by COINBASE via smart contract oracle of ORACLIZE LIMITED. Additional
            network transaction fees are necessary and are not inclusive.</b-col>
        </b-row>
        <b-row>
          <b-col>** BY PURCHASING TOKENS, YOU ACKNOWLEDGE, AGREE AND CERTIFY THAT YOU ARE PURCHASING TOKENS DURING THE SALE
            PERIOD FOR YOUR OWN PERSONAL USE AND UTILITY, AND TO PARTICIPATE IN THE ECOSYSTEM AND NOT FOR INVESTMENT, OR
            FINANCIAL PURPOSES. YOU AGREE AND CERTIFY THAT TOKENS ARE NOT A SECURITY OR A CRYPTOCURRENCY AND ACKNOWLEDGE
            THAT TOKENS MAY HAVE NO VALUE AND MAY LOSE VALUE, IF ANY.</b-col>
        </b-row>
      </b-container>
    </template>
    <template v-if="step === 'checkout'">
      <!-- CHECKOUT -->
      <b-container fluid class="text-left">
        <b-row class="mb-3">You're about to purchase MDAPP tokens. Please check your order and press the 'Buy'-button to complete.</b-row>
        <b-row align-h="between" class="justify-content-lg-center">
          <b-col lg="3" cols="auto" class="label">Pixels:</b-col><b-col lg="5" cols="8">{{ tokenQty * 100 }}</b-col>
          <div class="w-100"/>
          <b-col lg="3" cols="auto" class="label">Token quantity:</b-col>
          <b-col lg="5" cols="8">
            <template v-if="!isEditing">{{ tokenQty }} <a href="#" @click.prevent="isEditing = true"><edit3-icon class="ml-3"/></a></template>
            <template v-if="isEditing">
              <b-form-input id="tokenQtyInput" v-model="editedQty" type="number" size="sm" :required="true"/>
              <a href="#" @click.prevent="tokenQty = editedQty; isEditing = false" class="ml-2">apply</a>
            </template>
          </b-col>
          <div class="w-100"/>
          <b-col lg="3" cols="auto" class="label">Price per token:</b-col><b-col lg="5" cols="8">$100 ({{ (pixelPriceEth * 100).toFixed(8) }} ETH)</b-col>
          <div class="w-100"/>
          <b-col lg="3" cols="auto" class="label">Total cost:</b-col><b-col lg="5" cols="8">${{ (tokenQty * 100) }} ({{ cost.toFixed(8) }} ETH)</b-col>
          <div class="w-100"/>
          <b-col lg="3" cols="auto" class="label">Buy for:</b-col>
          <b-col lg="5" cols="8">
            <b-radio-group v-model="beneficiaryRadio" @input="changeBeneficiary" stacked>
              <b-radio value="self">Myself ({{ $store.getters.coinbaseShort }})</b-radio>
              <b-radio value="other">Other:
                <b-form-input v-model.trim="beneficiaryInput" :state="beneficiaryIsValid" id="beneficiaryInput" size="sm"
                              v-b-tooltip.focus title="Do NOT enter an exchange address!"
                              @focus.native="beneficiaryRadio = 'other'"
                              @change="changeBeneficiary" type="text" placeholder="Ethereum address (0x...)"/>
              </b-radio>
            </b-radio-group>
          </b-col>
        </b-row>
      </b-container>
    </template>
    <b-alert :show="hasError" variant="danger" class="mt-3">{{errorMsg}}</b-alert>
    <template slot="modal-footer">
      <b-button variant="outline-secondary" @click="hideModal">Cancel</b-button>
      <b-button variant="secondary" @click="previousStep" v-if="step !== 'tc'">Back</b-button>
      <b-button variant="success" :disabled="!hasConfirmed" @click="nextStep">{{primaryBtnText}}</b-button>
    </template>
  </b-modal>
</template>

<script>
import Raven from 'raven-js'
import Web3 from 'web3'
import { Edit3Icon } from 'vue-feather-icons'
import saleContract from '../util/interactions/saleContract'
import { newTransaction } from '../util/transaction'
import utils from '../util/utils'

var web3 = window.web3
web3 = new Web3(web3.currentProvider)

export default {
  name: 'modalBuy',
  components: {
    Edit3Icon
  },

  props: {
    id: String,
    selectedTokenQty: Number,
    pixelPriceEth: Number,
    buyPossible: Boolean
  },

  data () {
    return {
      acceptedTC: false,
      acceptedOrigin: false,
      beneficiary: this.$store.state.web3.coinbase,
      beneficiaryRadio: 'self',
      beneficiaryInput: '',
      beneficiaryIsValid: null,
      customTokenQty: null, // variable for computed var 'tokenQty'
      editedQty: this.selectedTokenQty, // variable for qty input field. Can contain invalid values
      errorMsg: '',
      hasError: false,
      isEditing: false,
      step: 'tc',
      primaryBtnText: 'Continue'
    }
  },

  computed: {
    hasConfirmed () {
      return (this.acceptedTC && this.acceptedOrigin)
    },
    cost () {
      // Total cost in ETH
      return ((this.pixelPriceEth * 1e8) * 100 * this.tokenQty) / 1e8
    },
    tokenQty: {
      get () {
        return this.customTokenQty === null ? Math.min(this.selectedTokenQty, this.$store.getters.tokensAvailable) : Math.min(this.customTokenQty, this.$store.getters.tokensAvailable)
      },
      set (newValue) {
        newValue = Math.floor(newValue)
        this.customTokenQty = newValue > this.$store.getters.tokensAvailable ? this.$store.getters.tokensAvailable : newValue
        this.editedQty = this.customTokenQty
        this.errorMsg = ''
        this.hasError = false
      }
    }
  },

  watch: {
    selectedTokenQty (newVal) {
      this.editedQty = newVal
    }
  },

  methods: {
    resetForm () {
      this.primaryBtnText = 'Continue'
      this.acceptedOrigin = false
      this.acceptedTC = false
      this.customTokenQty = null
      this.isEditing = false
      this.errorMsg = ''
      this.hasError = false
      this.beneficiaryRadio = 'self'
      this.beneficiaryInput = ''
      this.step = 'tc'
    },
    hideModal () {
      this.resetForm()
      this.$refs.buyModalRef.hide()
    },
    previousStep () {
      switch (this.step) {
        case 'checkout':
          this.resetForm()
      }
    },
    nextStep () {
      switch (this.step) {
        case 'tc':
          this.step = 'checkout'
          this.primaryBtnText = 'Buy'
          break
        case 'checkout':
          // Do some final checks
          if (this._validateBeneficiary() === false ||
            this._validateBalance() === false ||
            this._validateSupply() === false ||
            this._validateSaleOpen() === false) {
            break
          }

          // Get recruiter from referral code, if any.
          let recruiter = this.$route.query.r
          recruiter = recruiter ? utils.referral2Address(recruiter) : '0x0000000000000000000000000000000000000000'
          // Recruiter must not be purchaser or beneficiary.
          recruiter = (recruiter === this.$store.state.web3.coinbase || recruiter === this.beneficiary) ? '0x0000000000000000000000000000000000000000' : recruiter

          // Since the contract gets called async, the computed tokenQty value may change in the meantime.
          let requestedQty = this.tokenQty
          let requestedCost = this.cost

          saleContract.buy(this.beneficiary, requestedQty, requestedCost, recruiter)
            .then((txHash, err) => {
              if (err) {
                Raven.captureException(err)
                let msg = `${err.message.substr(0, 1).toUpperCase()}${err.message.substr(1)}`
                this.$swal({
                  type: 'error',
                  title: 'Error',
                  html: msg,
                  showConfirmButton: false
                })
                newTransaction(txHash, 'buyToken', {beneficiary: this.beneficiary, tokenQty: requestedQty, cost: requestedCost, error: msg}, 'error')
                this.hideModal()
              } else {
                this.$swal({
                  type: 'success',
                  title: 'Transaction sent',
                  html: `Track its progress on <a href="${this.$store.getters.blockExplorerBaseURL}/tx/${txHash}" target="_blank">etherscan.io</a> or at the top right of this site.`,
                  showConfirmButton: false,
                  onAfterClose: () => {
                    this.$emit('showTxLog')
                  }
                })
                newTransaction(txHash, 'buyToken', {beneficiary: this.beneficiary, tokenQty: requestedQty, cost: requestedCost}, 'pending')
                this.hideModal()
                // TODO: Print gift card if bought for 'other'
              }
            }).catch(e => {
              Raven.captureException(e)
              let msg = e.message
              if (msg.indexOf('User denied transaction signature') === -1) {
                this.$swal({
                  type: 'error',
                  title: 'Error',
                  html: `${msg.substr(0, 1).toUpperCase()}${msg.substr(1)}`,
                  showConfirmButton: false
                })
              }
              this.hideModal()
            })
          break
      }
    },

    changeBeneficiary () {
      if (this.beneficiaryRadio === 'self') {
        // Tokens go to active user
        this.beneficiaryIsValid = null
        this.beneficiary = this.$store.state.web3.coinbase
      } else {
        // Token will go to someone else
        // this.beneficiaryInput = this.beneficiaryInput.toLowerCase()
        if (!this.beneficiaryInput || !web3.isAddress(this.beneficiaryInput)) {
          // Either no foreign address given or invalid
          this.beneficiaryIsValid = false
        } else {
          // Address seems to be fine
          this.beneficiaryIsValid = true
          this.beneficiary = this.beneficiaryInput
        }
      }
    },

    _validateBeneficiary () {
      this.changeBeneficiary()
      return this.beneficiaryIsValid
    },

    _validateBalance () {
      if (this.$store.state.web3.balance.lt(web3.toBigNumber(web3.toWei(this.cost)))) {
        this.errorMsg = `Insufficient funds.`
        this.hasError = true
        return false
      }
      return true
    },

    _validateSupply () {
      if (this.tokenQty > this.$store.getters.tokensAvailable) {
        this.errorMsg = `We're sorry, only ${this.$store.getters.tokensAvailable} tokens are left.`
        this.hasError = true
        return false
      }
      return true
    },

    _validateSaleOpen () {
      if (!this.buyPossible) {
        this.errorMsg = `We're sorry, the MDAPP sale is currently not open. Please try again later.`
        this.hasError = true
        return false
      }
      return true
    }
  }
}
</script>

<style scoped>
  .feather {
    color: #343a40;
  }

  .scroll-box {
    background: #f4f4f4;
    border: 2px solid rgba(0, 0, 0, 0.1);
    height: 400px; /* maximum height of the box, feel free to change this! */
    padding: 15px;
    overflow-y: scroll;
  }

  .footer {
    color: #A0A0A0;
    font-size: 0.6rem;
  }

  #tokenQtyInput {
    width: 100px;
    display: inline-block !important;
  }

  #beneficiaryInput {
    width: 200px;
    display: inline-block !important;
  }

  .label {
    font-weight: bold;
  }
</style>
