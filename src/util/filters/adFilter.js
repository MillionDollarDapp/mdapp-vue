import Raven from 'raven-js'
import {store} from '../../store/'
import utils from '../utils'
import { watchTransaction } from '../transaction'
import { AD_MAXLENGTH } from '../constants/adMaxlength'
import web3Manager from '../web3Manager'

const adFilter = {

  _userClaimFilter: null,
  _userReleaseFilter: null,
  _userEditAdFilter: null,
  _allClaimFilter: null,
  _allReleaseFilter: null,
  _allEditAdFilter: null,
  _allNSFWFilter: null,

  /**
   * Get all ads and involved transactions of the current user. Also considers releases.
   * Call it once at app initialization or on coinbase changes.
   */
  async getUserAds () {
    // Will hold all current ads of the user. Ordering is not important.
    let ads = new Map()

    // Will hold all transactions which caused an event.
    let txs = new Map()

    let claimPromise = store.state.mdappContractInstanceWatcher().getPastEvents('Claim', {
      filter: { owner: store.state.web3.coinbase },
      fromBlock: process.env.DAPP_GENESIS,
      toBlock: store.state.web3.block
    })

    let releasePromise = store.state.mdappContractInstanceWatcher().getPastEvents('Release', {
      filter: { owner: store.state.web3.coinbase },
      fromBlock: process.env.DAPP_GENESIS,
      toBlock: store.state.web3.block
    })

    let editPromise = store.state.mdappContractInstanceWatcher().getPastEvents('EditAd', {
      filter: { owner: store.state.web3.coinbase },
      fromBlock: process.env.DAPP_GENESIS,
      toBlock: store.state.web3.block
    })

    try {
      let values = await Promise.all([claimPromise, releasePromise, editPromise])

      // 1st process all claims the user ever made.
      for (let key in values[0]) {
        let log = values[0][key]
        if (!txs.has(log.blockNumber)) {
          txs.set(log.blockNumber, [])
        }
        this._processInitLog(txs, ads, log)
      }

      // 2nd delete all ads the user released.
      for (let key in values[1]) {
        let log = values[1][key]
        if (!txs.has(log.blockNumber)) {
          txs.set(log.blockNumber, [])
        }
        this._processInitLog(txs, ads, log)
      }

      // 3rd apply edits of all current ads
      for (let key in values[2]) {
        let log = values[2][key]
        if (!txs.has(log.blockNumber)) {
          txs.set(log.blockNumber, [])
        }
        this._processInitLog(txs, ads, log)
      }
    } catch (error) {
      console.error('getUserAds:', error)
      if (error.message.toLowerCase().indexOf('connect') !== -1) {
        web3Manager.detectedDisconnect()
      }
    }

    return { ads: ads, txs: txs }
  },

  /**
   * Helps interpreting the event log.
   *
   * @param txs Map of transactions blockNumber -> transactionIndex -> transaction
   * @param ads Array of ads
   * @param log of the event
   * @private
   */
  _processInitLog (txs, ads, log) {
    let tx = {
      hash: log.transactionHash,
      status: store.state.web3.block - log.blockNumber >= process.env.CONFIRMATIONS ? 'completed' : 'confirmed',
      block: log.blockNumber
    }

    let values = log.returnValues
    let adId = parseInt(values.id)
    let hasUploaded = store.state.helperProgress[5]

    switch (log.event) {
      case 'Claim':
        tx.desc = `Claim ${values.width * values.height * 100} pixels.`

        // Save ad data at index = id of ad
        ads.set(adId, {
          id: adId,
          block: log.blockNumber ? log.blockNumber : null,
          time: null,
          x: parseInt(values.x) * 10,
          y: parseInt(values.y) * 10,
          width: parseInt(values.width) * 10,
          height: parseInt(values.height) * 10,
          owner: values.owner,
          isCurrentUser: true,
          link: null,
          title: null,
          text: null,
          contact: null,
          nsfw: false,
          image: null,
          mh: null
        })
        break

      case 'Release':
        let pixels = 0

        try {
          pixels = ads.get(adId).width * ads.get(adId).height
        } catch (e) {
          // We should never be here...
          console.error('Releasing an ad which hasn\'t been seen before.', e)
          Raven.captureException(e)
        }

        tx.desc = `Remove ad and release ${pixels} pixels.`
        ads.delete(adId)
        break

      case 'EditAd':
        try {
          tx.desc = `Edit ad #${adId}.`
          let ad = ads.get(adId)
          if (ad) {
            ad.block = log.blockNumber ? log.blockNumber : null
            ad.link = values.link.substr(0, AD_MAXLENGTH.link).trim()
            ad.title = utils.escapeHTML(values.title.substr(0, AD_MAXLENGTH.title).trim())
            ad.text = utils.escapeHTML(values.text.substr(0, AD_MAXLENGTH.text).trim())
            ad.contact = utils.escapeHTML(values.contact.substr(0, AD_MAXLENGTH.contact).trim())
            ad.nsfw = values.NSFW
            ad.image = utils.multihash2image(values.hashFunction, values.digest, values.size, values.storageEngine)
            ad.mh = {
              hashFunction: values.hashFunction,
              digest: values.digest,
              size: parseInt(values.size)
            }

            if (!hasUploaded) {
              hasUploaded = true
              store.dispatch('setHelperProgress', ['upload', true])
            }
          }
        } catch (error) {
          console.error('Edit ad:', adId)
          Raven.captureException(error)
        }
        break

      default:
        tx.desc = 'Unknown mdapp transaction type.'
    }

    let blockTxs = txs.get(log.blockNumber)
    blockTxs[log.transactionIndex] = tx
    txs.set(log.blockNumber, blockTxs)
  },

  stopWatchUser () {
    if (this._userClaimFilter) {
      try {
        this._userClaimFilter.unsubscribe()
        this._userReleaseFilter.unsubscribe()
        this._userEditAdFilter.unsubscribe()
      } catch (error) {
        if (error.message.toLowerCase().indexOf('connect') !== -1) {
          web3Manager.detectedDisconnect()
        }
        return false
      }
    }
    return true
  },
  watchUserAds () {
    if (!this.stopWatchUser()) return

    this._userClaimFilter = store.state.mdappContractInstanceWatcher().events.Claim({
      filter: { owner: store.state.web3.coinbase },
      fromBlock: store.state.nextBlockUserClaim,
      toBlock: 'latest'
    })
      .on('data', event => {
        this._processWatchLog(event, 'user')
        store.dispatch('setNextFilterBlock', { filter: 'UserClaim', block: event.blockNumber + 1 })
      })
      .on('change', event => {
        Raven.captureMessage('A claim event has been removed from blockchain', {
          level: 'warning',
          extra: { event: event }
        })
      })
      .on('error', error => {
        console.error('User claim watch:', error)
        if (error.message.toLowerCase().indexOf('connect') !== -1) {
          web3Manager.detectedDisconnect()
        }
      })

    this._userReleaseFilter = store.state.mdappContractInstanceWatcher().events.Release({
      filter: { owner: store.state.web3.coinbase },
      fromBlock: store.state.nextBlockUserRelease,
      toBlock: 'latest'
    })
      .on('data', event => {
        this._processWatchLog(event, 'user')
        store.dispatch('setNextFilterBlock', { filter: 'UserRelease', block: event.blockNumber + 1 })
      })
      .on('change', event => {
        Raven.captureMessage('A release event has been removed from blockchain', {
          level: 'warning',
          extra: { event: event }
        })
      })
      .on('error', error => {
        console.error('User release watch:', error)
        if (error.message.toLowerCase().indexOf('connect') !== -1) {
          web3Manager.detectedDisconnect()
        }
      })

    this._userEditAdFilter = store.state.mdappContractInstanceWatcher().events.EditAd({
      filter: { owner: store.state.web3.coinbase },
      fromBlock: store.state.nextBlockUserEdit,
      toBlock: 'latest'
    })
      .on('data', event => {
        this._processWatchLog(event, 'user')
        store.dispatch('setNextFilterBlock', { filter: 'UserEdit', block: event.blockNumber + 1 })
      })
      .on('change', event => {
        Raven.captureMessage('An editAd event has been removed from blockchain', {
          level: 'warning',
          extra: { event: event }
        })
      })
      .on('error', error => {
        console.error('User editAd watch:', error)
        if (error.message.toLowerCase().indexOf('connect') !== -1) {
          web3Manager.detectedDisconnect()
        }
      })
  },

  /**
   * Receives live event logs and processes them.
   */
  _processWatchLog (log, target) {
    let values = log.returnValues

    // Is this about the current user?
    let isUser = values.owner === store.state.web3.coinbase

    // To determine if we have to change the helper progress
    let hasClaimed = store.state.helperProgress[4]
    let hasUploaded = store.state.helperProgress[5]

    let adId = parseInt(values.id)
    let ad = {}

    let tx = null
    if (target === 'user') {
      tx = store.state.transactions.get(log.transactionHash)

      if (!tx) {
        // New user transaction found.
        tx = {
          hash: log.transactionHash,
          status: store.state.web3.block - log.blockNumber >= process.env.CONFIRMATIONS ? 'completed' : 'confirmed',
          block: log.blockNumber,
          dirty: true // temporary flag to indicate we have to add it to the watchlist
        }
      }
    }

    switch (log.event) {
      case 'Claim':
        ad = {
          id: adId,
          block: log.blockNumber ? log.blockNumber : null,
          time: null,
          x: parseInt(values.x) * 10,
          y: parseInt(values.y) * 10,
          width: parseInt(values.width) * 10,
          height: parseInt(values.height) * 10,
          owner: values.owner,
          isCurrentUser: isUser,
          link: null,
          title: null,
          text: null,
          contact: null,
          nsfw: false,
          image: null,
          mh: null
        }

        if (target === 'user') {
          if (!hasClaimed) {
            hasClaimed = true
            store.dispatch('setHelperProgress', ['claim', true])
          }

          // Set tx-description if it's new.
          if (tx.hasOwnProperty('dirty')) {
            tx.desc = `Claim ${values.width * values.height * 100} pixels.`
          }
        }

        break

      case 'Release':
        ad = target === 'user' ? store.state.myAds.get(adId) : store.state.allAds.get(adId)
        if (ad) {
          // Set tx-description if it's new.
          if (target === 'user' && tx.hasOwnProperty('dirty')) {
            let pixels = ad.width * ad.height
            tx.desc = `Remove ad and release ${pixels} pixels.`
          }

          if (target === 'all') {
            store.dispatch('removeForceNSFW', adId)
          }
        } else {
          console.error('Release log:', new Error(`Releasing unknown ad (#${adId}.`))
          Raven.captureException(new Error(`Releasing unknown ad (#${adId}.`))
        }
        break

      case 'EditAd':
        ad = target === 'user' ? store.state.myAds.get(adId) : store.state.allAds.get(adId)

        try {
          if (ad) {
            ad.block = log.blockNumber ? log.blockNumber : null
            ad.link = values.link.substr(0, AD_MAXLENGTH.link).trim()
            ad.title = utils.escapeHTML(values.title.substr(0, AD_MAXLENGTH.title).trim())
            ad.text = utils.escapeHTML(values.text.substr(0, AD_MAXLENGTH.text).trim())
            ad.contact = utils.escapeHTML(values.contact.substr(0, AD_MAXLENGTH.contact).trim())
            ad.nsfw = values.NSFW
            ad.image = utils.multihash2image(values.hashFunction, values.digest, values.size, values.storageEngine)
            ad.mh = {
              hashFunction: values.hashFunction,
              digest: values.digest,
              size: parseInt(values.size)
            }

            if (target === 'user' && !hasUploaded && ad.image) {
              hasUploaded = true
              store.dispatch('setHelperProgress', ['upload', true])
            }
          }

          if (target === 'user' && tx.hasOwnProperty('dirty')) {
            tx.desc = `Edit ad #${adId}.`
          }
        } catch (error) {
          console.error('Edit log:', error)
          Raven.captureException(error)
        }
        break

      default:
        return
    }

    // Add ad to processing queue
    store.dispatch('addToQueue', {ad: ad, event: log.event, target: target})

    // Care about new transactions.
    if (target === 'user') {
      if (tx.hasOwnProperty('dirty')) {
        delete tx.dirty
        store.dispatch('addTransaction', tx)
        if (tx.status !== 'completed') watchTransaction(tx)
      }
    }
  },

  /**
   * Get information about all currently active ads.
   * @param adIds list of ids of currently active ads
   */
  async getAllAds (adIds) {
    // Will hold all ads
    let ads = new Map()

    // Compare ownership with current coinbase
    let coinbase = store.state.web3.coinbase

    try {
      // TODO: load a bootstrap json
      // 1st get claim events
      // 'Release' can be avoided since we filter already for active ads.
      let pastClaims = await store.state.mdappContractInstanceWatcher().getPastEvents('Claim', {
        filter: { id: adIds },
        fromBlock: process.env.DAPP_GENESIS,
        toBlock: store.state.web3.block
      })

      for (let key in pastClaims) {
        let log = pastClaims[key]
        this._processInitAllLog(ads, parseInt(log.returnValues.id), coinbase, log)
      }

      // 2nd get all edits of these ads.
      let pastEdits = await store.state.mdappContractInstanceWatcher().getPastEvents('EditAd', {
        filter: { id: adIds },
        fromBlock: process.env.DAPP_GENESIS,
        toBlock: store.state.web3.block
      })

      for (let key in pastEdits) {
        let log = pastEdits[key]
        this._processInitAllLog(ads, parseInt(log.returnValues.id), coinbase, log)
      }

      // 3rd get NSFWs
      let pastNSFWs = await store.state.mdappContractInstanceWatcher().getPastEvents('ForceNSFW', {
        filter: { id: adIds },
        fromBlock: process.env.DAPP_GENESIS,
        toBlock: store.state.web3.block
      })

      for (let key in pastNSFWs) {
        let log = pastNSFWs[key]
        if (ads.has(log.returnValues.id)) {
          store.dispatch('forceNSFW', parseInt(log.returnValues.id))
        }
      }
    } catch (error) {
      console.error('getAllAds:', error)
      if (error.message.toLowerCase().indexOf('connect') !== -1) {
        web3Manager.detectedDisconnect()
      }
    }

    return ads
  },

  stopWatchAll () {
    if (this._allClaimFilter) {
      try {
        this._allClaimFilter.unsubscribe()
        this._allReleaseFilter.unsubscribe()
        this._allEditAdFilter.unsubscribe()
        this._allNSFWFilter.unsubscribe()
      } catch (error) {
        if (error.message.toLowerCase().indexOf('connect') !== -1) {
          web3Manager.detectedDisconnect()
        }
        return false
      }
    }
    return true
  },
  watchAllAds () {
    if (!this.stopWatchAll()) return

    // Claim watching
    this._allClaimFilter = store.state.mdappContractInstanceWatcher().events.Claim({
      fromBlock: store.state.nextBlockAllClaim,
      toBlock: 'latest'
    })
      .on('data', event => {
        this._processWatchLog(event, 'all')
        store.dispatch('setNextFilterBlock', { filter: 'AllClaim', block: event.blockNumber + 1 })
      })
      .on('changed', event => {
        Raven.captureMessage('A claim event has been removed from blockchain', {
          level: 'warning',
          extra: { event: event }
        })
      })
      .on('error', error => {
        console.error('Other watch claim:', error)
        if (error.message.toLowerCase().indexOf('connect') !== -1) {
          web3Manager.detectedDisconnect()
        }
      })

    // Release watching
    this._allReleaseFilter = store.state.mdappContractInstanceWatcher().events.Release({
      fromBlock: store.state.nextBlockAllRelease,
      toBlock: 'latest'
    })
      .on('data', event => {
        this._processWatchLog(event, 'all')
        store.dispatch('setNextFilterBlock', { filter: 'AllRelease', block: event.blockNumber + 1 })
      })
      .on('changed', event => {
        Raven.captureMessage('A release event has been removed from blockchain', {
          level: 'warning',
          extra: { event: event }
        })
      })
      .on('error', error => {
        console.error('Other watch release:', error)
        if (error.message.toLowerCase().indexOf('connect') !== -1) {
          web3Manager.detectedDisconnect()
        }
      })

    // EditAd watching
    this._allEditAdFilter = store.state.mdappContractInstanceWatcher().events.EditAd({
      fromBlock: store.state.nextBlockAllEdit,
      toBlock: 'latest'
    })
      .on('data', event => {
        this._processWatchLog(event, 'all')
        store.dispatch('setNextFilterBlock', { filter: 'AllEdit', block: event.blockNumber + 1 })
      })
      .on('changed', event => {
        Raven.captureMessage('An edit event has been removed from blockchain', {
          level: 'warning',
          extra: { event: event }
        })
      })
      .on('error', error => {
        console.error('Other watch editAd:', error)
        if (error.message.toLowerCase().indexOf('connect') !== -1) {
          web3Manager.detectedDisconnect()
        }
      })

    // ForceNSFW watching
    this._allNSFWFilter = store.state.mdappContractInstanceWatcher().events.ForceNSFW({
      fromBlock: store.state.nextBlockAllNSFW,
      toBlock: 'pending'
    })
      .on('data', event => {
        store.dispatch('forceNSFW', parseInt(event.returnValues.id))
        store.dispatch('setNextFilterBlock', { filter: 'AllNSFW', block: event.blockNumber + 1 })
      })
      .on('changed', event => {
        Raven.captureMessage('An ForceNSFW event has been removed from blockchain', {
          level: 'warning',
          extra: { event: event }
        })
      })
      .on('error', error => {
        console.error('Other watch forceNSFW:', error)
        if (error.message.toLowerCase().indexOf('connect') !== -1) {
          web3Manager.detectedDisconnect()
        }
      })
  },

  _processInitAllLog (ads, adId, coinbase, log) {
    let values = log.returnValues

    switch (log.event) {
      case 'Claim':
        ads.set(adId, {
          id: adId,
          block: log.blockNumber ? log.blockNumber : null,
          time: null,
          x: parseInt(values.x) * 10,
          y: parseInt(values.y) * 10,
          width: parseInt(values.width) * 10,
          height: parseInt(values.height) * 10,
          owner: values.owner,
          isCurrentUser: values.owner === coinbase,
          link: null,
          title: null,
          text: null,
          contact: null,
          nsfw: false,
          image: null,
          mh: null
        })
        break

      case 'Release':
        ads.delete(adId)
        break

      case 'EditAd':
        try {
          let ad = ads.get(adId)
          if (ad) {
            ad.block = log.blockNumber ? log.blockNumber : null
            ad.link = values.link.substr(0, AD_MAXLENGTH.link).trim()
            ad.title = utils.escapeHTML(values.title.substr(0, AD_MAXLENGTH.title).trim())
            ad.text = utils.escapeHTML(values.text.substr(0, AD_MAXLENGTH.text).trim())
            ad.contact = utils.escapeHTML(values.contact.substr(0, AD_MAXLENGTH.contact).trim())
            ad.nsfw = values.NSFW
            ad.image = utils.multihash2image(values.hashFunction, values.digest, values.size, values.storageEngine)
            ad.mh = {
              hashFunction: values.hashFunction,
              digest: values.digest,
              size: parseInt(values.size)
            }
          }
        } catch (error) {
          console.error('Edit foreign ad:', error)
          Raven.captureException(error)
        }
        break
    }
  }
}

export default adFilter
