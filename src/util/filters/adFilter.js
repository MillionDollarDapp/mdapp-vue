import Raven from 'raven-js'
import {store} from '../../store/'
import utils from '../utils'
import { watchTransaction } from '../transaction'
import { AD_MAXLENGTH } from '../constants/adMaxlength'

const adFilter = {

  _claimFilter: null,
  _releaseFilter: null,
  _editAdFilter: null,

  /**
   * Get all ads and involved transactions of the current user. Also considers releases.
   * Call it once at app initialization or on coinbase changes.
   */
  async getUserAds () {
    // TODO: call all filters asynchronously and merge once they all finished.

    // Will hold all current ads of the user. Ordering is not important.
    let ads = new Map()

    // Will hold all transactions which caused an event.
    let txs = new Map()

    try {
      // 1st get all ad ids the current user ever had.
      await new Promise((resolve, reject) => {
        let claimFilter = store.state.mdappContractInstance().contract.Claim({
          owner: store.state.web3.coinbase
        }, {
          fromBlock: process.env.START_BLOCK,
          toBlock: store.state.web3.block
        }).get((error, logs) => {
          if (error) reject(error)

          for (let key in logs) {
            let log = logs[key]

            if (!txs.has(log.blockNumber)) {
              txs.set(log.blockNumber, [])
            }

            this._processInitLog(txs, ads, log)
          }

          claimFilter.stopWatching()
          resolve()
        })
      })

      // 2nd delete all ads the user released.
      await new Promise((resolve, reject) => {
        let releaseFilter = store.state.mdappContractInstance().contract.Release({
          owner: store.state.web3.coinbase
        }, {
          fromBlock: process.env.START_BLOCK,
          toBlock: store.state.web3.block
        }).get((error, logs) => {
          if (error) reject(error)

          for (let key in logs) {
            let log = logs[key]

            if (!txs.has(log.blockNumber)) {
              txs.set(log.blockNumber, [])
            }

            this._processInitLog(txs, ads, log)
          }

          releaseFilter.stopWatching()
          resolve()
        })
      })

      // 3rd refresh data of all current ads
      await new Promise((resolve, reject) => {
        let editAdFilter = store.state.mdappContractInstance().contract.EditAd({
          owner: store.state.web3.coinbase
        }, {
          fromBlock: process.env.START_BLOCK,
          toBlock: store.state.web3.block
        }).get((error, logs) => {
          if (error) reject(error)

          for (let key in logs) {
            let log = logs[key]

            if (!txs.has(log.blockNumber)) {
              txs.set(log.blockNumber, [])
            }

            this._processInitLog(txs, ads, log)
          }

          editAdFilter.stopWatching()
          resolve()
        })
      })
    } catch (error) {
      Raven.captureException(error)
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

    let adId = log.args.id.toNumber()
    let hasUploaded = store.state.helperProgress[5]

    switch (log.event) {
      case 'Claim':
        tx.desc = `Claim ${log.args.width.toNumber() * log.args.height.toNumber() * 100} pixels.`

        // Save ad data at index = id of ad
        ads.set(adId, {
          id: adId,
          block: log.blockNumber ? log.blockNumber : null,
          time: null,
          x: log.args.x.toNumber() * 10,
          y: log.args.y.toNumber() * 10,
          width: log.args.width.toNumber() * 10,
          height: log.args.height.toNumber() * 10,
          owner: log.args.owner,
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
            ad.link = log.args.link.substr(0, AD_MAXLENGTH.link).trim()
            ad.title = utils.escapeHTML(log.args.title.substr(0, AD_MAXLENGTH.title).trim())
            ad.text = utils.escapeHTML(log.args.text.substr(0, AD_MAXLENGTH.text).trim())
            ad.contact = utils.escapeHTML(log.args.contact.substr(0, AD_MAXLENGTH.contact).trim())
            ad.nsfw = log.args.NSFW
            ad.image = utils.multihash2image(log.args.hashFunction, log.args.digest, log.args.size, log.args.storageEngine)
            ad.mh = {
              hashFunction: log.args.hashFunction,
              digest: log.args.digest,
              size: log.args.size.toNumber()
            }

            if (!hasUploaded) {
              hasUploaded = true
              store.dispatch('setHelperProgress', ['upload', true])
            }
          }
        } catch (error) {
          console.log('Edit ad:', adId)
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

  watchUserAds () {
    if (this._claimFilter) {
      // Stop old filters
      this._claimFilter.stopWatching()
      this._releaseFilter.stopWatching()
      this._editAdFilter.stopWatching()
    }

    this._claimFilter = store.state.mdappContractInstance().contract.Claim({
      owner: store.state.web3.coinbase
    }, {
      fromBlock: store.state.initBlock,
      toBlock: 'pending'
    }).watch((error, log) => {
      if (error) {
        console.error('User claim watch:', error)
        Raven.captureException(error)
        return
      }

      this._processWatchLog(log, 'user')
    })

    this._releaseFilter = store.state.mdappContractInstance().contract.Release({
      owner: store.state.web3.coinbase
    }, {
      fromBlock: store.state.initBlock,
      toBlock: 'pending'
    }).watch((error, log) => {
      if (error) {
        console.error('User release watch:', error)
        Raven.captureException(error)
        return
      }
      this._processWatchLog(log, 'user')
    })

    this._editAdFilter = store.state.mdappContractInstance().contract.EditAd({
      owner: store.state.web3.coinbase
    }, {
      fromBlock: store.state.initBlock,
      toBlock: 'pending'
    }).watch((error, log) => {
      if (error) {
        console.error('User editAd watch:', error)
        Raven.captureException(error)
        return
      }
      this._processWatchLog(log, 'user')
    })
  },

  /**
   * Receives live event logs and processes them.
   */
  _processWatchLog (log, target) {
    // Is this about the current user?
    let isUser = log.args.owner === store.state.web3.coinbase

    // To determine if we have to change the helper progress
    let hasClaimed = store.state.helperProgress[4]
    let hasUploaded = store.state.helperProgress[5]

    let adId = log.args.id.toNumber()
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
          x: log.args.x.toNumber() * 10,
          y: log.args.y.toNumber() * 10,
          width: log.args.width.toNumber() * 10,
          height: log.args.height.toNumber() * 10,
          owner: log.args.owner,
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
            tx.desc = `Claim ${log.args.width.toNumber() * log.args.height.toNumber() * 100} pixels.`
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
            ad.link = log.args.link.substr(0, AD_MAXLENGTH.link).trim()
            ad.title = utils.escapeHTML(log.args.title.substr(0, AD_MAXLENGTH.title).trim())
            ad.text = utils.escapeHTML(log.args.text.substr(0, AD_MAXLENGTH.text).trim())
            ad.contact = utils.escapeHTML(log.args.contact.substr(0, AD_MAXLENGTH.contact).trim())
            ad.nsfw = log.args.NSFW
            ad.image = utils.multihash2image(log.args.hashFunction, log.args.digest, log.args.size, log.args.storageEngine)
            ad.mh = {
              hashFunction: log.args.hashFunction,
              digest: log.args.digest,
              size: log.args.size.toNumber()
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
      // 1st get claim events
      // 'Release' can be avoided since we won't find such events for active ads.
      await new Promise((resolve, reject) => {
        let claimFilter = store.state.mdappContractInstance().contract.Claim({
          id: adIds
        }, {
          fromBlock: process.env.START_BLOCK,
          toBlock: store.state.web3.block
        }).get((error, logs) => {
          if (error) reject(error)

          for (let key in logs) {
            let log = logs[key]

            let adId = log.args.id.toNumber()
            this._processInitAllLog(ads, adId, coinbase, log)
          }

          claimFilter.stopWatching()
          resolve()
        })
      })

      // 2nd get all edits of these ads.
      await new Promise((resolve, reject) => {
        let editAdFilter = store.state.mdappContractInstance().contract.EditAd({
          id: adIds
        }, {
          fromBlock: process.env.START_BLOCK,
          toBlock: store.state.web3.block
        }).get((error, logs) => {
          if (error) reject(error)

          for (let key in logs) {
            let log = logs[key]

            let adId = log.args.id.toNumber()
            this._processInitAllLog(ads, adId, coinbase, log)
          }

          editAdFilter.stopWatching()
          resolve()
        })
      })

      // 4th get NSFWs
      await new Promise((resolve, reject) => {
        let nsfwFilter = store.state.mdappContractInstance().contract.ForceNSFW({
          id: adIds
        }, {
          fromBlock: process.env.START_BLOCK,
          toBlock: store.state.web3.block
        }).get((error, logs) => {
          if (error) reject(error)

          for (let key in logs) {
            let log = logs[key]

            let adId = log.args.id.toNumber()
            if (ads.has(adId)) {
              store.dispatch('forceNSFW', adId)
            }
          }

          nsfwFilter.stopWatching()
          resolve()
        })
      })
    } catch (error) {
      console.error('getAllAds:', error)
      Raven.captureException(error)
    }

    return ads
  },

  watchAllAds () {
    // Claim watching
    store.state.mdappContractInstance().contract.Claim({}, {
      fromBlock: store.state.initBlock,
      toBlock: 'latest'
    }).watch((error, log) => {
      if (error) {
        console.error('All claim watch:', error)
        Raven.captureException(error)
        return
      }

      this._processWatchLog(log, 'all')
    })

    // Release watching
    store.state.mdappContractInstance().contract.Release({}, {
      fromBlock: store.state.initBlock,
      toBlock: 'latest'
    }).watch((error, log) => {
      if (error) {
        console.error('All release watch:', error)
        Raven.captureException(error)
        return
      }

      this._processWatchLog(log, 'all')
    })

    // EditAd watching
    store.state.mdappContractInstance().contract.EditAd({}, {
      fromBlock: store.state.initBlock,
      toBlock: 'latest'
    }).watch((error, log) => {
      if (error) {
        console.error('All editAd watch:', error)
        Raven.captureException(error)
        return
      }

      this._processWatchLog(log, 'all')
    })

    // ForceNSFW watching
    store.state.mdappContractInstance().contract.ForceNSFW({}, {
      fromBlock: store.state.initBlock,
      toBlock: 'pending'
    }).watch((error, log) => {
      if (error) {
        Raven.captureException(error)
        return
      }

      store.dispatch('forceNSFW', log.args.id.toNumber())
    })
  },

  _processInitAllLog (ads, adId, coinbase, log) {
    switch (log.event) {
      case 'Claim':
        ads.set(adId, {
          id: adId,
          block: log.blockNumber ? log.blockNumber : null,
          time: null,
          x: log.args.x.toNumber() * 10,
          y: log.args.y.toNumber() * 10,
          width: log.args.width.toNumber() * 10,
          height: log.args.height.toNumber() * 10,
          owner: log.args.owner,
          isCurrentUser: log.args.owner === coinbase,
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
            ad.link = log.args.link.substr(0, AD_MAXLENGTH.link).trim()
            ad.title = utils.escapeHTML(log.args.title.substr(0, AD_MAXLENGTH.title).trim())
            ad.text = utils.escapeHTML(log.args.text.substr(0, AD_MAXLENGTH.text).trim())
            ad.contact = utils.escapeHTML(log.args.contact.substr(0, AD_MAXLENGTH.contact).trim())
            ad.nsfw = log.args.NSFW
            ad.image = utils.multihash2image(log.args.hashFunction, log.args.digest, log.args.size, log.args.storageEngine)
            ad.mh = {
              hashFunction: log.args.hashFunction,
              digest: log.args.digest,
              size: log.args.size.toNumber()
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
