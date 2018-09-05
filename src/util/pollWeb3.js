import Raven from 'raven-js'
import {store} from '../store/'

const pollWeb3Function = async () => {
  let web3 = store.state.web3.web3Instance()

  if (web3) {
    let hadCoinbase = store.state.web3.coinbase
    let hadEther = store.state.web3.balance && store.state.web3.balance.gt(0)

    try {
      let data = { coinbase: store.state.web3.isInjected ? web3.utils.toChecksumAddress(await web3.eth.getCoinbase()) : null }

      if (data.coinbase) {
        if (!hadCoinbase) store.dispatch('setHelperProgress', ['unlock', true])

        let conditionalPromises = {
          oracle: false
        }
        let promises = []
        promises.push(web3.eth.getBalance(data.coinbase))
        promises.push(web3.eth.getGasPrice())

        if ((data.coinbase === store.state.owner || data.coinbase === store.state.wallet) &&
          store.state.saleContractInstance !== null) {
          // Query balance of sale contract.
          conditionalPromises.oracle = true
          promises.push(web3.eth.getBalance(store.state.saleContractInstance().options.address))
        }

        // Call all methods in parallel.
        let values = await Promise.all(promises)

        data.balance = web3.utils.toBN(values[0])
        data.balanceEth = Number(web3.utils.fromWei(data.balance, 'ether')).toFixed(3)
        data.gasPrice = web3.utils.toBN(values[1])

        if (conditionalPromises.oracle) {
          data.oracleFunds = web3.utils.toBN(values[2])
        }

        // Set helper progress based on balance.
        if (!hadEther && data.balance.gt(0)) {
          store.dispatch('setHelperProgress', ['ether', true])
        } else if (hadEther && data.balance.lt(1)) {
          store.dispatch('setHelperProgress', ['ether', false])
        }
      } else {
        if (hadCoinbase) store.dispatch('setHelperProgress', ['unlock', false])
      }

      data.block = await web3.eth.getBlockNumber()

      store.dispatch('pollWeb3', data)
    } catch (error) {
      console.error('pollWeb3:', error)
      Raven.captureException(error)
    }
  }
}

const pollWeb3 = function (state) {
  pollWeb3Function()
  setInterval(() => { pollWeb3Function() }, 1000)
}

export default pollWeb3
