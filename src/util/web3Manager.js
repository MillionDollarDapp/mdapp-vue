import Web3 from 'web3'
import {store} from '../store/'
import pollWeb3 from './pollWeb3'
import filters from './filters/filters'

const web3Manager = {
  isConnected: false,
  _customProvider: null,
  _connectionAttempts: 0,
  _lastConnectionAttempt: null,

  /**
   * Setup web3 and web3Watcher instances.
   */
  init () {
    if (typeof window.web3 !== 'undefined' && (store.state.web3.isInjected === null || store.state.web3.isInjected === true)) {
      // Overwrite injected web3 with our own version.
      window.web3 = new Web3(window.web3.currentProvider)
      store.dispatch('setWeb3Instance', {web3: window.web3, injected: true})
    } else {
      // Set a default with our custom provider.
      window.web3 = new Web3(this._getCustomProvider())
      store.dispatch('setWeb3Instance', {web3: window.web3, injected: false})
    }

    // Create another web3 instance used for event subscriptions.
    window.web3Watcher = new Web3(this._getCustomProvider())
    this._lastConnectionAttempt = Math.floor(Date.now() / 1000)
    store.dispatch('setWeb3Watcher', window.web3Watcher)

    // Start polling.
    pollWeb3()
  },

  /**
   * Get a web3 instance fitting your needs.
   *
   * @param needSubscriptions whether you need subscription functionality or not
   */
  getInstance (needSubscriptions) {
    needSubscriptions = typeof needSubscriptions === 'undefined' ? false : needSubscriptions

    // If a web3 instance with subscription capabilities is requested, return the watcher instance, otherwise the
    // injected one.
    if (needSubscriptions) {
      return this.isConnected ? window.web3Watcher : false
    }
    return store.state.web3.isInjected || this.isConnected ? window.web3 : false
  },

  /**
   * Establish a new connection attempt and increment a delay between each failed attempt.
   */
  async _reconnect () {
    // Reset connectionAttempts only after a certain amount of connection stability.
    if (!this._lastConnectionAttempt && Math.floor(Date.now() / 1000) - this._lastConnectionAttempt > 30) {
      this._connectionAttempts = 0
    }

    // Higher the delay between each reconnection attempt.
    this._connectionAttempts++
    let delay = this._connectionAttempts * 500
    console.log('delay:', delay)

    await new Promise(resolve => setTimeout(resolve, delay))
    store.dispatch('setConnectionState', 'reconnecting')

    console.log('reconnecting')
    this._customProvider = null
    window.web3Watcher.setProvider(this._getCustomProvider())

    pollWeb3()
    filters.handleReconnect()
  },

  /**
   * Get an existing custom provider or new one.
   */
  _getCustomProvider () {
    return this._customProvider || this._createCustomProvider()
  },

  /**
   * Creates and returns a new custom provider.
   */
  _createCustomProvider () {
    this._customProvider = new Web3.providers.WebsocketProvider(process.env.WEB3_ENDPOINT)
    this._customProvider.on('connect', () => {
      this._handleConnect()
    })
    this._customProvider.on('end', () => {
      this._handleDisconnect()
    })
    this._customProvider.on('error', e => {
      store.dispatch('setConnectionState', 'diconnected')
      this.isConnected = false
      console.error('WS error:', e)
      this._reconnect()
    })

    return this._customProvider
  },

  /**
   * Does all necessary operations when web3 established a connection.
   */
  async _handleConnect () {
    this.isConnected = true
    store.dispatch('setConnectionState', 'connected')
    console.log(`connected to ${process.env.WEB3_ENDPOINT}`)

    // Data might have changed.
    await this._getWeb3Data()

    // Create contract instances.
    await Promise.all([
      store.dispatch('getSaleContractInstance'),
      store.dispatch('getMdappContractInstance'),
      store.dispatch('getTokenContractInstance')
    ])

    filters.init()
  },

  /**
   * Does all necessary operations when web3 lost connection.
   */
  _handleDisconnect () {
    this.isConnected = false
    store.dispatch('setConnectionState', 'diconnected')
    console.log('connection lost')
    store.dispatch('unsetContracts')
    filters.handleDisconnect()

    this._reconnect()
  },

  /**
   * Queries basic data from web3 needed after a connection has been established.
   */
  async _getWeb3Data () {
    let web3 = this.getInstance()
    if (web3) {
      try {
        let result = {}
        result.networkId = await web3.eth.net.getId()
        result.block = await web3.eth.getBlockNumber()
        result.coinbase = result.injectedWeb3 ? await web3.eth.getCoinbase() : null

        if (result.coinbase) {
          // Convert to checksumAddress.
          result.coinbase = web3.utils.toChecksumAddress(result.coinbase)

          result.balance = web3.utils.toBN(await web3.eth.getBalance(result.coinbase))
          result.balanceEth = Number(web3.utils.fromWei(result.balance, 'ether')).toFixed(3)
        }
        store.dispatch('setWeb3Data', result)
      } catch (error) {
        console.error('getWeb3Data:', error)
      }
    }
  }
}

export default web3Manager
