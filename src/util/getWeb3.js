import Web3 from 'web3'
import Raven from 'raven-js'

const getWeb3 = async () => {
  let result = {}

  let web3js = window.web3
  if (typeof web3js !== 'undefined') {
    let withMetamask = web3js.hasOwnProperty('withMetamask') && web3js.withMetamask
    let web3 = new Web3(web3js.currentProvider)
    result = {
      injectedWeb3: withMetamask,
      web3 () {
        return web3
      }
    }
  } else {
    window.web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.WEB3_ENDPOINT))
    result = {
      injectedWeb3: false,
      web3 () {
        return window.web3
      }
    }
  }

  // Make sure we have 2nd web3 instance to bypass MetaMasks subscription restrictions.
  if (typeof window.web3Watcher === 'undefined') {
    window.web3Watcher = new Web3(new Web3.providers.WebsocketProvider(process.env.WEB3_ENDPOINT))
  }
  result.web3Watcher = () => {
    return window.web3Watcher
  }

  // Get web3 state
  try {
    result.networkId = await result.web3().eth.net.getId()
    result.block = await result.web3().eth.getBlockNumber()
    result.coinbase = result.injectedWeb3 ? await result.web3().eth.getCoinbase() : null

    if (result.coinbase) {
      // Convert to checksumAddress.
      result.coinbase = result.web3().utils.toChecksumAddress(result.coinbase)

      result.balance = result.web3().utils.toBN(await result.web3().eth.getBalance(result.coinbase))
      result.balanceEth = Number(result.web3().utils.fromWei(result.balance, 'ether')).toFixed(3)
    }
  } catch (error) {
    console.error('getWeb3:', error)
    Raven.captureException(error)
  }

  return result
}

export default getWeb3
