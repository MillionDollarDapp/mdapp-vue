import Raven from 'raven-js'
import Web3 from 'web3'
import {store} from '../../store/'
import utils from '../utils'
import {watchTransaction} from '../transaction'

var web3 = window.web3
web3 = new Web3(web3.currentProvider)

const saleFilter = {
  /**
   * Get all purchase involved transactions of the current user.
   * Call it once at app initialization or on coinbase changes.
   */
  getUserPurchases () {
    return new Promise((resolve, reject) => {
      // Will hold all transactions which caused an event.
      let txs = new Map()

      let purchaseFilter = store.state.saleContractInstance().contract.TokenPurchase({
        purchaser: store.state.web3.coinbase
      }, {
        fromBlock: process.env.START_BLOCK,
        toBlock: store.state.web3.block
      }).get((error, logs) => {
        purchaseFilter.stopWatching()

        if (error) reject(error)

        for (let key in logs) {
          let log = logs[key]

          if (!txs.has(log.blockNumber)) {
            txs.set(log.blockNumber, [])
          }

          this._processLog(txs, log)
        }

        resolve(txs)
      })

      // Get your recruitments.
      let recruitementFilter = store.state.saleContractInstance().contract.Recruited({
        recruiter: store.state.web3.coinbase
      }, {
        fromBlock: process.env.START_BLOCK,
        toBlock: store.state.web3.block
      }).get((error, logs) => {
        recruitementFilter.stopWatching()

        if (error) reject(error)

        for (let key in logs) {
          let log = logs[key]

          if (!txs.has(log.blockNumber)) {
            txs.set(log.blockNumber, [])
          }

          this._processLog(txs, log)
        }

        resolve(txs)
      })

      // Show all bounties to admin.
      let bountyOptions = {}

      if (store.state.web3.coinbase !== store.state.owner) {
        // Show only your received bounties.
        bountyOptions.beneficiary = store.state.web3.coinbase
      }
      let bountyFilter = store.state.saleContractInstance().contract.BountyGranted(bountyOptions, {
        fromBlock: process.env.START_BLOCK,
        toBlock: store.state.web3.block
      }).get((error, logs) => {
        bountyFilter.stopWatching()

        if (error) reject(error)

        for (let key in logs) {
          let log = logs[key]

          if (!txs.has(log.blockNumber)) {
            txs.set(log.blockNumber, [])
          }

          this._processLog(txs, log)
        }

        resolve(txs)
      })
    })
  },

  _recruitementFilter: null,

  watchUser () {
    if (this._recruitementFilter) {
      // Stop old filters
      this._recruitementFilter.stopWatching()
    }

    this._recruitementFilter = store.state.saleContractInstance().contract.Recruited({
      recruiter: store.state.web3.coinbase
    }, {
      fromBlock: store.state.initBlock,
      toBlock: 'last'
    }).watch((error, log) => {
      if (error) {
        console.error('User recruited watch:', error)
        Raven.captureException(error)
        return
      }

      this._processWatchLog(log)
    })
  },

  /**
   * Helps interpreting the event log.
   *
   * @param txs Map of transactions blockNumber -> transactionIndex -> transaction
   * @param log of the event
   * @private
   */
  _processLog (txs, log) {
    let tx = {
      hash: log.transactionHash,
      status: store.state.web3.block - log.blockNumber >= process.env.CONFIRMATIONS ? 'completed' : 'confirmed',
      block: log.blockNumber
    }

    switch (log.event) {
      case 'TokenPurchase':
        if (log.args.beneficiary === store.state.web3.coinbase) {
          tx.desc = `Buy ${log.args.tokens.toNumber()} MDAPP (${web3.fromWei(log.args.value, 'ether')} ETH).`
        } else {
          tx.desc = `Buy ${log.args.tokens.toNumber()} MDAPP (${web3.fromWei(log.args.value, 'ether')} ETH) for ${log.args.beneficiary.substr(0, 12)}... .`
        }
        break

      case 'BountyGranted':
        if (log.args.beneficiary === store.state.web3.coinbase) {
          tx.desc = `Received ${log.args.tokens.toNumber()} MDAPP bounty: ${utils.escapeHTML(log.args.reason)}`
        } else {
          tx.desc = `Grant ${log.args.tokens.toNumber()} MDAPP bounty to ${log.args.beneficiary}: ${utils.escapeHTML(log.args.reason)}`
        }
        break

      case 'Recruited':
        let share = web3.fromWei(log.args.share, 'ether')
        tx.desc = `You earned ${share} ETH from a referral.`
        break

      default:
        tx.desc = 'Unknown Transaction type.'
    }

    let blockTxs = txs.get(log.blockNumber)
    blockTxs[log.transactionIndex] = tx
    txs.set(log.blockNumber, blockTxs)
  },

  _processWatchLog (log) {
    let tx = store.state.transactions.get(log.transactionHash)

    if (!tx) {
      // New user transaction found.
      tx = {
        hash: log.transactionHash,
        status: store.state.web3.block - log.blockNumber >= process.env.CONFIRMATIONS ? 'completed' : 'confirmed',
        block: log.blockNumber,
        dirty: true // temporary flag to indicate we have to add it to the watchlist
      }
    }

    switch (log.event) {
      case 'Recruited':
        let share = web3.fromWei(log.args.share, 'ether')
        tx.desc = `You earned ${share} ETH from a referral.`
        break

      default:
        return
    }

    if (tx.hasOwnProperty('dirty')) {
      delete tx.dirty
      store.dispatch('addTransaction', tx)
      if (tx.status !== 'completed') watchTransaction(tx)
    }
  }
}

export default saleFilter
