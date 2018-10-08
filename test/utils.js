module.exports.increaseTime = function increaseTime(duration) {
  const id = Date.now()

  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync(
      {
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [duration],
        id: id
      },
      err1 => {
        if (err1) reject(err1)

        web3.currentProvider.sendAsync(
          {
            jsonrpc: "2.0",
            method: "evm_mine",
            id: id + 1
          },
          (err2, res) => {
            err2 ? reject(err2) : resolve(res)
          }
        )
      }
    )
  })
}

module.exports.makeSnapshot = function makeSnapshot() {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync(
      {
        jsonrpc: "2.0",
        method: "evm_snapshot",
        params: [],
        id: Date.now()
      },
      err1 => {
        if (err1) reject(err1)
      }
    )
  })
}

module.exports.revert = function revert() {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync(
      {
        jsonrpc: "2.0",
        method: "evm_revert",
        params: [],
        id: Date.now()
      },
      err1 => {
        if (err1) reject(err1)
      }
    )
  })
}

module.exports.sleep = function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const BigNumber = web3.BigNumber
const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

module.exports.should = should
module.exports.EVMThrow = 'revert'

module.exports.latestTime = function latestTime() {
  return Math.floor(new Date().getTime()/1000)
}

module.exports.calcRate = function calcRate(ethusd) {
  let pixelPriceWei = web3.toBigNumber(web3.toWei(Number(Math.ceil((100 / ethusd) + 'e17') + 'e-17')))
  let tokenPriceWei = pixelPriceWei.mul(100)

  return [pixelPriceWei, tokenPriceWei]
}

module.exports.duration = {
  seconds: function(val) { return val},
  minutes: function(val) { return val * this.seconds(60) },
  hours:   function(val) { return val * this.minutes(60) },
  days:    function(val) { return val * this.hours(24) },
  weeks:   function(val) { return val * this.days(7) },
  years:   function(val) { return val * this.days(365)}
}
