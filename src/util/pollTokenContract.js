import Raven from 'raven-js'
import {store} from '../store/'
import web3Manager from './web3Manager'

let pollTokenInterval = null

const pollTokenContractFunction = async () => {
  let web3 = web3Manager.getInstance()

  if (!web3Manager.isConnected) {
    clearInterval(pollTokenInterval)
    return
  }

  if (web3 && store.state.tokenContractInstance !== null && store.state.web3.coinbase) {
    try {
      let data = {}
      let hadBalance = store.state.balance && store.state.balance.gt(web3.utils.toBN(0))

      let conditionalPromises = {
        minting: false
      }

      let promises = [
        store.state.tokenContractInstance().methods.balanceOf(store.state.web3.coinbase).call(),
        store.state.tokenContractInstance().methods.transferableTokensOf(store.state.web3.coinbase).call(),
        store.state.tokenContractInstance().methods.lockedTokensOf(store.state.web3.coinbase).call()
      ]

      if (!store.state.mintingFinished) {
        conditionalPromises.minting = true
        promises.push(store.state.tokenContractInstance().methods.forceTransferEnable().call())
        promises.push(store.state.tokenContractInstance().methods.mintingFinished().call())
      }

      // Call all methods in parallel.
      let values = await Promise.all(promises)

      data.balance = web3.utils.toBN(values[0])
      data.transferableTokens = web3.utils.toBN(values[1])
      data.lockedTokens = web3.utils.toBN(values[2])

      if (conditionalPromises.minting) {
        data.forceTransferEnable = values[3]
        data.mintingFinished = values[4]
      }

      if (!hadBalance && data.balance.gt(web3.utils.toBN(0))) {
        store.dispatch('setHelperProgress', ['mdapp', true])
      } else if (hadBalance && !data.balance.gt(web3.utils.toBN(0))) {
        store.dispatch('setHelperProgress', ['mdapp', false])
      }

      store.dispatch('pollTokenContract', data)
    } catch (error) {
      console.error('pollToken:', error)
      Raven.captureException(error)
    }
  }
}

const pollTokenContract = function () {
  if (store.state.tokenContractInstance === null) {
    setTimeout(() => { pollTokenContract() }, 100)
    return
  }

  pollTokenContractFunction()
  pollTokenInterval = setInterval(() => { pollTokenContractFunction() }, 15000)
}

export default pollTokenContract
