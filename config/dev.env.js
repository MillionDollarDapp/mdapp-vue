'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  START_BLOCK: 0,
  CONFIRMATIONS: 8,
  WEB3_ENDPOINT: '"http://localhost:7545"',
  IMAGE_HOST: '"http://localhost:4567/static.milliondollardapp.com"',
  API_PATH: '"http://ipfs.milliondollardapp.local"',
})
