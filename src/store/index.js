import Vue from 'vue'
import Vuex from 'vuex'
import state from './state'
import getters from './getters'
import web3Manager from '../util/web3Manager'
import pollSaleContract from '../util/pollSaleContract'
import pollTokenContract from '../util/pollTokenContract'
import pollMdappContract from '../util/pollMdappContract'
import { getSaleContract, initSaleContract } from '../util/getSaleContract'
import getTokenContract from '../util/getTokenContract'
import { getMdappContract, initMdappContract } from '../util/getMdappContract'
import filters from '../util/filters/filters'
import utils from '../util/utils'

Vue.use(Vuex)

export const store = new Vuex.Store({
  strict: true,
  state,
  getters,
  mutations: {
    setWeb3Instance (state, payload) {
      state.web3.web3Instance = () => payload.web3
      state.web3.isInjected = payload.injected
      state.web3.networkId = payload.networkId
      state.trigger.web3Instance++
    },
    setWeb3Watcher (state, payload) {
      state.web3.web3Watcher = () => payload
      state.trigger.web3Watcher++
    },
    setConnectionState (state, payload) {
      state.web3.connectionState = payload
    },
    setWeb3Data (state, payload) {
      let web3Copy = state.web3
      web3Copy.coinbase = payload.coinbase
      web3Copy.networkId = payload.networkId
      web3Copy.block = payload.block

      if (payload.coinbase) {
        web3Copy.balance = payload.balance
        web3Copy.balanceEth = parseFloat(payload.balanceEth)
      }
      state.web3 = web3Copy
      state.trigger.web3Data++
    },
    pollWeb3Instance (state, payload) {
      let oldCoinbase = state.web3.coinbase
      let coinbaseChanged = payload.coinbase !== oldCoinbase

      if (payload.hasOwnProperty('coinbase')) {
        state.web3.balance = payload.balance
        state.web3.balanceEth = parseFloat(payload.balanceEth)
        state.web3.gasPrice = (payload.gasPrice * (1.1 * 10) / 10)
      }
      state.web3.coinbase = payload.coinbase
      state.web3.block = payload.block

      if (payload.hasOwnProperty('oracleFunds')) {
        state.oracleFunds = payload.oracleFunds
      }

      if (coinbaseChanged) {
        state.transactions.clear()
        state.txWatchlist.clear()
        state.transferableTokens = null
        state.lockedTokens = null

        // Reset helper progress for mdapp, claim and upload
        Vue.set(state.helperProgress, 3, false)
        Vue.set(state.helperProgress, 4, false)
        Vue.set(state.helperProgress, 5, false)

        // Reinitialize user if it changed
        if (oldCoinbase) filters.initUser()
      }
    },
    // Contract registration
    registerSaleContractInstance (state, payload) {
      state.saleContractInstance = !payload[0] ? null : () => payload[0]
      state.saleContractInstanceWatcher = !payload[1] ? null : () => payload[1]
      state.trigger.sale++
    },
    registerMdappContractInstance (state, payload) {
      state.mdappContractInstance = !payload[0] ? null : () => payload[0]
      state.mdappContractInstanceWatcher = !payload[1] ? null : () => payload[1]
      state.trigger.mdapp++
    },
    registerTokenContractInstance (state, payload) {
      state.tokenContractInstance = !payload ? null : () => payload
      state.trigger.token++
    },
    unsetContracts (state) {
      state.saleContractInstance = null
      state.mdappContractInstance = null
      state.tokenContractInstance = null
    },

    // Contract constants initialization
    initSaleContract (state, payload) {
      state.startTimePresale = payload.startTimePresale
      state.endTimePresale = payload.endTimePresale
      state.startTimeSale = payload.startTimeSale
      state.wallet = payload.wallet
    },
    initMdappContract (state, payload) {
      state.adStartPresale = payload.adStartPresale
      state.adStartAll = payload.adStartAll
      state.owner = payload.owner
    },

    // Contract polls
    pollSaleContractData (state, payload) {
      state.ethusd = payload.ethusd
      state.soldOut = payload.soldOut
      state.supply = payload.supply

      if (state.hasOwnProperty('withdrawableBalance')) {
        state.withdrawableBalance = payload.withdrawableBalance
      }

      if (state.hasOwnProperty('oracleActive')) {
        state.oracleActive = payload.oracleActive
        state.oracleGasPrice = payload.oracleGasPrice
        state.oracleGasLimit = payload.oracleGasLimit
        state.oracleInterval = payload.oracleInterval
        state.oracleLastUpdate = payload.oracleLastUpdate
        state.contractFunds = payload.contractFunds
      }
    },
    pollMdappContractData (state, payload) {
      state.presaleTokens = payload.presaleTokens
    },
    pollTokenContractData (state, payload) {
      state.balance = payload.balance
      state.transferableTokens = payload.transferableTokens
      state.lockedTokens = payload.lockedTokens

      if (payload.hasOwnProperty('mintingFinished')) {
        state.forceTransferEnable = payload.forceTransferEnable
        state.mintingFinished = payload.mintingFinished
      }
    },

    // User transactions
    addTransaction (state, payload) {
      if (payload.status === 'pending' || payload.status === 'confirmed') {
        state.txWatchlist.set(payload.hash, payload)
        state.trigger.txWatch++
      }
      state.transactions.set(payload.hash, payload)
      state.trigger.tx++
    },
    unwatchTransaction (state, payload) {
      state.txWatchlist.delete(payload.hash)
      state.trigger.txWatch++
    },

    initUserAds (state, payload) {
      // If there are existing myAds, that means the user switched his account in MetaMask.
      // Change the isCurrentUser prop for all new and old myAds
      let triggerAllAds = false
      state.myAds.forEach(ad => {
        // Update allAds to have their isCurrentUser = false
        // Since it wasn't drawed yet, it will after we trigger the change.
        let adFromAll = state.allAds.get(ad.id)
        if (adFromAll) {
          adFromAll.isCurrentUser = false
          triggerAllAds = true
        }
      })

      // 2nd update myAds
      state.myAds = payload

      payload.forEach(ad => {
        // Check if it's already in allAds
        let adFromAll = state.allAds.get(ad.id)
        if (adFromAll) {
          // This ones elements get removed after we trigger the change
          adFromAll.isCurrentUser = true
          triggerAllAds = true
        } else {
          // Add the ads pixels to blocking pixels
          let blockNumbers = utils.getBlockNumbers(ad.x, ad.y, ad.width, ad.height)
          blockNumbers.forEach((val, number) => {
            state.blockingPixels.add(number)
          })
        }
      })

      // 4th trigger update
      state.trigger.myAds++
      if (triggerAllAds) state.trigger.allAds++
    },
    initAllAds (state, payload) {
      // Set all ads
      state.allAds = payload

      // Add them to blocking pixels
      payload.forEach(ad => {
        let blockNumbers = utils.getBlockNumbers(ad.x, ad.y, ad.width, ad.height)
        blockNumbers.forEach((val, number) => {
          state.blockingPixels.add(number)
        })

        if (ad.nsfw) {
          state.adsWithNSFW++
        }
      })

      // Trigger update
      state.trigger.allAds++
    },
    // Filter processing
    setInitBlock (state, payload) {
      state.nextBlockUserClaim = payload
      state.nextBlockUserEdit = payload
      state.nextBlockUserRelease = payload
      state.nextBlockUserRecruitments = payload

      state.nextBlockAllClaim = payload
      state.nextBlockAllEdit = payload
      state.nextBlockAllRelease = payload
      state.nextBlockAllNSFW = payload
    },
    setNextFilterBlock (state, payload) {
      state[`nextBlock${payload.filter}`] = payload.block
    },
    addToQueue (state, payload) {
      let id = payload.target + '_' + payload.ad.id
      state.adsQueue.set(id, {
        ad: payload.ad,
        event: payload.event,
        target: payload.target
      })

      state.adsQueueIsWaiting = true
    },
    setAd (state, payload) {
      // Do not trigger update - otherwise infinite loop
      let ad = payload.ad

      // Add / Update ad
      if (payload.target === 'user') {
        state.myAds.set(ad.id, ad)
      } else {
        state.allAds.set(ad.id, ad)

        if (ad.nsfw) {
          state.adsWithNSFW++
        }

        // Set blocking pixels
        let blockNumbers = utils.getBlockNumbers(ad.x, ad.y, ad.width, ad.height)
        blockNumbers.forEach((val, number) => {
          state.blockingPixels.add(number)
        })
      }

      // Remove from queue
      state.adsQueue.delete(payload.queueId)
      if (state.adsQueue.size === 0) state.adsQueueIsWaiting = false
    },
    removeAd (state, payload) {
      // Do not trigger update - otherwise infinite loop
      let ad = payload.ad

      // Remove ad
      if (payload.target === 'user') {
        state.myAds.delete(ad.id)

        // Change helper progress if this was the last ad
        if (!state.myAds.size) {
          Vue.set(state.helperProgress, 4, false)
          Vue.set(state.helperProgress, 5, false)
        }
      } else {
        state.allAds.delete(ad.id)

        if (ad.nsfw) {
          state.adsWithNSFW--
        }

        // Remove blocking pixels
        let blockNumbers = utils.getBlockNumbers(ad.x, ad.y, ad.width, ad.height)
        blockNumbers.forEach((val, number) => {
          state.blockingPixels.delete(number)
        })
      }

      // Remove from queue
      state.adsQueue.delete(payload.queueId)
      if (state.adsQueue.size === 0) state.adsQueueIsWaiting = false
    },
    setBlockTime (state, payload) {
      payload.forEach((time, block) => {
        state.web3.blockTimes.set(block, time)
      })
    },
    forceNSFW (state, payload) {
      state.forceNSFW.add(payload)
      state.trigger.forceNSFW++
    },
    removeForceNSFW (state, payload) {
      if (state.forceNSFW.has(payload)) {
        state.forceNSFW.delete(payload)
        state.trigger.forceNSFW++
      }
    },

    // Other
    setHelperProgress (state, payload) {
      // The given step is considered being done
      switch (payload[0]) {
        case 'metamask':
          Vue.set(state.helperProgress, 0, payload[1])
          break
        case 'unlock':
          Vue.set(state.helperProgress, 1, payload[1])
          break
        case 'ether':
          Vue.set(state.helperProgress, 2, payload[1])
          break
        case 'mdapp':
          Vue.set(state.helperProgress, 3, payload[1])
          break
        case 'claim':
          Vue.set(state.helperProgress, 4, payload[1])
          break
        case 'upload':
          Vue.set(state.helperProgress, 5, payload[1])
      }
    },

    // Helper
    triggerUpdate (state, payload) {
      state.trigger[payload]++
    }
  },

  actions: {
    setWeb3Instance ({commit, dispatch}, payload) {
      if (payload.injected) dispatch('setHelperProgress', ['metamask', true])
      commit('setWeb3Instance', payload)
    },
    setWeb3Watcher ({commit}, payload) {
      commit('setWeb3Watcher', payload)
    },
    setConnectionState ({commit}, payload) {
      commit('setConnectionState', payload)
    },

    setWeb3Data ({commit, dispatch}, payload) {
      if (payload.coinbase) dispatch('setHelperProgress', ['unlock', true])
      if (payload.balance && payload.balance.gt(web3Manager.getInstance().utils.toBN(0))) dispatch('setHelperProgress', ['ether', true])
      commit('setWeb3Data', payload)
    },
    pollWeb3 ({commit}, payload) {
      commit('pollWeb3Instance', payload)
    },

    // Contract registration
    async getSaleContractInstance ({commit}) {
      let contract = getSaleContract()
      commit('registerSaleContractInstance', contract)
      await initSaleContract()
      pollSaleContract()
    },
    async getMdappContractInstance ({commit}) {
      let result = await getMdappContract()
      commit('registerMdappContractInstance', result)
      await initMdappContract()
      pollMdappContract()
    },
    async getTokenContractInstance ({commit}) {
      let result = await getTokenContract()
      commit('registerTokenContractInstance', result)
      pollTokenContract()
    },
    unsetContracts ({commit}) {
      commit('unsetContracts')
    },

    // Contract constants initialization
    initSaleContract ({commit}, payload) {
      commit('initSaleContract', payload)
    },
    initMdappContract ({commit}, payload) {
      commit('initMdappContract', payload)
    },

    // Contract polls
    pollSaleContract ({commit}, payload) {
      commit('pollSaleContractData', payload)
    },
    pollMdappContract ({commit}, payload) {
      commit('pollMdappContractData', payload)
    },
    pollTokenContract ({commit}, payload) {
      commit('pollTokenContractData', payload)
    },

    // User transactions
    addTransaction ({commit}, payload) {
      commit('addTransaction', payload)
    },
    unwatchTransaction ({commit}, payload) {
      commit('unwatchTransaction', payload)
    },

    // Filter processing
    setInitBlock ({commit}, payload) {
      commit('setInitBlock', payload)
    },
    setNextFilterBlock ({commit}, payload) {
      commit('setNextFilterBlock', payload)
    },
    initUserAds ({commit}, payload) {
      commit('initUserAds', payload)
    },
    initAllAds ({commit}, payload) {
      commit('initAllAds', payload)
    },
    addToQueue ({commit}, payload) {
      commit('addToQueue', payload)
    },
    setAd ({commit}, payload) {
      commit('setAd', payload)
    },
    removeAd ({commit}, payload) {
      commit('removeAd', payload)
    },
    setBlockTime ({commit}, payload) {
      commit('setBlockTime', payload)
    },
    forceNSFW ({commit}, payload) {
      commit('forceNSFW', payload)
    },
    removeForceNSFW ({commit}, payload) {
      commit('removeForceNSFW', payload)
    },

    // Other
    setHelperProgress ({commit}, payload) {
      commit('setHelperProgress', payload)
    },

    // Helper
    triggerUpdate ({commit}, payload) {
      commit('triggerUpdate', payload)
    }
  }
})
