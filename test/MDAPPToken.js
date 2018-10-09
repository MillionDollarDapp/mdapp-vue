const { calcRate, duration, EVMThrow, increaseTime, latestTime, should, sleep } = require('./utils')

const MDAPPSale = artifacts.require('MDAPPSale')
const MDAPP = artifacts.require('MDAPP')
const MDAPPToken = artifacts.require('MDAPPToken')

contract('MDAPPToken', accounts => {
  const [admin, wallet, user1, user2, user3] = accounts
  const zeroAddress = '0x0000000000000000000000000000000000000000'

  before(async () => {
    this.mdappInstance = await MDAPP.deployed()
    this.tokenInstance = await MDAPPToken.deployed()
    this.saleInstance = await MDAPPSale.deployed()

    this.startTimePresale = Number(await this.saleInstance.startTimePresale.call())
    this.endTimePresale = Number(await this.saleInstance.endTimePresale.call())
    this.startTimeSale = Number(await this.saleInstance.startTimeSale.call())
    this.presaleAdStart = Number(await this.mdappInstance.presaleAdStart.call())
    this.allAdStart = Number(await this.mdappInstance.allAdStart.call())

    this.ethusd = Number((await this.saleInstance.ethusd.call()))
    let rate = calcRate(this.ethusd)
    this.pixelPriceWei = rate[0]
    this.tokenPriceWei = rate[1]

    // Jump into period when everything is allowed
    let countdown = this.allAdStart - latestTime() + 5
    await increaseTime(countdown)
  })

  it('has MDAPP as its owner', async () => {
    (await this.tokenInstance.owner.call()).should.equal(this.mdappInstance.address)
  })

  it('starts with zero supply', async () => {
    Number(await this.tokenInstance.totalSupply.call()).should.equal(0)
  })

  it('has zero decimals', async () => {
    Number(await this.tokenInstance.decimals.call()).should.equal(0)
  })

  it('allows only owner (MDAPP) to mint', async () => {
    await this.tokenInstance.mint(user1, 1, {from: admin}).should.be.rejectedWith(EVMThrow)

    // 10 token for user1
    // MDAPPSale calls MDAPP calls MDAPPToken.
    await this.saleInstance.buyTokens(user1, 10, zeroAddress, {from: user1, value: this.tokenPriceWei.mul(10)})
    Number(await this.tokenInstance.balanceOf.call(user1)).should.equal(10)
    Number(await this.tokenInstance.unlockedTokensOf.call(user1)).should.equal(10)
  })

  it('locks token if pixel are claimed', async () => {
    Number(await this.tokenInstance.lockedTokensOf.call(user1)).should.equal(0)
    await this.mdappInstance.claim(0, 0, 1, 1, {from: user1})
    Number(await this.tokenInstance.lockedTokensOf.call(user1)).should.equal(1)
    Number(await this.tokenInstance.unlockedTokensOf.call(user1)).should.equal(9)
  })

  it('prohibits token transfer during distribution', async () => {
    Number(await this.tokenInstance.transferableTokensOf.call(user1)).should.equal(0)
  })

  it('allows token transfer prior distribution end if MDAPP says so', async () => {
    await this.tokenInstance.allowTransfer({from: admin}).should.be.rejectedWith(EVMThrow)

    // MDAPP calls MDAPPToken.allowTransfer()
    await this.mdappInstance.allowTransfer({from: admin})

    // Transfer should now be allowed
    Number(await this.tokenInstance.transferableTokensOf.call(user1)).should.equal(9)
  })

  it('increases transferable amount when releasing an ad', async () => {
    await this.mdappInstance.release(0, {from: user1})
    Number(await this.tokenInstance.transferableTokensOf.call(user1)).should.equal(10)
  })
})

contract('MDAPPToken2', accounts => {
  const [admin, wallet, user1, user2, user3] = accounts
  const zeroAddress = '0x0000000000000000000000000000000000000000'

  before(async () => {
    this.mdappInstance = await MDAPP.deployed()
    this.tokenInstance = await MDAPPToken.deployed()
    this.saleInstance = await MDAPPSale.deployed()

    this.startTimePresale = Number(await this.saleInstance.startTimePresale.call())
    this.endTimePresale = Number(await this.saleInstance.endTimePresale.call())
    this.startTimeSale = Number(await this.saleInstance.startTimeSale.call())
    this.presaleAdStart = Number(await this.mdappInstance.presaleAdStart.call())
    this.allAdStart = Number(await this.mdappInstance.allAdStart.call())

    // Set exchange rate to $50k (20ETH for all MDAPP). If it is already, then to $500k (2ETH for all MDAPP)
    this.ethusd = Number((await this.saleInstance.ethusd.call()))
    let newETHUSD = this.ethusd === 5000000 ? 50000000 : 5000000
    await this.saleInstance.setEthUsd(newETHUSD, {from: admin})
    this.ethusd = Number((await this.saleInstance.ethusd.call()))
    let rate = calcRate(this.ethusd)
    this.pixelPriceWei = rate[0]
    this.tokenPriceWei = rate[1]

    // Jump into period when everything is allowed
    let countdown = this.allAdStart - latestTime() + 5
    await increaseTime(countdown)
  })

  it('allows transfer when sold out', async () => {
    // Buy 10 for user1 and lock 1 of them
    await this.saleInstance.buyTokens(user1, 10, zeroAddress, {from: user1, value: this.tokenPriceWei.mul(10)})
    Number(await this.tokenInstance.transferableTokensOf.call(user1)).should.equal(0)
    await this.mdappInstance.claim(0, 0, 1, 1, {from: user1})

    // Buy the rest for user2
    await this.saleInstance.buyTokens(user2, 9990, zeroAddress, {from: user2, value: this.tokenPriceWei.mul(9990)})
    Number(await this.saleInstance.supply.call()).should.equal(10000)

    // Check transferability
    Number(await this.tokenInstance.transferableTokensOf.call(user1)).should.equal(9)
    Number(await this.tokenInstance.transferableTokensOf.call(user2)).should.equal(9990)
  })
})
