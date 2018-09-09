import state from './state'
import { NETWORKS } from '../util/constants/networks'
import web3Manager from '../util/web3Manager'

/***********
 * Getters *
 * *********/

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
    let web3 = web3Manager.getInstance()
    // ethusd comes in cents per ETH.
    // Rounding @see http://www.jacklmoore.com/notes/rounding-in-javascript/
    let rounded = Number(Math.ceil((100 / state.ethusd) + 'e17') + 'e-17')
    return web3.utils.toBN(web3.utils.toWei(rounded.toString()))
  },

  tokenPriceWei (state, getters) {
    let web3 = web3Manager.getInstance()
    return web3.utils.toBN(getters.pixelPriceWei).mul(web3.utils.toBN(100))
  },

  tokensAvailable () {
    return state.maxSupply - state.supply
  },

  untransferableTokens (state, getters) {
    if (!getters.transferAllowed) {
      // All tokens are locked until minting is finished.
      return state.balance ? state.balance.toNumber() : null
    }
    return state.balance ? state.balance.sub(state.transferableTokens).toNumber() : null
  },

  unlockedTokens () {
    return state.balance !== null && state.lockedTokens !== null ? state.balance.sub(state.lockedTokens).toNumber() : null
  },

  claimedPixels () {
    let web3 = web3Manager.getInstance()
    return state.lockedTokens !== null ? state.lockedTokens.mul(web3.utils.toBN(100)).toNumber() : null
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
    let web3 = web3Manager.getInstance()
    return state.oracleFunds ? Number(web3.utils.fromWei(state.oracleFunds)).toFixed(8) : 0
  },

  contractFundsEth () {
    let web3 = web3Manager.getInstance()
    return state.contractFunds ? Number(web3.utils.fromWei(state.contractFunds)).toFixed(8) : 0
  },

  withdrawableBalanceEth () {
    let web3 = web3Manager.getInstance()
    return state.withdrawableBalance ? Number(web3.utils.fromWei(state.withdrawableBalance)).toFixed(8) : 0
  },

  withdrawableBalanceEthShort () {
    let web3 = web3Manager.getInstance()
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
