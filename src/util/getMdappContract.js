import contractArtifacts from '../../build/contracts/MDAPP'
import {store} from '../store/'
import web3Manager from './web3Manager'

const getMdappContract = () => {
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

const initMdappContract = async () => {
  try {
    const mdappContract = store.state.mdappContractInstance
    if (mdappContract === null) {
      throw new Error('MDAPP core contract not instantiated.')
    }

    let web3 = web3Manager.getInstance()
    if (web3) {
      let values = await Promise.all([
        mdappContract().methods.presaleAdStart().call(),
        mdappContract().methods.allAdStart().call(),
        mdappContract().methods.owner().call()])

      store.dispatch('initMdappContract', {
        adStartPresale: parseInt(values[0]) * 1000,
        adStartAll: parseInt(values[1]) * 1000,
        owner: web3.utils.toChecksumAddress(values[2])
      })
    }
  } catch (error) {
    console.error('initMdappContract:', error)
    setTimeout(() => { initMdappContract() }, 1000)
  }
}

export { getMdappContract, initMdappContract }
