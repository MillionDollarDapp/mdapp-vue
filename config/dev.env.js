'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  DAPP_GENESIS: 0,
  CONFIRMATIONS: 8,
  // WEB3_ENDPOINT: '"ws://localhost:7545"',
  // IMAGE_HOST: '"http://localhost:4567/static.milliondollardapp.com"',
  // API_PATH: '"http://ipfs.milliondollardapp.local"'

  WEB3_ENDPOINT: '"wss://rinkeby.infura.io/ws"',
  IMAGE_HOST: '"https://static.milliondollardapp.com"',
  API_PATH: '"https://ipfs.milliondollardapp.com"'
})
