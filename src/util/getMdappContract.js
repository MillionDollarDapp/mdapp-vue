import Raven from 'raven-js'
import contractArtifacts from '../../build/contracts/MDAPP'
import {store} from '../store/'

const getMdappContract = () => {
  let web3 = store.state.web3.web3Instance()
  return new web3.eth.Contract(contractArtifacts.abi, contractArtifacts.networks[store.state.web3.networkId].address)
}

const initMdappContract = async () => {
  try {
    const mdappContract = store.state.mdappContractInstance
    if (mdappContract === null) {
      throw new Error('MDAPP core contract not instantiated.')
    }

    let web3 = store.state.web3.web3Instance()

    let values = await Promise.all([
      mdappContract().methods.presaleAdStart().call(),
      mdappContract().methods.allAdStart().call(),
      mdappContract().methods.owner().call()])

    store.dispatch('initMdappContract', {
      adStartPresale: parseInt(values[0]) * 1000,
      adStartAll: parseInt(values[1]) * 1000,
      owner: web3.utils.toChecksumAddress(values[2])
    })
  } catch (error) {
    console.error('initMdappContract:', error)
    Raven.captureException(error)
  }
}

export { getMdappContract, initMdappContract }
