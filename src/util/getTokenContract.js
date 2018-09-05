import contractArtifacts from '../../build/contracts/MDAPPToken'
import { store } from '../store'

const getTokenContract = () => {
  let web3 = window.web3
  return new web3.eth.Contract(contractArtifacts.abi, contractArtifacts.networks[store.state.web3.networkId].address)
}
export default getTokenContract
