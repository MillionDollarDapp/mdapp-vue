import Web3 from 'web3'
import { default as contract } from 'truffle-contract'
import contractArtifacts from '../../build/contracts/MDAPP'
import {store} from '../store/'

const getMdappContract = new Promise((resolve, reject) => {
  let web3 = new Web3(window.web3.currentProvider)
  let mdappContract = contract(contractArtifacts)
  mdappContract.setProvider(web3.currentProvider)
  resolve(mdappContract.deployed())
})

const initMdappContract = () => {
  return new Promise((resolve, reject) => {
    const mdappContract = store.state.mdappContractInstance
    if (mdappContract === null) {
      reject(new Error('MDAPP core contract not instantiated.'))
    }

    Promise.all([
      mdappContract().presaleAdStart(),
      mdappContract().allAdStart(),
      mdappContract().owner()]).then(values => {
      resolve(store.dispatch('initMdappContract', {
        adStartPresale: values[0].toNumber() * 1000,
        adStartAll: values[1].toNumber() * 1000,
        owner: values[2]
      }))
    })
  })
}

export { getMdappContract, initMdappContract }
