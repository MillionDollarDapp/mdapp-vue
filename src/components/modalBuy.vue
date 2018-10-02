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
          <terms-and-conditions/>
        </b-row>

        <b-row class="mb-2">
          <b-col>
            <b-form-checkbox v-model="acceptedTC">
              I confirm that I have read and understand the Terms and Conditions and the White Paper and that I
              expressly accept all terms, conditions, obligations, affirmations, representations and warranties described in
              these documents and agree to be bound by them.*
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
          <b-col>* BY PURCHASING TOKENS, YOU ACKNOWLEDGE, AGREE AND CERTIFY THAT YOU ARE PURCHASING TOKENS DURING THE SALE
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
          <b-col lg="3" cols="auto" class="label">Price per token:</b-col><b-col lg="5" cols="8">$100 ({{ tokenPriceETH.toFixed(8) }} ETH)</b-col>
          <div class="w-100"/>
          <b-col lg="3" cols="auto" class="label">Total cost:</b-col><b-col lg="5" cols="8">${{ (tokenQty * 100) }} ({{ costEth.toFixed(8) }} ETH)</b-col>
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
import { Edit3Icon } from 'vue-feather-icons'
import TermsAndConditions from '@/components/termsAndConditions'
import saleContract from '../util/interactions/saleContract'
import { newTransaction } from '../util/transaction'
import utils from '../util/utils'
import web3Manager from '../util/web3Manager'

export default {
  name: 'modalBuy',
  components: {
    Edit3Icon,
    TermsAndConditions
  },

  props: {
    id: String,
    selectedTokenQty: Number,
    pixelPriceWei: Number,
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
    tokenPriceETH () {
      return Number(this.web3.utils.fromWei(this.$store.getters.tokenPriceWei))
    },
    costEth () {
      // Total cost in ETH
      return Number(this.web3.utils.fromWei(this.$store.getters.pixelPriceWei.mul(this.web3.utils.toBN(100 * this.tokenQty)), 'ether'))
    },
    cost () {
      // Total cost in Wei
      return this.$store.getters.pixelPriceWei.mul(this.web3.utils.toBN(100 * this.tokenQty))
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
    },
    web3 () {
      return web3Manager.getInstance()
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
    async nextStep () {
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
          let requestedCostEth = this.costEth
          let requestedCostWei = this.cost

          try {
            let [error, tx] = await saleContract.buy(this.beneficiary, requestedQty, requestedCostWei, recruiter)
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
                newTransaction(txHash, 'buyToken', {beneficiary: this.beneficiary, tokenQty: requestedQty, cost: requestedCostEth}, 'pending')
                this.hideModal()
                // TODO: Print gift card if bought for 'other'
              })
              .on('error', error => {
                throw error
              })
          } catch (error) {
            let msg = error.message
            if (msg.indexOf('User denied transaction signature') === -1) {
              console.error('checkout:', error)
              Raven.captureException(error)

              this.$swal({
                type: 'error',
                title: 'Error',
                html: `${msg.substr(0, 1).toUpperCase()}${msg.substr(1)}`,
                heightAuto: false,
                showConfirmButton: false
              })
            }
            this.hideModal()
          }
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
        if (!this.beneficiaryInput || !this.web3.utils.isAddress(this.beneficiaryInput)) {
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
      if (!this.$store.state.web3.balance || this.$store.state.web3.balance.lt(this.cost)) {
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
