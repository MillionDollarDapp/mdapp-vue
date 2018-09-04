import state from './state'
import { NETWORKS } from '../util/constants/networks'
import Web3 from 'web3'

if (typeof window.web3 === 'undefined') {
  window.web3 = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_ENDPOINT))
  window.web3.isDelivered = true
}
let web3 = window.web3

let getters = {
  // Shorted version of users Ethereum address
  coinbaseShort () {
    if (state.web3.coinbase) {
      return state.web3.coinbase.substr(0, 12) + '...'
    } else {
      return state.web3.coinbase
    }
  },

  pixelPriceEth () {
    if (state.ethusd === 0) {
      return 0
    }
    // ethusd comes in cents per ETH.
    return 100 / state.ethusd
  },

  tokensAvailable () {
    return state.maxSupply - state.supply
  },

  untransferableTokens (state, getters) {
    if (!getters.transferAllowed) {
      // All tokens are locked until minting is finished.
      return state.balance
    }
    return state.balance - state.transferableTokens
  },

  unlockedTokens () {
    return state.balance - state.lockedTokens
  },

  claimedPixels () {
    return state.lockedTokens * 100
  },

  // Transfer of token is allowed when either minting is finished or it's explicitly allowed by the contract owner.
  transferAllowed () {
    return state.mintingFinished || state.forceTransferEnable
  },

  // For navbar indicator
  hasPendingTx () {
    return state.trigger.txWatch && state.txWatchlist.size > 0
  },

  oracleFundsEth () {
    return Number(web3.fromWei(state.oracleFunds)).toFixed(8)
  },

  withdrawableBalanceEth () {
    return Number(web3.fromWei(state.withdrawableBalance)).toFixed(8)
  },

  withdrawableBalanceEthShort () {
    return Number(web3.fromWei(state.withdrawableBalance)).toFixed(3)
  },

  currentHelperProgress () {
    let step = 0
    let progress = state.helperProgress
    for (let i = progress.length - 1; i >= 0; i--) {
      if (progress[i]) {
        step = i + 1
        break
      }
    }

    return step
  },

  blockExplorerBaseURL () {
    if (state.web3.networkId && NETWORKS[state.web3.networkId]) {
      return NETWORKS[state.web3.networkId].blockexplorerBaseURL
    }
    return '#'
  }
}
export default getters
