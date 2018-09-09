import Raven from 'raven-js'
import contractArtifacts from '../../build/contracts/MDAPPSale'
import {store} from '../store/'
import web3Manager from './web3Manager'

const getSaleContract = () => {
  let web3 = web3Manager.getInstance()
  let web3Watcher = web3Manager.getInstance(true)
  if (!contractArtifacts.networks[store.state.web3.networkId]) {
    // Contract not deployed on this network.
    return [null, null]
  }

  return [
    web3 ? new web3.eth.Contract(contractArtifacts.abi, contractArtifacts.networks[store.state.web3.networkId].address) : null,
    web3Watcher ? new web3Watcher.eth.Contract(contractArtifacts.abi, contractArtifacts.networks[store.state.web3.networkId].address) : null
  ]
}

const initSaleContract = async () => {
  try {
    const saleContract = store.state.saleContractInstance
    if (saleContract === null) {
      throw new Error('Sale contract not instantiated.')
    }

    let web3 = web3Manager.getInstance()
    if (web3) {
      let values = await Promise.all([
        saleContract().methods.startTimePresale().call(),
        saleContract().methods.endTimePresale().call(),
        saleContract().methods.startTimeSale().call(),
        saleContract().methods.wallet().call()])

      store.dispatch('initSaleContract', {
        startTimePresale: parseInt(values[0]) * 1000,
        endTimePresale: parseInt(values[1]) * 1000,
        startTimeSale: parseInt(values[2]) * 1000,
        wallet: web3.utils.toChecksumAddress(values[3])
      })
    }
  } catch (error) {
    console.error('initSaleContract:', error)
    Raven.captureException(error)
  }
}

export { getSaleContract, initSaleContract }
