<template>
  <li>
    <div class="tail"/>
    <div class="status pending" v-if="tx.status === 'pending'"><clock-icon/></div>
    <div class="status confirmed" v-if="tx.status === 'confirmed'"><check-circle-icon v-b-tooltip.hover :title="`${confirmations}/${requiredConfirmations} confirmations`"/></div>
    <div class="status completed" v-if="tx.status === 'completed'"><check-circle-icon/></div>
    <div class="status error" v-if="tx.status === 'error'"><x-circle-icon/></div>
    <div class="desc">{{ tx.desc }}</div>
    <div class="notice" v-if="tx.status === 'confirmed' || tx.status === 'completed'">
      <a :href="`${this.$store.getters.blockExplorerBaseURL}/tx/${tx.hash}`" target="_blank" v-b-tooltip.hover title="See on Etherscan">
        Confirmed at block #{{ tx.block }} <external-link-icon/>
      </a>
    </div>
    <div class="notice" v-if="tx.status === 'pending'">Waiting to get mined into a block.</div>
    <div class="notice" v-if="tx.status === 'error'">{{ tx.error }}</div>
  </li>
</template>

<script>
import { CheckCircleIcon, ClockIcon, ExternalLinkIcon, XCircleIcon } from 'vue-feather-icons'

export default {
  name: 'TxItem',
  props: [
    'tx',
    'trigger'
  ],

  components: {
    CheckCircleIcon,
    ClockIcon,
    ExternalLinkIcon,
    XCircleIcon
  },

  data () {
    return {
      requiredConfirmations: process.env.CONFIRMATIONS
    }
  },

  computed: {
    confirmations () {
      return this.$store.state.web3.block - this.tx.block + 1
    }
  },

  watch: {
    trigger () {
      // Update this component when the trigger fires.
      this.$forceUpdate()
    }
  }
}
</script>

<style scoped lang="scss">
  @import "~bootstrap/scss/bootstrap.scss";

  li {
    position: relative;
    padding: 0 0 20px;
    list-style: none;
  }

  .tail {
    border-left: 2px solid #e8e8e8;
    height: 100%;
    left: 4px;
    position: absolute;
    top: 14px;
  }

  li:last-child .tail {
    display: none;
  }

  .status {
    border: 0;
    border-radius: 0;
    height: auto;
    left: 5px;
    top: 5.5px;
    line-height: 1;
    margin-top: 0;
    padding: 3px 1px;
    position: absolute;
    text-align: center;
    transform: translate(-50%,-50%);
    width: auto;
    background-color: #fff;
  }
  .status.pending svg,
  .status.confirmed svg {
    color: $yellow;
  }

  .status.completed svg {
    color: $green;
  }

  .status.error svg {
    color: $red;
  }

  .desc {
    margin: 0 0 0 20px;
    position: relative;
    top: -5px;
    font-size: 0.9rem;
    white-space: normal;
  }

  .notice {
    font-size: 0.75rem;
    position: relative;
    top: -5px;
    margin: 0 0 0 20px;
    height: 1rem;

    a {
      line-height: 1rem;
      color: inherit;
      text-decoration: none !important;
      transition: color .3s;
      display: inline-block;
      height: 1rem;

      svg {
        display: none;
        width: 12px;
        vertical-align: -3px;
        height: 1rem;
      }
    }
  }

  .notice a:hover,
  .notice a:hover svg {
    color: $blue;
  }
  .notice a:hover svg {
    display: inline-block;
  }

</style>
