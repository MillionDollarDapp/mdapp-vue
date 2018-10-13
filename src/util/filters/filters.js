import Raven from 'raven-js'
import adFilter from './adFilter'
import saleFilter from './saleFilter'
import { watchTransaction } from '../transaction'
import {store} from '../../store/'
import utils from '../utils'
import web3Manager from '../web3Manager'

const filters = {
  _inited: false,

  init () {
    if (this._inited) return

    if (store.state.web3.block === null ||
      store.state.mdappContractInstance === null ||
      !web3Manager.isConnected) {
      setTimeout(() => { this.init() }, 100)
      return
    }
    store.dispatch('setInitBlock', store.state.web3.block + 1)

    this.initUser()
    this.initAll()

    this._inited = true
  },

  handleDisconnect () {
    // We can't unsubscribe when there's no connection.
    // adFilter.stopWatchUser()
    // adFilter.stopWatchAll()
    // saleFilter.stopWatchUser()
  },

  handleReconnect () {
    adFilter.watchUserAds()
    adFilter.watchAllAds()
    saleFilter.watchUser()
  },

  async initUser () {
    try {
      if (store.state.web3.block === null ||
        store.state.mdappContractInstance === null ||
        store.state.saleContractInstance === null ||
        (store.state.web3.isInjected && !store.state.web3.coinbase)) {
        await new Promise(resolve => setTimeout(resolve, 100))
        await this.initUser()
        return
      }

      if (!store.state.web3.coinbase) return

      // Set initBlock again, as this is important when the user changes his account. We want the new watchers
      // to start in the present not in the past.
      store.dispatch('setInitBlock', store.state.web3.block + 1)

      let values = await Promise.all([
        adFilter.getUserAds(),
        saleFilter.getUserPurchases()
      ])

      if (values[0].ads.size > 0) {
        store.dispatch('setHelperProgress', ['claim', true])
      }

      store.dispatch('initUserAds', values[0].ads)

      // Mix transactions of several filters together and bring them into the right order, then store them.
      this._storeUserTransactions(values[0].txs, values[1])

      // Lookup block times
      utils.setBlockTimes(values[0].ads)

      // Start watching.
      adFilter.watchUserAds()
      saleFilter.watchUser()
    } catch (error) {
      console.error('initUser:', error)
      Raven.captureException(error)
    }
  },

  async initAll () {
    try {
      if (store.state.web3.block === null ||
        store.state.mdappContractInstance === null) {
        await new Promise(resolve => setTimeout(resolve, 100))
        await this.initAll()
        return
      }

      // Get current list of active ad ids. These ids need to be inited. Otherwise we have to crawl a huge history from
      // past to present which might take quite a while.
      let adIds = await store.state.mdappContractInstance().methods.getAdIds().call()

      let values = await Promise.all([
        adFilter.getAllAds(adIds),
        saleFilter.getAllBounties()
      ])

      // Store all ads
      store.dispatch('initAllAds', values[0])

      // Lookup block times
      utils.setBlockTimes(values[0])

      // Start watching.
      adFilter.watchAllAds()
      saleFilter.watchAll()
    } catch (error) {
      console.error('initAll:', error)
      Raven.captureException(error)
    }
  },

  _storeUserTransactions (txs1, txs2) {
    // Merge txs1 and txs2 into one map block -> transactionIndex[] -> transaction
    let allTxs = new Map(txs1)

    txs2.forEach((txs, key, map) => {
      if (!allTxs.has(key)) {
        allTxs.set(key, txs)
      } else {
        let blockTxs = allTxs.get(key)
        txs.forEach((tx, index) => {
          blockTxs[index] = tx
        })
        allTxs.set(key, blockTxs)
      }
    })

    // Sort the map by blocknumber
    var mapSorted = new Map([...allTxs.entries()].sort(function (a, b) {
      return a[0] - b[0]
    }))

    mapSorted.forEach((txs, key, map) => {
      // key is the block number
      // value is an array containing all txs within that block
      // txs are keyed by their transactionIndex
      txs.forEach((tx, index) => {
        store.dispatch('addTransaction', tx)

        if (tx.status !== 'completed') watchTransaction(tx)
      })
    })
  }
}

export default filters
