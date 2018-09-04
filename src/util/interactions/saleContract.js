import Web3 from 'web3'
import {store} from '../../store/'

var web3 = window.web3
web3 = new Web3(web3.currentProvider)

export default {
  buy (beneficiary, tokenAmount, eth, recruiter) {
    let wei = web3.toWei(eth)

    return new Promise((resolve, reject) => {
      if (store.state.saleContractInstance === null) {
        reject(new Error('Sale contract not instantiated.'))
      }
      resolve()
    }).then(() => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.buyTokens.estimateGas(beneficiary, tokenAmount, recruiter, {from: store.state.web3.coinbase, value: wei}, (error, gas) => {
          if (error) reject(error)
          let safeGas = Math.round(((1.1 * 10) * gas) / 10)
          resolve(safeGas)
        })
      })
    }).then(safeGas => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.buyTokens.sendTransaction(beneficiary, tokenAmount, recruiter, {from: store.state.web3.coinbase, value: wei, gas: safeGas, gasPrice: store.state.web3.gasPrice}, (error, txHash) => {
          if (error) reject(error)
          resolve(txHash)
        })
      })
    })
  },

  activateOracle (eth) {
    let wei = web3.toWei(eth)

    return new Promise((resolve, reject) => {
      if (store.state.saleContractInstance === null) {
        reject(new Error('Sale contract not instantiated.'))
      }
      resolve()
    }).then(() => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.activateOracle.estimateGas({from: store.state.web3.coinbase, value: wei}, (error, gas) => {
          if (error) reject(error)
          let safeGas = Math.round(((1.1 * 10) * gas) / 10)
          resolve(safeGas)
        })
      })
    }).then(safeGas => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.activateOracle.sendTransaction({from: store.state.web3.coinbase, value: wei, gas: safeGas, gasPrice: store.state.web3.gasPrice}, (error, txHash) => {
          if (error) reject(error)
          resolve(txHash)
        })
      })
    })
  },

  withdrawBalance () {
    return new Promise((resolve, reject) => {
      if (store.state.saleContractInstance === null) {
        reject(new Error('Sale contract not instantiated.'))
      }
      resolve()
    }).then(() => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.withdrawPayments.estimateGas({from: store.state.web3.coinbase}, (error, gas) => {
          if (error) reject(error)

          // Again wrong gas estimation with ganache.
          let safeGas = Math.max(Math.round(((1.5 * 10) * gas) / 10), 100000)
          resolve(safeGas)
        })
      })
    }).then(safeGas => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.withdrawPayments.sendTransaction({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice}, (error, txHash) => {
          if (error) reject(error)
          resolve(txHash)
        })
      })
    })
  },

  withdrawOracleFunds () {
    return new Promise((resolve, reject) => {
      if (store.state.saleContractInstance === null) {
        reject(new Error('Sale contract not instantiated.'))
      }
      resolve()
    }).then(() => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.withdrawOracleFunds.estimateGas({from: store.state.web3.coinbase}, (error, gas) => {
          if (error) reject(error)
          // Wrong Ganache gas estimation
          let safeGas = Math.max(Math.round(((1.1 * 10) * gas) / 10), 150000)
          resolve(safeGas)
        })
      })
    }).then(safeGas => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.withdrawOracleFunds.sendTransaction({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice}, (error, txHash) => {
          if (error) reject(error)
          resolve(txHash)
        })
      })
    })
  },

  setOracleGasPrice (gwei) {
    let wei = gwei * 1000000000

    return new Promise((resolve, reject) => {
      if (store.state.saleContractInstance === null) {
        reject(new Error('Sale contract not instantiated.'))
      }
      resolve()
    }).then(() => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.setOracleGasPrice.estimateGas(wei, {from: store.state.web3.coinbase}, (error, gas) => {
          if (error) reject(error)
          let safeGas = Math.round(((1.1 * 10) * gas) / 10)
          resolve(safeGas)
        })
      })
    }).then(safeGas => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.setOracleGasPrice.sendTransaction(wei, {from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice}, (error, txHash) => {
          if (error) reject(error)
          resolve(txHash)
        })
      })
    })
  },

  setOracleGasLimit (gasLimit) {
    return new Promise((resolve, reject) => {
      if (store.state.saleContractInstance === null) {
        reject(new Error('Sale contract not instantiated.'))
      }
      resolve()
    }).then(() => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.setOracleGasLimit.estimateGas(gasLimit, {from: store.state.web3.coinbase}, (error, gas) => {
          if (error) reject(error)
          let safeGas = Math.round(((1.1 * 10) * gas) / 10)
          resolve(safeGas)
        })
      })
    }).then(safeGas => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.setOracleGasLimit.sendTransaction(gasLimit, {from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice}, (error, txHash) => {
          if (error) reject(error)
          resolve(txHash)
        })
      })
    })
  },

  setOracleInterval (interval) {
    return new Promise((resolve, reject) => {
      if (store.state.saleContractInstance === null) {
        reject(new Error('Sale contract not instantiated.'))
      }
      resolve()
    }).then(() => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.setOracleInterval.estimateGas(interval, {from: store.state.web3.coinbase}, (error, gas) => {
          if (error) reject(error)
          let safeGas = Math.round(((1.1 * 10) * gas) / 10)
          resolve(safeGas)
        })
      })
    }).then(safeGas => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.setOracleInterval.sendTransaction(interval, {from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice}, (error, txHash) => {
          if (error) reject(error)
          resolve(txHash)
        })
      })
    })
  },

  setOracleQueryString (queryString) {
    return new Promise((resolve, reject) => {
      if (store.state.saleContractInstance === null) {
        reject(new Error('Sale contract not instantiated.'))
      }
      resolve()
    }).then(() => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.setOracleQueryString.estimateGas(queryString, {from: store.state.web3.coinbase}, (error, gas) => {
          if (error) reject(error)
          let safeGas = Math.round(((1.1 * 10) * gas) / 10)
          resolve(safeGas)
        })
      })
    }).then(safeGas => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.setOracleQueryString.sendTransaction(queryString, {from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice}, (error, txHash) => {
          if (error) reject(error)
          resolve(txHash)
        })
      })
    })
  },

  setETHUSD (cents) {
    return new Promise((resolve, reject) => {
      if (store.state.saleContractInstance === null) {
        reject(new Error('Sale contract not instantiated.'))
      }
      resolve()
    }).then(() => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.setEthUsd.estimateGas(cents, {from: store.state.web3.coinbase}, (error, gas) => {
          if (error) reject(error)
          let safeGas = Math.round(((1.1 * 10) * gas) / 10)
          resolve(safeGas)
        })
      })
    }).then(safeGas => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.setEthUsd.sendTransaction(cents, {from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice}, (error, txHash) => {
          if (error) reject(error)
          resolve(txHash)
        })
      })
    })
  },

  grantBounty (beneficiary, tokens, reason) {
    return new Promise((resolve, reject) => {
      if (store.state.saleContractInstance === null) {
        reject(new Error('Sale contract not instantiated.'))
      }
      resolve()
    }).then(() => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.grantBounty.estimateGas(beneficiary, tokens, reason, {from: store.state.web3.coinbase}, (error, gas) => {
          if (error) reject(error)
          let safeGas = Math.round(((1.1 * 10) * gas) / 10)
          resolve(safeGas)
        })
      })
    }).then(safeGas => {
      return new Promise((resolve, reject) => {
        store.state.saleContractInstance().contract.grantBounty.sendTransaction(beneficiary, tokens, reason, {from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice}, (error, txHash) => {
          if (error) reject(error)
          resolve(txHash)
        })
      })
    })
  }
}
