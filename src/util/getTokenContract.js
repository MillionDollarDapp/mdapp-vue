import contractArtifacts from '../../build/contracts/MDAPPToken'
import { store } from '../store'
import web3Manager from './web3Manager'

const getTokenContract = () => {
  let web3 = web3Manager.getInstance()
  return web3 ? new web3.eth.Contract(contractArtifacts.abi, contractArtifacts.networks[store.state.web3.networkId].address) : null
}
export default getTokenContract
