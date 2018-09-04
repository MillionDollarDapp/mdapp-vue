<template>
  <div class="my-4 mx-auto p-3 border border-secondary rounded shadow-sm" align-h="center">
    <h2>Admin Panel</h2>
    <hr/>

      <!--Contract Owner-->
    <template v-if="this.web3.coinbase === this.owner">
      <b-card-group deck>
        <b-card header="Supply">
          <p class="card-text">
            {{ this.$store.state.supply }}
          </p>
        </b-card>

        <b-card header="Withdrawable">
          <p class="card-text">
            {{ this.$store.getters.withdrawableBalanceEth }} ETH<br />
            ${{ Number(this.$store.getters.withdrawableBalanceEth * this.$store.state.ethusd / 100).toFixed(2) }}
          </p>
        </b-card>

        <b-card header="Transfer enabled">
          <p class="card-text">
            {{ transferIsAllowed }}
          </p>
          <div v-if="!this.$store.getters.transferAllowed"><b-button variant="success" size="sm" v-b-modal.allowTransferConfirmation>Allow</b-button></div>
        </b-card>

        <b-card header="Grant bounty">
          <div class="d-flex flex-column">
            <div class="d-flex justify-content-between">
              <label for="bountyBeneficiary">Beneficiary:</label>
              <b-form-input v-model.trim="bountyBeneficiary" id="bountyBeneficiary" size="sm"
                            v-b-tooltip.focus title="Do NOT enter an exchange address!"
                            type="text" placeholder="Ethereum address (0x...)"/>
            </div>

            <div class="d-flex justify-content-between">
              <label for="bountyTokens">Tokens:</label>
              <b-form-input v-model="bountyTokens" id="bountyTokens" size="sm" type="number"/>
            </div>

            <div class="d-flex justify-content-between">
              <label for="bountyReason">Reason:</label>
              <b-form-input v-model.trim="bountyReason" id="bountyReason" size="sm" type="text"/>
            </div>

            <b-button variant="success" size="sm" :disabled="!bountyTokens || !bountyReason || !bountyBeneficiary" @click="grantBounty">Grant bounty</b-button>
          </div>
        </b-card>

        <b-card header="Oracle active">
          <p class="card-text">
            {{ oracleActive }}
          </p>

          <div class="d-flex justify-content-between" v-if="!this.oracleActive">
            <b-form-input v-model="loadOracleFunds" type="number" size="sm" placeholder="Funds in ETH"/>
            <b-button variant="success" size="sm" @click="activateOracle">Activate oracle</b-button>
          </div>
        </b-card>
      </b-card-group>

      <b-card-group deck class="mt-4">
        <b-card header="Oracle gas limit">
          <p class="card-text">
            {{ oracleGasLimit }}
          </p>

          <div class="d-flex justify-content-between">
            <b-form-input v-model="newGasLimit" type="number" size="sm"/>
            <b-button variant="success" size="sm" @click="setGasLimit">Set gas limit</b-button>
          </div>
        </b-card>

        <b-card header="Oracle gas price">
          <p class="card-text">
            {{ oracleGasPrice / 1000000000 }} gwei
          </p>

          <div class="d-flex justify-content-between">
            <b-form-input v-model="newGasPrice" type="number" size="sm" placeholder="in gwei"/>
            <b-button variant="success" class="mt-2" size="sm" @click="setGasPrice">Set gas price</b-button>
          </div>
        </b-card>

        <b-card header="Oracle interval">
          <p class="card-text">
            {{ oracleInterval }} seconds
          </p>

          <div class="d-flex justify-content-between">
            <b-form-input v-model="newInterval" type="number" size="sm" placeholder="in seconds"/>
            <b-button variant="success" class="mt-2" size="sm" @click="setOracleInterval">Set interval</b-button>
          </div>
          <!--<div class="d-flex justify-content-between">-->
            <!--<b-form-input v-model="newQueryString" type="text" size="sm"/>-->
            <!--<b-button variant="success" class="mt-2" size="sm" @click="setOracleQueryString">Set Query String</b-button>-->
          <!--</div>-->
        </b-card>

        <b-card header="ETH/USD rate">
          <p class="card-text">
            ${{ this.$store.state.ethusd / 100 }}<br />
            <template v-if="this.$store.state.oracleLastUpdate">
              Last update: {{ this.dateFormatter.format(new Date(this.$store.state.oracleLastUpdate)) }}
            </template>
          </p>
          <!--<div class="d-flex justify-content-between">-->
            <!--<b-form-input v-model="newETHUSD" type="number" size="sm" placeholder="in cents"/>-->
            <!--<b-button variant="success" class="mt-2" size="sm" @click="setETHUSD">Set ETH/USD</b-button>-->
          <!--</div>-->
        </b-card>

        <b-card header="Oracle funds">
          <p class="card-text">
            {{ this.$store.getters.oracleFundsEth }} ETH
          </p>

          <b-button variant="success" size="sm" @click="withdrawOracleFunds" v-if="this.web3.coinbase === this.owner">Withdraw and disable</b-button>
        </b-card>
      </b-card-group>
    </template>

      <!--Withdrawal wallet-->
      <template v-if="this.web3.coinbase === this.wallet">
        <b-card-group deck>
          <b-card header="Withdrawable">
            <p class="card-text">
              {{ this.$store.getters.withdrawableBalanceEth }} ETH<br />
              ${{ Number(this.$store.getters.withdrawableBalanceEth * this.$store.state.ethusd / 100).toFixed(2) }}
            </p>

            <b-button variant="success" size="sm" @click="withdrawSaleIncome" :disabled="typeof this.withdrawableBalance !== 'object' || this.withdrawableBalance === 0 || this.withdrawableBalance.lt(1)">Withdraw</b-button>
          </b-card>
        </b-card-group>
      </template>

    <!-- Allow-Transfer confirmation modal -->
    <b-modal id="allowTransferConfirmation" title="Are you sure?" @ok="forceAllowTransfer">
      <p>This allows all tokens to be moved even if minting has not been finished.</p>
      <p><strong>THIS CANNOT BE UNDONE!</strong></p>
    </b-modal>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import mdappContract from '../util/interactions/mdappContract'
