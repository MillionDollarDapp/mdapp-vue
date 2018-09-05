import Raven from 'raven-js'
import {store} from '../store/'

let pollMdappInterval = null

const pollMdappContractFunction = async () => {
  let web3 = store.state.web3.web3Instance()

  if (web3 && store.state.mdappContractInstance !== null) {
    if (pollMdappInterval !== null && store.state.adStartAll !== null && store.state.adStartAll <= Date.now()) {
      clearInterval(pollMdappInterval)
      return
    }

    try {
      let data = {}
      data.presaleTokens = parseInt(await store.state.mdappContractInstance().methods.presaleBalanceOf(store.state.web3.coinbase).call())
      store.dispatch('pollMdappContract', data)
    } catch (error) {
      console.error('pollMdapp:', error)
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
