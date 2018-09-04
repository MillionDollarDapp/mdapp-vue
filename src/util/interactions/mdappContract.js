import Web3 from 'web3'
import {store} from '../../store/'

var web3 = window.web3
web3 = new Web3(web3.currentProvider)

export default {
  // Only contract owner can force-allow tranferability of tokens.
  allowTransfer () {
    return new Promise((resolve, reject) => {
      if (!web3 || !store.state.web3.web3Instance || store.state.mdappContractInstance === null) {
        reject(new Error('MDAPP core contract not instantiated.'))
      }
      resolve()
    }).then(() => {
      return new Promise((resolve, reject) => {
        store.state.mdappContractInstance().contract.allowTransfer.estimateGas({from: store.state.web3.coinbase}, (error, gas) => {
          if (error) reject(error)

          // Set max gas to 10% above the estimated usage - just in case...
          let safeGas = Math.round(((1.1 * 10) * gas) / 10)
          resolve(safeGas)
        })
      })
    }).then(safeGas => {
      return new Promise((resolve, reject) => {
        store.state.mdappContractInstance().contract.allowTransfer({from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice}, (error, txHash) => {
          if (error) reject(error)
          resolve(txHash)
        })
      })
    })
  },

  claim (x, y, width, height) {
    return new Promise((resolve, reject) => {
      if (!web3 || !store.state.web3.web3Instance || store.state.mdappContractInstance === null) {
        reject(new Error('MDAPP core contract not instantiated.'))
      }
      resolve()
    }).then(() => {
      return new Promise((resolve, reject) => {
        x = x / 10
        y = y / 10
        width = width / 10
        height = height / 10

        store.state.mdappContractInstance().contract.claim.estimateGas(x, y, width, height, {from: store.state.web3.coinbase}, (error, gas) => {
          if (error) reject(error)

          // Set max gas to 10% above the estimated usage - just in case...
          let safeGas = Math.round(((1.1 * 10) * gas) / 10)
          resolve(safeGas)
        })
      })
    }).then(safeGas => {
      return new Promise((resolve, reject) => {
        store.state.mdappContractInstance().contract.claim(x, y, width, height, {from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice}, (error, txHash) => {
          if (error) reject(error)
          resolve(txHash)
        })
      })
    })
  },

  release (adId) {
    return new Promise((resolve, reject) => {
      if (!web3 || !store.state.web3.web3Instance || store.state.mdappContractInstance === null) {
        reject(new Error('MDAPP core contract not instantiated.'))
      }
      resolve()
    // }).then(() => {
    //   return 1000000
    }).then(() => {
      return new Promise((resolve, reject) => {
        store.state.mdappContractInstance().contract.release.estimateGas(adId, {from: store.state.web3.coinbase}, (error, gas) => {
          if (error) reject(error)

          // Set max gas to 50% above the estimated usage, but at least 200k - this method seems to be tricky to estimate.
          let safeGas = Math.max(Math.round(((1.1 * 10) * gas) / 10), 200000)
          resolve(safeGas)
        })
      })
    }).then(safeGas => {
      return new Promise((resolve, reject) => {
        store.state.mdappContractInstance().contract.release(adId, {from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice}, (error, txHash) => {
          if (error) reject(error)
          resolve(txHash)
        })
      })
    })
  },

  editAd (adId, link, title, text, contact, nsfw, digest, hashFunction, size, storageEnginge) {
    return new Promise((resolve, reject) => {
      if (!web3 || !store.state.web3.web3Instance || store.state.mdappContractInstance === null) {
        reject(new Error('MDAPP core contract not instantiated.'))
      }
      resolve()
    }).then(() => {
      return new Promise((resolve, reject) => {
        // Default values
        storageEnginge = storageEnginge === undefined ? web3.fromAscii('ipfs') : web3.fromAscii(storageEnginge)
        store.state.mdappContractInstance().contract.editAd.estimateGas(adId, link, title, text, contact, nsfw, digest, hashFunction, size, storageEnginge, {from: store.state.web3.coinbase}, (error, gas) => {
          if (error) reject(error)

          // Set max gas to 10% above the estimated usage - just in case...
          let safeGas = Math.round(((1.1 * 10) * gas) / 10)
          resolve(safeGas)
        })
      })
    }).then(safeGas => {
      return new Promise((resolve, reject) => {
        store.state.mdappContractInstance().contract.editAd(adId, link, title, text, contact, nsfw, digest, hashFunction, size, storageEnginge, {from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice}, (error, txHash) => {
          if (error) reject(error)
          resolve(txHash)
        })
      })
    })
  },

  forceNSFW (adId) {
    return new Promise((resolve, reject) => {
      if (!web3 || !store.state.web3.web3Instance || store.state.mdappContractInstance === null) {
        reject(new Error('MDAPP core contract not instantiated.'))
      }
      resolve()
    }).then(() => {
      return new Promise((resolve, reject) => {
        store.state.mdappContractInstance().contract.forceNSFW.estimateGas(adId, {from: store.state.web3.coinbase}, (error, gas) => {
          if (error) reject(error)

          // Set max gas to 10% above the estimated usage - just in case...
          let safeGas = Math.round(((1.1 * 10) * gas) / 10)
          resolve(safeGas)
        })
      })
    }).then(safeGas => {
      return new Promise((resolve, reject) => {
        store.state.mdappContractInstance().contract.forceNSFW(adId, {from: store.state.web3.coinbase, gas: safeGas, gasPrice: store.state.web3.gasPrice}, (error, txHash) => {
          if (error) reject(error)
          resolve(txHash)
        })
      })
    })
  }
}
