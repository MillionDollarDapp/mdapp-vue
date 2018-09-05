import Raven from 'raven-js'
import {store} from '../../store/'
import utils from '../utils'
import {watchTransaction} from '../transaction'

const saleFilter = {
  /**
   * Get all purchase involved transactions of the current user.
   * Call it once at app initialization or on coinbase changes.
   */
  async getUserPurchases () {
    // Will hold all transactions which caused an event.
    let txs = new Map()

    let purchasesPromise = store.state.saleContractInstance().getPastEvents('TokenPurchase', {
      filter: { purchaser: store.state.web3.coinbase },
      fromBlock: process.env.DAPP_GENESIS,
      toBlock: store.state.web3.block
    })
    let recruitmentsPromise = store.state.saleContractInstance().getPastEvents('Recruited', {
      filter: { recruiter: store.state.web3.coinbase },
      fromBlock: process.env.DAPP_GENESIS,
      toBlock: store.state.web3.block
    })

    // If admin then show all bounties otherwise only own.
    let bountyOptions = {
      fromBlock: process.env.START_BLOCK,
      toBlock: store.state.web3.block
    }
    if (store.state.web3.coinbase !== store.state.owner) {
      // Show only your received bounties.
      bountyOptions.filter = { beneficiary: store.state.web3.coinbase }
    }
    let bountyPromise = store.state.saleContractInstance().getPastEvents('BountyGranted', bountyOptions)

    try {
      let values = await Promise.all([purchasesPromise, recruitmentsPromise, bountyPromise])

      // Process users purchases.
      for (let key in values[0]) {
        let log = values[0][key]
        if (!txs.has(log.blockNumber)) {
          txs.set(log.blockNumber, [])
        }
        this._processLog(txs, log)
      }

      // Process users recruitments.
      for (let key in values[1]) {
        let log = values[1][key]
        if (!txs.has(log.blockNumber)) {
          txs.set(log.blockNumber, [])
        }
        this._processLog(txs, log)
      }

      // Process bounties.
      for (let key in values[2]) {
        let log = values[2][key]
        if (!txs.has(log.blockNumber)) {
          txs.set(log.blockNumber, [])
        }
        this._processLog(txs, log)
      }

      return txs
    } catch (error) {
      console.error('getUserPurchases:', error)
      Raven.captureException(error)
    }
  },

  _recruitementFilter: null,

  watchUser () {
    if (this._recruitementFilter) {
      // Stop old filters
      this._recruitementFilter.unsubscribe()
    }

    this._recruitementFilter = store.state.saleContractInstance().events.Recruited({
      filter: { recruiter: store.state.web3.coinbase },
      fromBlock: store.state.initBlock,
      toBlock: 'latest'
    })
      .on('data', event => {
        this._processWatchLog(event)
      })
      .on('changed', event => {
        Raven.captureMessage('A recruitment event has been removed from blockchain', {
          level: 'warning',
          extra: { event: event }
        })
      })
      .on('error', error => {
        console.error('Watch user recruitments:', error)
        Raven.captureException(error)
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
    let web3 = store.state.web3.web3Instance()

    let tx = {
      hash: log.transactionHash,
      status: store.state.web3.block - log.blockNumber >= process.env.CONFIRMATIONS ? 'completed' : 'confirmed',
      block: log.blockNumber
    }

    let values = log.returnValues
    switch (log.event) {
      case 'TokenPurchase':
        if (values.beneficiary === store.state.web3.coinbase) {
          tx.desc = `Buy ${values.tokens} MDAPP (${web3.utils.fromWei(values.value, 'ether')} ETH).`
        } else {
          tx.desc = `Buy ${values.tokens} MDAPP (${web3.utils.fromWei(values.value, 'ether')} ETH) for ${values.beneficiary.substr(0, 12)}... .`
        }
        break

      case 'BountyGranted':
        if (values.beneficiary === store.state.web3.coinbase) {
          tx.desc = `Received ${values.tokens} MDAPP bounty: ${utils.escapeHTML(values.reason)}`
        } else {
          tx.desc = `Grant ${values.tokens} MDAPP bounty to ${values.beneficiary}: ${utils.escapeHTML(values.reason)}`
        }
        break

      case 'Recruited':
        let share = web3.utils.fromWei(values.share, 'ether')
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
    let web3 = store.state.web3.web3Instance()
    let tx = store.state.transactions.get(log.transactionHash)

    let values = log.returnValues
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
        let share = web3.utils.fromWei(values.share, 'ether')
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
