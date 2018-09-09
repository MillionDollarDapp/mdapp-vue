import Raven from 'raven-js'
import {store} from '../store/'
import web3Manager from './web3Manager'

let pollSaleInterval = null

const pollSaleContractFunction = async () => {
  let web3 = web3Manager.getInstance()

  if (!web3Manager.isConnected) {
    clearInterval(pollSaleInterval)
    return
  }

  if (web3 && store.state.saleContractInstance !== null) {
    try {
      let data = {}

      let conditionalPromises = {
        coinbase: false,
        admins: false
      }

      let promises = [
        store.state.saleContractInstance().methods.ethusd().call(),
        store.state.saleContractInstance().methods.soldOut().call(),
        store.state.saleContractInstance().methods.supply().call()
      ]

      if (store.state.web3.coinbase) {
        conditionalPromises.coinbase = true
        promises.push(store.state.saleContractInstance().methods.payments(store.state.web3.coinbase).call())
      }

      if (store.state.web3.coinbase === store.state.owner ||
          store.state.web3.coinbase === store.state.wallet) {
        conditionalPromises.admins = true
        promises.push(store.state.saleContractInstance().methods.oracleActive().call())
        promises.push(store.state.saleContractInstance().methods.oracleGasPrice().call())
        promises.push(store.state.saleContractInstance().methods.oracleGasLimit().call())
        promises.push(store.state.saleContractInstance().methods.oracleInterval().call())
        promises.push(store.state.saleContractInstance().methods.oracleLastUpdate().call())
        promises.push(store.state.saleContractInstance().methods.payments(store.state.wallet).call())
      }

      // Call all methods in parallel.
      let values = await Promise.all(promises)

      data.ethusd = parseInt(values[0])
      data.soldOut = values[1]
      data.supply = parseInt(values[2])

      if (conditionalPromises.coinbase) {
        data.withdrawableBalance = web3.utils.toBN(values[3])
      }

      if (conditionalPromises.admins) {
        let index = conditionalPromises.coinbase ? 4 : 3

        data.oracleActive = values[index++]
        data.oracleGasPrice = parseInt(values[index++])
        data.oracleGasLimit = parseInt(values[index++])
        data.oracleInterval = parseInt(values[index++])
        data.oracleLastUpdate = parseInt(values[index++]) * 1000
        data.contractFunds = web3.utils.toBN(values[index])
      }

      if (data.soldOut && pollSaleInterval !== null) clearInterval(pollSaleInterval)

      store.dispatch('pollSaleContract', data)
    } catch (error) {
      console.log('pollSale:', error)
      Raven.captureException(error)
    }
  }
}

const pollSaleContract = function () {
  pollSaleContractFunction()

  if (!store.state.soldOut) {
    pollSaleInterval = setInterval(() => { pollSaleContractFunction() }, 15000)
  }
}

export default pollSaleContract
