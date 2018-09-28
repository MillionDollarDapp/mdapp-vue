<template>
  <b-modal id="modalReferral" ref="referralModalRef" size="lg" hide-footer centered v-on:hide="resetForm">
    <template slot="modal-title">
      <h3>Create referral code</h3>
    </template>

    <div class="text-left">
      <p>Share your referral code with your family, friends and followers. You'll get <span class="font-weight-bold">10% of all Ether</span> spent through your
      code! To withdraw your balance you need to unlock MetaMask with the account entered below.</p>

      <div class="d-flex flex-column">
        <div class="d-flex justify-content-between align-items-end">
          <div class="label pr-5">Profiting Ethereum address:</div>
          <div class="value flex-grow-1">
            <b-form-input id="referralAddressInput" class="ml-auto" v-model="addressInput" type="text" size="sm" :state="addressValid" v-b-tooltip.focus title="Do NOT enter an exchange address!"
                          placeholder="Ethereum address (0x...)"/>
          </div>
        </div>
        <div v-if="hasError"><b-alert show variant="danger" class="mt-3 mb-0">{{ errorMsg }}</b-alert></div>
        <div class="d-flex align-items-end mt-3"><div class="ml-auto"><b-button variant="success" size="sm" @click="createBtnClicked">Create</b-button></div></div>
      </div>

      <!--Result-->
      <template v-if="referral">
        <span class="font-weight-bold">Your referral code:</span><br />
        {{ referral }} <file-text-icon id="copyCreatedReferralBtn" class="link ml-3" v-b-tooltip.hover title="Copy to clipboard" @click="copyToClipboard"/>

        <div id="copyPlaceholder" style="width: 100%;"></div>
      </template>
    </div>
  </b-modal>
</template>

<script>
import utils from '../util/utils'
import web3Manager from '../util/web3Manager'
import { FileTextIcon } from 'vue-feather-icons'

export default {
  name: 'modalReferral',
  components: {
    FileTextIcon
  },

  data () {
    return {
      addressInput: '',
      addressValid: null,
      errorMsg: '',
      hasError: false,
      referral: ''
    }
  },

  computed: {
    web3 () {
      return web3Manager.getInstance()
    }
  },

  methods: {
    resetForm () {
      // Called on the hide-event (see template)
      this.addressInput = ''
      this.addressValid = null
      this.errorMsg = ''
      this.hasError = false
      this.referral = ''
    },
    hideModal () {
      this.$refs.referralModalRef.hide()
    },

    createBtnClicked () {
      if (!this._validateAddress()) {
        console.log('error')
        this.addressValid = false
        this.errorMsg = 'Address input invalid or empty.'
        this.hasError = true
        return
      }

      this.addressValid = null
      this.hasError = false

      let prefix = window.location.href
      if (prefix.indexOf('?') !== -1) {
        prefix = prefix.substr(0, prefix.indexOf('?'))
      }
      prefix += '?r='

      this.referral = prefix + utils.address2Referral(this.addressInput)
    },

    _validateAddress () {
      if (!this.addressInput || !this.web3.utils.isAddress(this.addressInput)) {
        return false
      }
      return true
    },

    copyToClipboard () {
      this.$root.$emit('bv::hide::tooltip', 'copyCreatedReferralBtn')
      let el = document.getElementById('copyCreatedReferralBtn')
      let tooltipText = el.getAttribute('data-original-title')
      let placeholder = document.getElementById('copyPlaceholder')

      if (window.clipboardData && window.clipboardData.setData) {
        // IE specific code path to prevent textarea being shown while dialog is visible.
        window.clipboardData.setData('Text', this.referral)

        el.setAttribute('data-original-title', 'Copied!')
        this.$root.$emit('bv::show::tooltip', 'copyCreatedReferralBtn')
        setTimeout(() => {
          this.$root.$emit('bv::hide::tooltip', 'copyCreatedReferralBtn')
          el.setAttribute('data-original-title', tooltipText)
        }, 1000)
      } else if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
        let textarea = document.createElement('textarea')
        textarea.textContent = this.referral
        textarea.style.position = 'fixed' // Prevent scrolling to bottom of page in MS Edge.
        placeholder.appendChild(textarea)
        textarea.select()

        try {
          document.execCommand('copy') // Security exception may be thrown by some browsers.

          el.setAttribute('data-original-title', 'Copied!')
          this.$root.$emit('bv::show::tooltip', 'copyCreatedReferralBtn')
          setTimeout(() => {
            this.$root.$emit('bv::hide::tooltip', 'copyCreatedReferralBtn')
            el.setAttribute('data-original-title', tooltipText)
          }, 1000)
        } catch (e) {
          return false
        } finally {
          placeholder.removeChild(textarea)
        }
      }
    }
  }
}
</script>

<style scoped>
  #referralAddressInput {
    max-width: 370px;
  }

  .label {
    font-weight: 700;
  }

  .link {
    cursor: pointer;
  }

  svg {
    color: inherit;
  }
</style>
