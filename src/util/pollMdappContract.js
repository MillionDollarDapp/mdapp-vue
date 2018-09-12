import {store} from '../store/'
import web3Manager from './web3Manager'

let pollMdappInterval = null

const pollMdappContractFunction = async () => {
  if (store.state.mdappContractInstance !== null) {
    if (!web3Manager.isConnected || (pollMdappInterval !== null && store.state.adStartAll !== null && store.state.adStartAll <= Date.now())) {
      clearInterval(pollMdappInterval)
      return
    }

    try {
      if (store.state.web3.coinbase) {
        let data = {}
        data.presaleTokens = parseInt(await store.state.mdappContractInstance().methods.presaleBalanceOf(store.state.web3.coinbase).call())
        store.dispatch('pollMdappContract', data)
      }
    } catch (error) {
      console.error('pollMdapp:', error)
    }
  }
}

const pollMdappContract = function () {
  // Since we're only polling for the presale balance, we only need it as long as not everyone can claim.
  if (store.state.adStartAll === null) {
    setTimeout(() => { pollMdappContract() }, 100)
  } else if (store.state.adStartAll > Date.now()) {
    pollMdappContractFunction()
    pollMdappInterval = setInterval(() => { pollMdappContractFunction() }, 15000)
  }
}

export default pollMdappContract