import saleContract from '../util/interactions/saleContract'
import { newTransaction } from '../util/transaction'
import utils from '../util/utils'
import Web3 from 'web3'
import Raven from 'raven-js'

var web3 = window.web3
web3 = new Web3(web3.currentProvider)

export default {
  name: 'AdminPanel',
  data () {
    return {
      loadOracleFunds: null,
      newGasPrice: null,
      newGasLimit: null,
      newInterval: null,
      newQueryString: null,
      newETHUSD: null,

      bountyBeneficiary: null,
      bountyTokens: null,
      bountyReason: null,

      dateFormatter: new Intl.DateTimeFormat(utils.getUserLocale(), {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false})
    }
  },

  computed: {
    ...mapState(['web3', 'owner', 'wallet', 'oracleActive', 'oracleFunds', 'oracleGasLimit', 'oracleGasPrice', 'oracleInterval', 'withdrawableBalance']),
    transferIsAllowed () {
      if (this.$store.getters.transferAllowed) {
        return 'Yes'
      }
      return 'No'
    }
  },

  methods: {
    grantBounty () {
      // Just do a weak validation for admin
      if (this.bountyBeneficiary && web3.isAddress(this.bountyBeneficiary) &&
        this.bountyTokens > 0 && this.bountyReason) {
        saleContract.grantBounty(this.bountyBeneficiary, this.bountyTokens, this.bountyReason).then((txHash, err) => {
          if (err) {
            let msg = `${err.message.substr(0, 1).toUpperCase()}${err.message.substr(1)}`
            this.$swal({
              type: 'error',
              title: 'Error',
              html: msg,
              showConfirmButton: false
            })
            newTransaction(txHash, 'grantBounty', {beneficiary: this.bountyBeneficiary, tokens: this.bountyTokens, reason: this.bountyReason, error: msg}, 'error')
          } else {
            this.$swal({
              type: 'success',
              title: 'Transaction sent',
              html: `Transfer is now allowed.<br />Track tx progress on <a href="${this.$store.getters.blockExplorerBaseURL}/tx/${txHash}" target="_blank">etherscan.io</a> or at the top right of this site.`,
              showConfirmButton: false
            })

            newTransaction(txHash, 'grantBounty', {beneficiary: this.bountyBeneficiary, tokens: this.bountyTokens, reason: this.bountyReason}, 'pending')
            this.bountyBeneficiary = null
            this.bountyTokens = null
            this.bountyReason = null
          }
        }).catch(e => {
          Raven.captureException(e)
        })
      } else {
        this.$swal({
          type: 'error',
          title: 'Error',
          html: 'Input validation failed.',
          showConfirmButton: false
        })
      }
    },

    withdrawBalance () {
      saleContract.withdrawBalance().then((txHash, err) => {
        if (err) {
          let msg = `${err.message.substr(0, 1).toUpperCase()}${err.message.substr(1)}`
          this.$swal({
            type: 'error',
            title: 'Error',
            html: msg,
            showConfirmButton: false
          })
          newTransaction(txHash, 'withdrawBalance', {error: msg}, 'error')
        } else {
          this.$swal({
            type: 'success',
            title: 'Transaction sent',
            html: `Transfer is now allowed.<br />Track tx progress on <a href="${this.$store.getters.blockExplorerBaseURL}/tx/${txHash}" target="_blank">etherscan.io</a> or at the top right of this site.`,
            showConfirmButton: false
          })

          newTransaction(txHash, 'withdrawBalance', {}, 'pending')
        }
      }).catch(e => {
        Raven.captureException(e)
      })
    },

    withdrawOracleFunds () {
      saleContract.withdrawOracleFunds().then((txHash, err) => {
        if (err) {
          let msg = `${err.message.substr(0, 1).toUpperCase()}${err.message.substr(1)}`
          this.$swal({
            type: 'error',
            title: 'Error',
            html: msg,
            showConfirmButton: false
          })
          newTransaction(txHash, 'withdrawOracleFunds', {error: msg}, 'error')
        } else {
          this.$swal({
            type: 'success',
            title: 'Transaction sent',
            html: `Transfer is now allowed.<br />Track tx progress on <a href="${this.$store.getters.blockExplorerBaseURL}/tx/${txHash}" target="_blank">etherscan.io</a> or at the top right of this site.`,
            showConfirmButton: false
          })

          newTransaction(txHash, 'withdrawOracleFunds', {}, 'pending')
        }
      }).catch(e => {
        Raven.captureException(e)
      })
    },

    activateOracle () {
      saleContract.activateOracle(this.loadOracleFunds).then((txHash, err) => {
        if (err) {
          let msg = `${err.message.substr(0, 1).toUpperCase()}${err.message.substr(1)}`
          this.$swal({
            type: 'error',
            title: 'Error',
            html: msg,
            showConfirmButton: false
          })
          newTransaction(txHash, 'activateOracle', {funds: this.loadOracleFunds, error: msg}, 'error')
        } else {
          this.$swal({
            type: 'success',
            title: 'Transaction sent',
            html: `Transfer is now allowed.<br />Track tx progress on <a href="${this.$store.getters.blockExplorerBaseURL}/tx/${txHash}" target="_blank">etherscan.io</a> or at the top right of this site.`,
            showConfirmButton: false
          })

          newTransaction(txHash, 'activateOracle', {funds: this.loadOracleFunds}, 'pending')
          this.loadOracleFunds = null
        }
      }).catch(e => {
        Raven.captureException(e)
      })
    },

    setGasPrice () {
      saleContract.setOracleGasPrice(this.newGasPrice).then((txHash, err) => {
        if (err) {
          let msg = `${err.message.substr(0, 1).toUpperCase()}${err.message.substr(1)}`
          this.$swal({
            type: 'error',
            title: 'Error',
            html: msg,
            showConfirmButton: false
          })
          newTransaction(txHash, 'setOracleGasPrice', {price: this.newGasPrice, error: msg}, 'error')
        } else {
          this.$swal({
            type: 'success',
            title: 'Transaction sent',
            html: `Transfer is now allowed.<br />Track tx progress on <a href="${this.$store.getters.blockExplorerBaseURL}/tx/${txHash}" target="_blank">etherscan.io</a> or at the top right of this site.`,
            showConfirmButton: false
          })

          newTransaction(txHash, 'setOracleGasPrice', {price: this.newGasPrice}, 'pending')
          this.newGasPrice = null
        }
      }).catch(e => {
        Raven.captureException(e)
      })
    },

    setGasLimit () {
      saleContract.setOracleGasLimit(this.newGasLimit).then((txHash, err) => {
        if (err) {
          let msg = `${err.message.substr(0, 1).toUpperCase()}${err.message.substr(1)}`
          this.$swal({
            type: 'error',
            title: 'Error',
            html: msg,
            showConfirmButton: false
          })
          newTransaction(txHash, 'setOracleGasLimit', {limit: this.newGasLimit, error: msg}, 'error')
        } else {
          this.$swal({
            type: 'success',
            title: 'Transaction sent',
            html: `Transfer is now allowed.<br />Track tx progress on <a href="${this.$store.getters.blockExplorerBaseURL}/tx/${txHash}" target="_blank">etherscan.io</a> or at the top right of this site.`,
            showConfirmButton: false
          })

          newTransaction(txHash, 'setOracleGasLimit', {limit: this.newGasLimit}, 'pending')
          this.newGasLimit = null
        }
      }).catch(e => {
        Raven.captureException(e)
      })
    },

    setOracleInterval () {
      saleContract.setOracleInterval(this.newInterval).then((txHash, err) => {
        if (err) {
          let msg = `${err.message.substr(0, 1).toUpperCase()}${err.message.substr(1)}`
          this.$swal({
            type: 'error',
            title: 'Error',
            html: msg,
            showConfirmButton: false
          })
          newTransaction(txHash, 'setOracleInterval', {interval: this.newInterval, error: msg}, 'error')
        } else {
          this.$swal({
            type: 'success',
            title: 'Transaction sent',
            html: `Transfer is now allowed.<br />Track tx progress on <a href="${this.$store.getters.blockExplorerBaseURL}/tx/${txHash}" target="_blank">etherscan.io</a> or at the top right of this site.`,
            showConfirmButton: false
          })

          newTransaction(txHash, 'setOracleInterval', {interval: this.newInterval}, 'pending')
          this.newInterval = null
        }
      }).catch(e => {
        Raven.captureException(e)
      })
    },

    setOracleQueryString () {
      saleContract.setOracleQueryString(this.newQueryString).then((txHash, err) => {
        if (err) {
          let msg = `${err.message.substr(0, 1).toUpperCase()}${err.message.substr(1)}`
          this.$swal({
            type: 'error',
            title: 'Error',
            html: msg,
            showConfirmButton: false
          })
          newTransaction(txHash, 'setOracleString', {queryString: this.newQueryString, error: msg}, 'error')
        } else {
          this.$swal({
            type: 'success',
            title: 'Transaction sent',
            html: `Transfer is now allowed.<br />Track tx progress on <a href="${this.$store.getters.blockExplorerBaseURL}/tx/${txHash}" target="_blank">etherscan.io</a> or at the top right of this site.`,
            showConfirmButton: false
          })

          newTransaction(txHash, 'setOracleQueryString', {queryString: this.newQueryString}, 'pending')
          this.newQueryString = null
        }
      }).catch(e => {
        Raven.captureException(e)
      })
    },

    setETHUSD () {
      saleContract.setETHUSD(this.newETHUSD).then((txHash, err) => {
        if (err) {
          let msg = `${err.message.substr(0, 1).toUpperCase()}${err.message.substr(1)}`
          this.$swal({
            type: 'error',
            title: 'Error',
            html: msg,
            showConfirmButton: false
          })
          newTransaction(txHash, 'setEthUsd', {ethusd: this.newETHUSD, error: msg}, 'error')
        } else {
          this.$swal({
            type: 'success',
            title: 'Transaction sent',
            html: `Transfer is now allowed.<br />Track tx progress on <a href="${this.$store.getters.blockExplorerBaseURL}/tx/${txHash}" target="_blank">etherscan.io</a> or at the top right of this site.`,
            showConfirmButton: false
          })

          newTransaction(txHash, 'setEthUsd', {ethusd: this.newETHUSD}, 'pending')
          this.newETHUSD = null
        }
      }).catch(e => {
        Raven.captureException(e)
      })
    },

    forceAllowTransfer () {
      mdappContract.allowTransfer().then((txHash, err) => {
        if (err) {
          let msg = `${err.message.substr(0, 1).toUpperCase()}${err.message.substr(1)}`
          this.$swal({
            type: 'error',
            title: 'Error',
            html: msg,
            showConfirmButton: false
          })
          newTransaction(txHash, 'allowTransfer', {error: msg}, 'error')
        } else {
          this.$swal({
            type: 'success',
            title: 'Transaction sent',
            html: `Transfer is now allowed.<br />Track tx progress on <a href="${this.$store.getters.blockExplorerBaseURL}/tx/${txHash}" target="_blank">etherscan.io</a> or at the top right of this site.`,
            showConfirmButton: false
          })

          newTransaction(txHash, 'allowTransfer', {}, 'pending')
        }
      }).catch(e => {
        Raven.captureException(e)
      })
    }
  }
}
</script>

<style scoped>
</style>
