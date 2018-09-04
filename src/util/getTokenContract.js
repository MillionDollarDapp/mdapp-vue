import Web3 from 'web3'
import { default as contract } from 'truffle-contract'
import contractArtifacts from '../../build/contracts/MDAPPToken'

const getTokenContract = new Promise((resolve, reject) => {
  let web3 = new Web3(window.web3.currentProvider)
  let tokenContract = contract(contractArtifacts)
  tokenContract.setProvider(web3.currentProvider)
  resolve(tokenContract.deployed())
})
export default getTokenContract
