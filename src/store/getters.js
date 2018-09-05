import state from './state'
import { NETWORKS } from '../util/constants/networks'
import Web3 from 'web3'

// By any reason, this file tries to access web3 first - even before main.js
let withMetamask = typeof window.web3 !== 'undefined'
if (withMetamask) {
  // Overwrite injected web3 (if any) with web3 1.0
  window.web3 = new Web3(window.web3.currentProvider)

  // Store a 2nd one to bypass MetaMask subscription restrictions.
  window.web3Watcher = new Web3(new Web3.providers.WebsocketProvider(process.env.WEB3_ENDPOINT))
} else {
  window.web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.WEB3_ENDPOINT))
}
window.web3.withMetamask = withMetamask
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

  pixelPriceWei () {
    if (state.ethusd === 0) {
      return 0
    }
    // ethusd comes in cents per ETH.
    // Rounding @see http://www.jacklmoore.com/notes/rounding-in-javascript/
    let rounded = Number(Math.ceil((100 / state.ethusd) + 'e17') + 'e-17')
    return web3.utils.toBN(web3.utils.toWei(rounded.toString()))
  },

  tokenPriceWei (state, getters) {
    return web3.utils.toBN(getters.pixelPriceWei).mul(web3.utils.toBN(100))
  },

  tokensAvailable () {
    return state.maxSupply - state.supply
  },

  untransferableTokens (state, getters) {
    if (!getters.transferAllowed) {
      // All tokens are locked until minting is finished.
      return state.balance ? state.balance.toNumber() : 0
    }
    return state.balance ? state.balance.sub(state.transferableTokens).toNumber() : 0
  },

  unlockedTokens () {
    return state.balance ? state.balance.sub(state.lockedTokens).toNumber() : 0
  },

  claimedPixels () {
    return state.lockedTokens ? state.lockedTokens.mul(web3.utils.toBN(100)).toNumber() : 0
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
    return state.oracleFunds ? Number(web3.utils.fromWei(state.oracleFunds)).toFixed(8) : 0
  },

  withdrawableBalanceEth () {
    return state.withdrawableBalance ? Number(web3.utils.fromWei(state.withdrawableBalance)).toFixed(8) : 0
  },

  withdrawableBalanceEthShort () {
    return state.withdrawableBalance ? Number(web3.utils.fromWei(state.withdrawableBalance)).toFixed(3) : 0
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
