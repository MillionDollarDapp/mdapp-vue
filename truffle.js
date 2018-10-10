// Allows us to use ES6 in our migrations and tests.
// require('babel-register')

const config = require('./deployConfig');
var HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      gas: 7000000,
      gasPrice: 10000000000,
      network_id: '5777' // Match any network id: *
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(config.rinkeby.mnemonic, config.rinkeby.endpoint)
      },
      gas: 6900000,
      gasPrice: 4000000000,
      network_id: 4
    }
  }
}
