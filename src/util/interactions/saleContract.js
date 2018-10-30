import Raven from 'raven-js'
import {store} from '../../store/'
import web3Manager from '../web3Manager'

export default {
  async buy (beneficiary, tokenAmount, wei, recruiter) {
    try {
      if (store.state.saleContractInstance === null) {
        throw new Error('Sale contract not instantiated.')
      }

      await web3Manager.requestAuthorization()

      let gas = await store.state.saleContractInstance().methods.buyTokens(beneficiary, tokenAmount, recruiter).estimateGas({from: store.state.web3.coinbase, value: wei})
      let safeGas = Math.round(((1.1 * 10) * gas) / 10)
      return [null, store.state.saleContractInstance().methods.buyTokens(beneficiary, tokenAmount, recruiter).send({from: store.state.web3.coinbase, value: wei, gas: safeGas, gasPrice: store.state.web3.gasPrice})]
    } catch (error) {
      console.error('buy:', error)
      Raven.captureException(error)
      return [error, null]
    }
  },

  async activateOracle (wei) {
    try {
      if (store.state.saleContractInstance === null) {
        throw new Error('Sale contract not instantiated.')
      }

      await web3Manager.requestAuthorization()

      let gas = await store.state.saleContractInstance().methods.activateOracle().estimateGas({from: store.state.web3.coinbase, value: wei})
      let safeGas = Math.round(((1.1 * 10) * gas) / 10)
      return [null, store.state.saleContractInstance().methods.activateOracle().send({from: store.state.web3.coinbase, value: wei, gas: safeGas, gasPrice: store.state.web3.gasPrice})]
    } catch (error) {
      console.error('activateOracle:', error)
      Raven.captureException(error)
      return [error, null]
    }
  },

  async withdrawBalance () {
    try {
      if (store.state.saleContractInstance === null) {
        throw new Error('Sale contract not instantiated.')
      }

      await web3Manager.requestAuthorization()

      let gas = await store.state.saleContractInstance().methods.withdrawPayments().estimateGas({from: store.state.web3.coinbase})
      let safeGas = Math.round(((1.1 * 10) * gas) / 10)
      return [null, store.state.saleContractInstance().methods.withdrawPayments().send({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice})]
    } catch (error) {
      console.error('withdrawBalance:', error)
      Raven.captureException(error)
      return [error, null]
    }
  },

  async withdrawOracleFunds () {
    try {
      if (store.state.saleContractInstance === null) {
        throw new Error('Sale contract not instantiated.')
      }

      await web3Manager.requestAuthorization()

      let gas = await store.state.saleContractInstance().methods.withdrawOracleFunds().estimateGas({from: store.state.web3.coinbase})
      let safeGas = Math.round(((1.1 * 10) * gas) / 10)
      return [null, store.state.saleContractInstance().methods.withdrawOracleFunds().send({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice})]
    } catch (error) {
      console.error('withdrawOracleFunds:', error)
      Raven.captureException(error)
      return [error, null]
    }
  },

  async setOracleGasPrice (gwei) {
    let wei = gwei * 1000000000
    try {
      if (store.state.saleContractInstance === null) {
        throw new Error('Sale contract not instantiated.')
      }

      await web3Manager.requestAuthorization()

      let gas = await store.state.saleContractInstance().methods.setOracleGasPrice(wei).estimateGas({from: store.state.web3.coinbase})
      let safeGas = Math.round(((1.1 * 10) * gas) / 10)
      return [null, store.state.saleContractInstance().methods.setOracleGasPrice(wei).send({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice})]
    } catch (error) {
      console.error('setOracleGasPrice:', error)
      Raven.captureException(error)
      return [error, null]
    }
  },

  async setOracleGasLimit (gasLimit) {
    try {
      if (store.state.saleContractInstance === null) {
        throw new Error('Sale contract not instantiated.')
      }

      await web3Manager.requestAuthorization()

      let gas = await store.state.saleContractInstance().methods.setOracleGasLimit(gasLimit).estimateGas({from: store.state.web3.coinbase})
      let safeGas = Math.round(((1.1 * 10) * gas) / 10)
      return [null, store.state.saleContractInstance().methods.setOracleGasLimit(gasLimit).send({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice})]
    } catch (error) {
      console.error('setOracleGasLimit:', error)
      Raven.captureException(error)
      return [error, null]
    }
  },

  async setOracleInterval (interval) {
    try {
      if (store.state.saleContractInstance === null) {
        throw new Error('Sale contract not instantiated.')
      }

      await web3Manager.requestAuthorization()

      let gas = await store.state.saleContractInstance().methods.setOracleInterval(interval).estimateGas({from: store.state.web3.coinbase})
      let safeGas = Math.round(((1.1 * 10) * gas) / 10)
      return [null, store.state.saleContractInstance().methods.setOracleInterval(interval).send({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice})]
    } catch (error) {
      console.error('setOracleInterval:', error)
      Raven.captureException(error)
      return [error, null]
    }
  },

  async setOracleQueryString (queryString) {
    try {
      if (store.state.saleContractInstance === null) {
        throw new Error('Sale contract not instantiated.')
      }

      await web3Manager.requestAuthorization()

      let gas = await store.state.saleContractInstance().methods.setOracleQueryString(queryString).estimateGas({from: store.state.web3.coinbase})
      let safeGas = Math.round(((1.1 * 10) * gas) / 10)
      return [null, store.state.saleContractInstance().methods.setOracleQueryString(queryString).send({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice})]
    } catch (error) {
      console.error('setOracleQueryString:', error)
      Raven.captureException(error)
      return [error, null]
    }
  },

  async setETHUSD (cents) {
    try {
      if (store.state.saleContractInstance === null) {
        throw new Error('Sale contract not instantiated.')
      }

      await web3Manager.requestAuthorization()

      let gas = await store.state.saleContractInstance().methods.setEthUsd(cents).estimateGas({from: store.state.web3.coinbase})
      let safeGas = Math.round(((1.1 * 10) * gas) / 10)
      return [null, store.state.saleContractInstance().methods.setEthUsd(cents).send({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice})]
    } catch (error) {
      console.error('setETHUSD:', error)
      Raven.captureException(error)
      return [error, null]
    }
  },

  async grantBounty (beneficiary, tokens, reason) {
    try {
      if (store.state.saleContractInstance === null) {
        throw new Error('Sale contract not instantiated.')
      }

      await web3Manager.requestAuthorization()

      let gas = await store.state.saleContractInstance().methods.grantBounty(beneficiary, tokens, reason).estimateGas({from: store.state.web3.coinbase})
      let safeGas = Math.round(((1.1 * 10) * gas) / 10)
      return [null, store.state.saleContractInstance().methods.grantBounty(beneficiary, tokens, reason).send({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice})]
    } catch (error) {
      console.error('grantBounty:', error)
      Raven.captureException(error)
      return [error, null]
    }
  }
}
