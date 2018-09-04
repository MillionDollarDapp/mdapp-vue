import Web3 from 'web3'
import multihashes from 'multihashes'
import {store} from '../store/'

var web3 = window.web3
web3 = new Web3(web3.currentProvider)

/**
 * This file contains various helper functions.
 */
const utils = {
  /**
   * Calculates the blocknumbers of a given area.
   */
  getBlockNumbers (_x, _y, _width, _height) {
    let numbers = []
    let rightX = (_x + _width) / 10
    let bottomY = (_y + _height) / 10

    for (let x = _x / 10; x < rightX; x++) {
      for (let y = _y / 10; y < bottomY; y++) {
        numbers[x + y * 125] = true
      }
    }

    return numbers
  },

  escapeHTML (str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  },

  getUserLocale () {
    let lang = 'en-US'
    if (navigator.languages && navigator.languages.length) {
      lang = navigator.languages[0]
    } else if (navigator.language) {
      lang = navigator.language
    } else if (navigator.browserLanguage) {
      lang = navigator.browserLanguage
    }

    return lang
  },

  /**
   * Deep-copies objects (Date, Map, Array, Object)
   */
  clone (obj) {
    let copy

    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (obj instanceof Date) {
      copy = new Date()
      copy.setTime(obj.getTime())
      return copy
    }

    if (obj instanceof Map) {
      return new Map(this.clone(Array.from(obj)))
    }

    if (obj instanceof Array) {
      copy = []
      for (let i = 0, len = obj.length; i < len; i++) {
        copy[i] = this.clone(obj[i])
      }
      return copy
    }

    if (obj instanceof Object) {
      // Don't clone if the object has the 'forceRef' property
      if (obj.hasOwnProperty('forceRef')) return obj

      copy = {}
      for (const attr in obj) {
        if (obj.hasOwnProperty(attr)) {
          copy[attr] = this.clone(obj[attr])
        }
      }
      return copy
    }
    throw new Error('Unable to copy unsupported object!')
  },

  address2Referral (addr) {
    // It must be possible to derive the original ethereum address from the referral code. The goal is to obfuscate it
    // in a way, that it isn't obvious and/or too time consuming to generate it manually by just passing your 2nd address
    // to the url. Whoever wants to trick us by referring himself can still do it by switching the MetaMask account.
    // Please be fair :-)
    let code = ''
    if (addr) {
      // Cut first two letters
      code = addr.substr(2)
      // Swap n with n+1; n+2 with n+3 etc.
      // If you read this you're laughing...
      let codeSwapped = ''
      for (let i = 0; i < code.length; i = i + 2) {
        codeSwapped += code.charAt(i + 1) + code.charAt(i)
      }
      // Make it top secret by replacing all numbers with letters...
      let replaceMap = ['g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p']
      for (let i = 0; i < replaceMap.length; i++) {
        codeSwapped = codeSwapped.replace(new RegExp(i, 'g'), replaceMap[i])
      }
      code = codeSwapped
    }
    return code
  },

  referral2Address (referral) {
    if (!referral) return null

    let replaceMap = ['g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p']
    for (let i = 0; i < replaceMap.length; i++) {
      referral = referral.replace(new RegExp(replaceMap[i], 'g'), i)
    }

    let codeSwapped = ''
    for (let i = 0; i < referral.length; i = i + 2) {
      codeSwapped += referral.charAt(i + 1) + referral.charAt(i)
    }

    return '0x' + codeSwapped
  },

  ipfs2multihash (hash) {
    let mh = multihashes.fromB58String(Buffer.from(hash))
    return {
      hashFunction: '0x' + mh.slice(0, 2).toString('hex'),
      digest: '0x' + mh.slice(2).toString('hex'),
      size: mh.length - 2
    }
  },

  multihash2image (hashFunction, digest, size, storageEngine) {
    storageEngine = web3.toAscii(storageEngine)

    if (storageEngine === 'ipfs') {
      hashFunction = hashFunction.substr(2)
      digest = digest.substr(2)
      return process.env.IMAGE_HOST + '/' + multihashes.toB58String(multihashes.fromHexString(hashFunction + digest))
    }

    throw new Error('Unknown storage engine:', storageEngine)
  },

  /**
   * Fetches timestamps of blocks of the given ads.
   *
   * @param ads a map of ads or a single ad object
   */
  setBlockTimes (ads) {
    let blocks = new Map()
    let promises = []

    let getAdBlock = ad => {
      if (ad.block && !blocks.has(ad.block) && !store.state.web3.blockTimes.has(ad.block)) {
        promises.push(new Promise((resolve, reject) => {
          web3.eth.getBlock(ad.block, (error, block) => {
            if (error) reject(error)
            resolve(block)
          })
        }))
      }
    }

    if (!ads.hasOwnProperty('x')) {
      // Multipe ads
      ads.forEach(ad => {
        getAdBlock(ad)
      })
    } else {
      // Single ad
      getAdBlock(ads)
    }

    Promise.all(promises).then(values => {
      for (let i = 0; i < values.length; i++) {
        blocks.set(values[i].number, values[i].timestamp)
      }
      store.dispatch('setBlockTime', blocks)
    })
  }
}

export default utils
