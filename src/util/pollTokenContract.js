import Raven from 'raven-js'
import Web3 from 'web3'
import {store} from '../store/'

var web3 = window.web3
web3 = new Web3(web3.currentProvider)

const pollTokenContractFunction = async () => {
  if (web3 && store.state.web3.web3Instance && store.state.tokenContractInstance !== null && store.state.web3.coinbase) {
    try {
      let data = {}
      let hadBalance = store.state.balance

      data.balance = new web3.BigNumber(await store.state.tokenContractInstance().balanceOf(store.state.web3.coinbase)).toNumber()
      data.transferableTokens = new web3.BigNumber(await store.state.tokenContractInstance().transferableTokensOf(store.state.web3.coinbase)).toNumber()
      data.lockedTokens = new web3.BigNumber(await store.state.tokenContractInstance().lockedTokensOf(store.state.web3.coinbase)).toNumber()

      if (!store.state.mintingFinished) {
        data.forceTransferEnable = await store.state.tokenContractInstance().forceTransferEnable()
        data.mintingFinished = await store.state.tokenContractInstance().mintingFinished()
      }

      if (!hadBalance && data.balance) {
        store.dispatch('setHelperProgress', ['mdapp', true])
      } else if (hadBalance && !data.balance) {
        store.dispatch('setHelperProgress', ['mdapp', false])
      }

      store.dispatch('pollTokenContract', data)
    } catch (error) {
      Raven.captureException(error)
    }
  }
}

const pollTokenContract = function (state) {
  if (store.state.tokenContractInstance === null) {
    setTimeout(() => { pollTokenContract() }, 100)
    return
  }

  pollTokenContractFunction()
  setInterval(() => { pollTokenContractFunction() }, 15000)
}

export default pollTokenContract
