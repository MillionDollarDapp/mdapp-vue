import Vue from 'vue'
import Vuex from 'vuex'
import state from './state'
import getters from './getters'
import getWeb3 from '../util/getWeb3'
import pollWeb3 from '../util/pollWeb3'
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
    registerWeb3Instance (state, payload) {
      let result = payload
      let web3Copy = state.web3
      web3Copy.coinbase = result.coinbase
      web3Copy.networkId = result.networkId
      web3Copy.balance = result.balance
      web3Copy.balanceEth = parseFloat(result.balanceEth)
      web3Copy.isInjected = result.injectedWeb3
      web3Copy.block = result.block
      web3Copy.web3Instance = result.web3
      state.web3 = web3Copy
      pollWeb3()
    },
    pollWeb3Instance (state, payload) {
      let coinbaseChanged = payload.coinbase !== state.web3.coinbase

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

        // Reset helper progress for mdapp, claim and upload
        Vue.set(state.helperProgress, 3, false)
        Vue.set(state.helperProgress, 4, false)
        Vue.set(state.helperProgress, 5, false)

        // Reinitialize user
        filters.initUser()
      }
    },
    // Contract registration
    registerSaleContractInstance (state, payload) {
      state.saleContractInstance = () => payload
      pollSaleContract()
    },
    registerMdappContractInstance (state, payload) {
      state.mdappContractInstance = () => payload
      pollMdappContract()
    },
    registerTokenContractInstance (state, payload) {
      state.tokenContractInstance = () => payload
      pollTokenContract()
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
        adFromAll.isCurrentUser = false

        triggerAllAds = true
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
      state.initBlock = payload
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
    registerWeb3 ({commit, dispatch}) {
      return new Promise((resolve, reject) => {
        getWeb3.then(result => {
          if (result.injectedWeb3) dispatch('setHelperProgress', ['metamask', true])
          if (result.coinbase) dispatch('setHelperProgress', ['unlock', true])
          if (result.balance && result.balance.gt(0)) dispatch('setHelperProgress', ['ether', true])
          resolve(commit('registerWeb3Instance', result))
        }).catch(e => reject(e))
      })
    },
    pollWeb3 ({commit}, payload) {
      commit('pollWeb3Instance', payload)
    },

    // Contract registration
    getSaleContractInstance ({commit}) {
      return new Promise((resolve, reject) => {
        getSaleContract.then(result => {
          commit('registerSaleContractInstance', result)
          resolve(initSaleContract())
        }).catch(e => reject(e))
      })
    },
    getMdappContractInstance ({commit}) {
      return new Promise((resolve, reject) => {
        getMdappContract.then(result => {
          commit('registerMdappContractInstance', result)
          resolve(initMdappContract())
        }).catch(e => reject(e))
      })
    },
    getTokenContractInstance ({commit}) {
      return new Promise((resolve, reject) => {
        getTokenContract.then(result => {
          resolve(commit('registerTokenContractInstance', result))
        }).catch(e => reject(e))
      })
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
