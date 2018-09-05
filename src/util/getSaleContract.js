import Raven from 'raven-js'
import contractArtifacts from '../../build/contracts/MDAPPSale'
import {store} from '../store/'

const getSaleContract = () => {
  let web3 = window.web3
  return new web3.eth.Contract(contractArtifacts.abi, contractArtifacts.networks[store.state.web3.networkId].address)
}

const initSaleContract = async () => {
  try {
    const saleContract = store.state.saleContractInstance
    if (saleContract === null) {
      throw new Error('Sale contract not instantiated.')
    }

    let web3 = store.state.web3.web3Instance()

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
  } catch (error) {
    console.error('initSaleContract:', error)
    Raven.captureException(error)
  }
}

export { getSaleContract, initSaleContract }
