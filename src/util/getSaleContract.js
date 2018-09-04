import Web3 from 'web3'
import { default as contract } from 'truffle-contract'
import contractArtifacts from '../../build/contracts/MDAPPSale'
import {store} from '../store/'

const getSaleContract = new Promise((resolve, reject) => {
  let web3 = new Web3(window.web3.currentProvider)
  let saleContract = contract(contractArtifacts)
  saleContract.setProvider(web3.currentProvider)
  resolve(saleContract.deployed())
})

const initSaleContract = () => {
  return new Promise((resolve, reject) => {
    const saleContract = store.state.saleContractInstance
    if (saleContract === null) {
      reject(new Error('Sale contract not instantiated.'))
    }

    Promise.all([
      saleContract().startTimePresale(),
      saleContract().endTimePresale(),
      saleContract().startTimeSale(),
      saleContract().wallet()]).then(values => {
      resolve(store.dispatch('initSaleContract', {
        startTimePresale: values[0].toNumber() * 1000,
        endTimePresale: values[1].toNumber() * 1000,
        startTimeSale: values[2].toNumber() * 1000,
        wallet: values[3]
      }))
    })
  })
}

export { getSaleContract, initSaleContract }
