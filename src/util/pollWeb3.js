import Raven from 'raven-js'
import Web3 from 'web3'
import {store} from '../store/'

var web3 = window.web3
web3 = new Web3(web3.currentProvider)

const pollWeb3Function = async () => {
  if (web3 && store.state.web3.web3Instance) {
    let hadCoinbase = store.state.web3.coinbase
    let hadEther = store.state.web3.balance && store.state.web3.balance.gt(0)

    try {
      let data = {}
      if (store.state.web3.isInjected) {
        data = { coinbase: web3.eth.coinbase }
      }

      if (data.coinbase) {
        if (!hadCoinbase) store.dispatch('setHelperProgress', ['unlock', true])

        // TODO: rewrite to solve promises with Promise.all
        data.balance = await new Promise((resolve, reject) => {
          web3.eth.getBalance(data.coinbase, (err, polledBalance) => {
            if (err) reject(err)

            if (!hadEther && polledBalance.gt(0)) {
              store.dispatch('setHelperProgress', ['ether', true])
            } else if (hadEther && polledBalance.lt(1)) {
              store.dispatch('setHelperProgress', ['ether', false])
            }
            resolve(polledBalance)
          })
        })
        data.balanceEth = Number(web3.fromWei(data.balance)).toFixed(3)

        data.gasPrice = await new Promise((resolve, reject) => {
          web3.eth.getGasPrice((err, gasPrice) => {
            if (err) reject(err)
            resolve(gasPrice)
          })
        })

        // Get sale contract balance for admin and wallet owner
        if (data.coinbase === store.state.owner || data.coinbase === store.state.wallet) {
          if (store.state.saleContractInstance !== null) {
            data.oracleFunds = await new Promise((resolve, reject) => {
              web3.eth.getBalance(store.state.saleContractInstance().contract.address, (err, oracleFunds) => {
                if (err) reject(err)
                resolve(oracleFunds)
              })
            })
          }
        }
      } else {
        if (hadCoinbase) store.dispatch('setHelperProgress', ['unlock', false])
      }

      data.block = await new Promise((resolve, reject) => {
        web3.eth.getBlockNumber((err, block) => {
          if (err) reject(err)
          resolve(block)
        })
      })

      store.dispatch('pollWeb3', data)
    } catch (error) {
      Raven.captureException(error)
    }
  }
}

const pollWeb3 = function (state) {
  pollWeb3Function()
  setInterval(() => { pollWeb3Function() }, 1000)
}

export default pollWeb3
