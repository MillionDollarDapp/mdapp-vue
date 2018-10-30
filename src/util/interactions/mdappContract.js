import Raven from 'raven-js'
import {store} from '../../store/'
import web3Manager from '../web3Manager'

export default {
  // Only contract owner can force-allow tranferability of tokens.
  async allowTransfer () {
    try {
      if (store.state.saleContractInstance === null) {
        throw new Error('Sale contract not instantiated.')
      }

      await web3Manager.requestAuthorization()

      let gas = await store.state.mdappContractInstance().methods.allowTransfer().estimateGas({from: store.state.web3.coinbase})
      let safeGas = Math.round(((1.1 * 10) * gas) / 10)
      return [null, store.state.mdappContractInstance().methods.allowTransfer().send({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice})]
    } catch (error) {
      console.error('allowTransfer:', error)
      Raven.captureException(error)
      return [error, null]
    }
  },

  async claim (x, y, width, height) {
    try {
      if (store.state.saleContractInstance === null) {
        throw new Error('Sale contract not instantiated.')
      }

      await web3Manager.requestAuthorization()

      x = x / 10
      y = y / 10
      width = width / 10
      height = height / 10

      let gas = await store.state.mdappContractInstance().methods.claim(x, y, width, height).estimateGas({from: store.state.web3.coinbase})
      let safeGas = Math.round(((1.1 * 10) * gas) / 10)
      return [null, store.state.mdappContractInstance().methods.claim(x, y, width, height).send({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice})]
    } catch (error) {
      console.error('claim:', error)
      Raven.captureException(error)
      return [error, null]
    }
  },

  async release (adId) {
    try {
      if (store.state.saleContractInstance === null) {
        throw new Error('Sale contract not instantiated.')
      }

      await web3Manager.requestAuthorization()

      let gas = await store.state.mdappContractInstance().methods.release(adId).estimateGas({from: store.state.web3.coinbase})
      let safeGas = Math.round(((1.5 * 10) * gas) / 10)
      return [null, store.state.mdappContractInstance().methods.release(adId).send({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice})]
    } catch (error) {
      console.error('release:', error)
      Raven.captureException(error)
      return [error, null]
    }
  },

  async editAd (adId, link, title, text, contact, nsfw, digest, hashFunction, size, storageEnginge) {
    try {
      if (store.state.saleContractInstance === null) {
        throw new Error('Sale contract not instantiated.')
      }

      await web3Manager.requestAuthorization()
      let web3 = web3Manager.getInstance()

      storageEnginge = storageEnginge === undefined ? web3.utils.asciiToHex('ipfs') : web3.utils.asciiToHex(storageEnginge)
      let gas = await store.state.mdappContractInstance().methods.editAd(adId, link, title, text, contact, nsfw, digest, hashFunction, size, storageEnginge).estimateGas({from: store.state.web3.coinbase})
      let safeGas = Math.round(((1.1 * 10) * gas) / 10)
      return [null, store.state.mdappContractInstance().methods.editAd(adId, link, title, text, contact, nsfw, digest, hashFunction, size, storageEnginge).send({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice})]
    } catch (error) {
      console.error('editAd:', error)
      Raven.captureException(error)
      return [error, null]
    }
  },

  async forceNSFW (adId) {
    try {
      if (store.state.saleContractInstance === null) {
        throw new Error('Sale contract not instantiated.')
      }

      await web3Manager.requestAuthorization()

      let gas = await store.state.mdappContractInstance().methods.forceNSFW(adId).estimateGas({from: store.state.web3.coinbase})
      let safeGas = Math.round(((1.1 * 10) * gas) / 10)
      return [null, store.state.mdappContractInstance().methods.forceNSFW(adId).send({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice})]
    } catch (error) {
      console.error('forceNSFW:', error)
      Raven.captureException(error)
      return [error, null]
    }
  }
}
