import Raven from 'raven-js'
import Web3 from 'web3'
import {store} from '../store/'

var web3 = window.web3
web3 = new Web3(web3.currentProvider)

var pollSaleInterval = null

const pollSaleContractFunction = async () => {
  if (web3 && store.state.web3.web3Instance && store.state.saleContractInstance !== null) {
    try {
      let data = {}
      data.ethusd = new web3.BigNumber(await store.state.saleContractInstance().ethusd()).toNumber()
      data.soldOut = await store.state.saleContractInstance().soldOut()
      data.supply = new web3.BigNumber(await store.state.saleContractInstance().supply()).toNumber()

      if (store.state.web3.coinbase) {
        data.withdrawableBalance = await store.state.saleContractInstance().payments(store.state.web3.coinbase)
      }

      if (store.state.web3.coinbase === store.state.owner ||
          store.state.web3.coinbase === store.state.wallet) {
        data.oracleActive = await store.state.saleContractInstance().oracleActive()
        data.oracleGasPrice = new web3.BigNumber(await store.state.saleContractInstance().oracleGasPrice()).toNumber()
        data.oracleGasLimit = new web3.BigNumber(await store.state.saleContractInstance().oracleGasLimit()).toNumber()
        data.oracleInterval = new web3.BigNumber(await store.state.saleContractInstance().oracleInterval()).toNumber()
        data.oracleLastUpdate = new web3.BigNumber(await store.state.saleContractInstance().oracleLastUpdate()).toNumber() * 1000
      }

      if (data.soldOut && pollSaleInterval !== null) clearInterval(pollSaleInterval)

      store.dispatch('pollSaleContract', data)
    } catch (error) {
      Raven.captureException(error)
    }
  }
}

const pollSaleContract = function (state) {
  pollSaleContractFunction()

  if (!store.state.soldOut) {
    // Even though avg block time is 15s we check every 10sec to stay always up to date.
    pollSaleInterval = setInterval(() => {
      pollSaleContractFunction()
    }, 10000)
  }
}

export default pollSaleContract
