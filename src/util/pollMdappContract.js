import Raven from 'raven-js'
import Web3 from 'web3'
import {store} from '../store/'

var web3 = window.web3
web3 = new Web3(web3.currentProvider)

var pollMdappInterval = null

const pollMdappContractFunction = async () => {
  if (web3 && store.state.web3.web3Instance && store.state.mdappContractInstance !== null) {
    if (pollMdappInterval !== null && store.state.adStartAll !== null && store.state.adStartAll <= Date.now()) {
      clearInterval(pollMdappInterval)
      return
    }

    try {
      let data = {}
      data.presaleTokens = new web3.BigNumber(await store.state.mdappContractInstance().presaleBalanceOf(store.state.web3.coinbase)).toNumber()
      store.dispatch('pollMdappContract', data)
    } catch (error) {
      Raven.captureException(error)
    }
  }
}

const pollMdappContract = function (state) {
  // Since we're only polling for the presale balance, we only need it as long as not everyone can claim.
  if (store.state.adStartAll === null) {
    setTimeout(() => { pollMdappContract() }, 100)
  } else if (store.state.adStartAll > Date.now()) {
    pollMdappContractFunction()
    pollMdappInterval = setInterval(() => { pollMdappContractFunction() }, 15000)
  }
}

export default pollMdappContract
