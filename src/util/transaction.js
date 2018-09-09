import Raven from 'raven-js'
import {store} from '../store/'
import web3Manager from './web3Manager'

/**
 * Adds a new transaction to our store.
 *
 * @param hash of the transaction
 * @param op operation of the transaction
 * @param data used in that tx, e.g. bought token amount
 * @param status of the transaction (error, pending, confirmed, completed)
 */
const newTransaction = (hash, op, data, status) => {
  let tx = {
    hash: hash,
    status: status,
    block: null
  }

  switch (op) {
    case 'buyToken':
      if (data.beneficiary === store.state.web3.coinbase) {
        tx.desc = `Buy ${data.tokenQty} MDAPP (${data.cost} ETH).`
      } else {
        tx.desc = `Buy ${data.tokenQty} MDAPP (${data.cost} ETH) for ${data.beneficiary.substr(0, 12)}... .`
      }
      break

    case 'claim':
      tx.desc = `Claim ${data.width * data.height} pixels.`
      break

    case 'release':
      tx.desc = `Remove ad and release ${data.pixels} pixels.`
      break

    case 'editAd':
      tx.desc = `Edit ad #${data.adId}.`
      break

    case 'forceNSFW':
      tx.desc = `Force NSFW for ad #${data.adId}.`
      break

    case 'allowTransfer':
      tx.desc = 'Force allow transfer.'
      break

    case 'activateOracle':
      tx.desc = `Activate oracle with ${data.funds} ETH.`
      break

    case 'withdrawBalance':
      tx.desc = 'Withdraw ETH balance.'
      break

    case 'withdrawOracleFunds':
      tx.desc = 'Withdraw oracle funds.'
      break

    case 'setOracleGasPrice':
      tx.desc = `Set oracle gas price to ${data.price / 1000000000} gwei.`
      break

    case 'setOracleGasLimit':
      tx.desc = `Set oracle gas limit to ${data.limit}.`
      break

    case 'setOracleInterval':
      tx.desc = `Set oracle interval to ${data.interval} seconds.`
      break

    case 'setOracleQueryString':
      tx.desc = `Set oracle query String to ${data.queryString}.`
      break

    case 'setEthUsd':
      tx.desc = `Set eth/usd rate to ${data.ethusd} cents.`
      break

    case 'grantBounty':
      tx.desc = `Grant ${data.tokens} MDAPP bounty to ${data.beneficiary}: ${data.reason}`
      break

    default:
      tx.desc = `Unknown tx op: ${op}`
      break
  }

  if (status === 'error') {
    tx.error = data.error
  }
  store.dispatch('addTransaction', tx).then(() => {
    if (status !== 'error') {
      watchTransaction(tx)
    }
  })
}

/**
 * Watch a transaction until it has n confirmations. Then mark it as completed.
 *
 * @param hash of the transaction
 */
const watchTransaction = async (tx) => {
  try {
    let web3 = web3Manager.getInstance()
    let receipt = await web3.eth.getTransactionReceipt(tx.hash)

    let continueWatching = true
    if (receipt !== null) {
      let confirmations = receipt.blockNumber === null ? 0 : store.state.web3.block - receipt.blockNumber + 1
      tx.block = receipt.blockNumber

      if (receipt.status) {
        // Transaction succeeded
        if (confirmations >= process.env.CONFIRMATIONS) {
          tx.status = 'completed'
          continueWatching = false
        } else {
          tx.status = 'confirmed'
        }
      } else {
        // Transaction failure
        continueWatching = false
        tx.status = 'error'

        // TODO: use error string once https://github.com/ethereum/web3.js/issues/1707 is implemented
        tx.error = 'Reverted by smart contract.'
      }
    }

    store.dispatch('triggerUpdate', 'tx')
    if (continueWatching) {
      setTimeout(() => { watchTransaction(tx) }, 15000)
    } else {
      store.dispatch('unwatchTransaction', tx)
    }
  } catch (error) {
    console.error('watchTransaction:', error)
    Raven.captureException(error)
  }
}

export { newTransaction, watchTransaction }
