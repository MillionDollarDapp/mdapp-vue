'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  CONFIRMATIONS: 8,
  DEFAULT_NETWORK: 5777,
  // DAPP_GENESIS: 0,
  // IMAGE_HOST: '"http://localhost:4567/static.milliondollardapp.com"',
  // API_PATH: '"http://ipfs.milliondollardapp.local"'

  DAPP_GENESIS: 6486868,
  IMAGE_HOST: '"https://static.milliondollardapp.com"',
  API_PATH: '"https://ipfs.milliondollardapp.com"'
})
