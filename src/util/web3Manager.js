import Web3 from 'web3'
import {store} from '../store/'
import pollWeb3 from './pollWeb3'
import filters from './filters/filters'
import { NETWORKS } from './constants/networks'

const web3Manager = {
  isConnected: false,
  _customProvider: null,
  _connectionAttempts: 0,
  _lastConnectionAttempt: null,
  _isReconnecting: false,

  /**
   * Setup web3 and web3Watcher instances.
   */
  async init () {
    let injected
    let needsAuthorization

    // Modern dapp browsers...
    if (window.ethereum !== undefined && (store.state.web3.isInjected === null || store.state.web3.isInjected === true)) {
      window.web3 = new Web3(window.ethereum)
      injected = true
      needsAuthorization = true
    } else if (window.web3 !== undefined && (store.state.web3.isInjected === null || store.state.web3.isInjected === true)) {
      // Overwrite injected web3 with our own version.
      window.web3 = new Web3(window.web3.currentProvider)
      injected = true
    } else {
      // Set a default with our custom provider.
      window.web3 = new Web3(this._getCustomProvider())
      injected = false
    }

    let network = process.env.DEFAULT_NETWORK
    try {
      network = await window.web3.eth.net.getId()
    } catch (error) {
      console.error('init web3:', error)
    }

    store.dispatch('setWeb3Instance', {web3: window.web3, injected: injected, needsAuthorization: needsAuthorization, networkId: network})

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
    needSubscriptions = needSubscriptions === undefined ? false : needSubscriptions

    // If a web3 instance with subscription capabilities is requested, return the watcher instance, otherwise the
    // injected one.
    if (needSubscriptions) {
      return this.isConnected ? window.web3Watcher : false
    }
    return store.state.web3.isInjected || this.isConnected ? window.web3 : false
  },

  /**
   * Asks the user to allow access to account information.
   * Don't catch users denial. Handle this at the calling method.
   */
  async requestAuthorization () {
    if (store.state.web3.needsAuthorization) {
      await window.ethereum.enable()
    }
  },

  /**
   * Called by event watchers if they error out because of connection problems. Provider.on('end') doesn't fire
   * always, unfortunately.
   */
  detectedDisconnect () {
    if (!this._isReconnecting) {
      console.info('detected disconnect')
      this._handleDisconnect()
    }
  },

  /**
   * Establish a new connection attempt and increment a delay between each failed attempt.
   */
  async _reconnect () {
    if (!this._isReconnecting) {
      this._isReconnecting = true

      // Reset connectionAttempts only after a certain amount of connection stability.
      if (this._lastConnectionAttempt && Math.floor(Date.now() / 1000) - this._lastConnectionAttempt > 30) {
        this._connectionAttempts = 0
      }

      // Higher the delay between each reconnection attempt.
      this._connectionAttempts++
      let delay = this._connectionAttempts * 500
      console.info('delay:', delay)

      await new Promise(resolve => setTimeout(resolve, delay))
      store.dispatch('setConnectionState', 'reconnecting')

      console.info('reconnecting')
      this._lastConnectionAttempt = Math.floor(Date.now() / 1000)
      this._customProvider = null
      window.web3Watcher.setProvider(this._getCustomProvider())
      this._isReconnecting = false
    }
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
    let network = store.state.web3.networkId
    if (!network) network = process.env.DEFAULT_NETWORK

    let endpoint = process.env.WEB3_ENDPOINT[network]
    if (NETWORKS[network].appendProjectID) endpoint += process.env.INFURA_PROJECT_ID

    this._customProvider = new Web3.providers.WebsocketProvider(endpoint)
    this._customProvider.on('connect', (e) => {
      this._handleConnect(e)
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
  async _handleConnect (e) {
    this.isConnected = true
    this._isReconnecting = false
    store.dispatch('setConnectionState', 'connected')
    console.info('connected:', e)

    try {
      // Data might have changed.
      await this._getWeb3Data()

      // Create contract instances.
      await Promise.all([
        store.dispatch('getSaleContractInstance'),
        store.dispatch('getMdappContractInstance'),
        store.dispatch('getTokenContractInstance')
      ])

      pollWeb3()
      filters.init()
      filters.handleReconnect()
    } catch (error) {
      this.detectedDisconnect()
    }
  },

  /**
   * Does all necessary operations when web3 lost connection.
   */
  _handleDisconnect () {
    this.isConnected = false
    this._isReconnecting = false
    store.dispatch('setConnectionState', 'diconnected')
    console.info('connection lost')
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
    }
  }
}

export default web3Manager
