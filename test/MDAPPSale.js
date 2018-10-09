const { calcRate, duration, EVMThrow, increaseTime, latestTime, should, sleep } = require('./utils')

const MDAPPSale = artifacts.require('MDAPPSale')
const MDAPPToken = artifacts.require('MDAPPToken')

contract('Sale', accounts => {
  const [owner, wallet, user1, user2] = accounts
  const zeroAddress = '0x0000000000000000000000000000000000000000'

  before(async () => {
    this.tokenInstance = await MDAPPToken.deployed()
    this.saleInstance = await MDAPPSale.deployed()

    this.startTimePresale = await this.saleInstance.startTimePresale.call()
    this.endTimePresale = await this.saleInstance.endTimePresale.call()
    this.startTimeSale = await this.saleInstance.startTimeSale.call()

    this.ethusd = Number((await this.saleInstance.ethusd.call()))
    let rate = calcRate(this.ethusd)
    this.pixelPriceWei = rate[0]
    this.tokenPriceWei = rate[1]
  })

  it('sets an owner', async () => {
    (await this.saleInstance.owner.call()).should.equal(owner)
  })

  it('disallows pre-presale orders', async () => {
    await this.saleInstance.buyTokens(user1, 1, zeroAddress, {from: user1, value: this.tokenPriceWei}).should.be.rejectedWith('Either no active sale or zero ETH sent.')
  })

  it('reverts non-owner granted bounties', async () => {
    await this.saleInstance.grantBounty(user2, 1, 'Make me rich.', {from: user1}).should.be.rejectedWith(EVMThrow)
  })

  it('grants pre-presale bounties', async () => {
    let user2Balance = await this.tokenInstance.balanceOf.call(user2)
    await this.saleInstance.grantBounty(user2, 1, 'For being a great person.', {from: owner})
    let user2BalanceAfter = await this.tokenInstance.balanceOf.call(user2)

    user2BalanceAfter.sub(1).should.be.bignumber.equal(user2Balance)
  })

  it('allows presale purchases', async () => {
    let countdown = Number(this.startTimePresale) - latestTime() + 5
    await increaseTime(countdown)

    let walletBalance = await this.saleInstance.payments.call(wallet)
    await this.saleInstance.buyTokens(user1, 1, zeroAddress, {from: user1, value: this.tokenPriceWei})
    let newWalletBalance = await this.saleInstance.payments.call(wallet)

    newWalletBalance.sub(this.tokenPriceWei).should.be.bignumber.equal(walletBalance)
  })

  it('buys tokens for beneficiary', async () => {
    let user2Balance = await this.tokenInstance.balanceOf.call(user2)
    await this.saleInstance.buyTokens(user2, 1, zeroAddress, {from: user1, value: this.tokenPriceWei})
    let user2BalanceAfter = await this.tokenInstance.balanceOf.call(user2)

    user2BalanceAfter.sub(1).should.be.bignumber.equal(user2Balance)
  })

  it('disallows purchases between presale and sale', async () => {
    let countdown = Number(this.endTimePresale - web3.eth.getBlock('latest').timestamp)
    await increaseTime(countdown)

    let isBeforeSale = Number(this.startTimeSale - web3.eth.getBlock('latest').timestamp) > 0
    if (isBeforeSale) {
      await this.saleInstance.buyTokens(user1, 1, zeroAddress, {from: user1, value: this.tokenPriceWei}).should.be.rejectedWith('Either no active sale or zero ETH sent.')

      // Jump forward to sale period
      countdown = Number(this.startTimeSale - web3.eth.getBlock('latest').timestamp)
      await increaseTime(countdown + 5)
    } else {
      // There's no gap with the current migration settings. Uninteresting...
      done()
    }
  })

  it('allows regular sale', async () => {
    let userBalance = await this.tokenInstance.balanceOf.call(user1)
    await this.saleInstance.buyTokens(user1, 1, zeroAddress, {from: user1, value: this.tokenPriceWei})
    let userBalanceAfter = await this.tokenInstance.balanceOf.call(user1)

    userBalanceAfter.sub(1).should.be.bignumber.equal(userBalance)
  })

  it('grants bounties during sale', async () => {
    let user2Balance = await this.tokenInstance.balanceOf.call(user2)
    await this.saleInstance.grantBounty(user2, 1, 'For being a great person.', {from: owner})
    let user2BalanceAfter = await this.tokenInstance.balanceOf.call(user2)

    user2BalanceAfter.sub(1).should.be.bignumber.equal(user2Balance)
  })

  it('activates the oracle', async () => {
    let active = await this.saleInstance.oracleActive.call()
    active.should.equal(false)

    await this.saleInstance.activateOracle({from: owner, value: web3.toWei(0.1, 'ether')})
    active = await this.saleInstance.oracleActive.call()
    active.should.equal(true)
  })

  it('updates exchange rate autonomously', async () => {
    let exchangeRate = this.ethusd
    let updated = false
    let wait = 2000

    // Wait for up to 14sek in total.
    // Request has been triggered by test 'activates the oracle'.
    while (!updated && wait < 5001) {
      await sleep(wait)
      exchangeRate = Number((await this.saleInstance.ethusd.call()))
      if (exchangeRate !== this.ethusd) {
        updated = true
      }
      wait += 1000
    }

    exchangeRate.should.not.equal(this.ethusd)
  })

  it('prevents unauthorized oracle deactivation', async () => {
    await this.saleInstance.withdrawOracleFunds({from: user1}).should.be.rejectedWith(EVMThrow)
  })

  it('deactivates oracle', async () => {
    (await this.saleInstance.oracleActive.call()).should.equal(true)
    await this.saleInstance.withdrawOracleFunds({from: owner});
    (await this.saleInstance.oracleActive.call()).should.equal(false)
  })

  it('disallows buying for zero address', async () => {
    await this.saleInstance.buyTokens(zeroAddress, 1, user2, {from: user1, value: this.tokenPriceWei}).should.be.rejectedWith('Invalid beneficiary.')
  })

  it('does not accept too less Ether', async () => {
    await this.saleInstance.buyTokens(user1, 3, zeroAddress, {from: user1, value: this.tokenPriceWei.mul(2)}).should.be.rejectedWith('Not enough ETH sent.')
  })

  it('prevents zero purchase', async () => {
    await this.saleInstance.buyTokens(user1, 0, zeroAddress, {from: user1, value: this.tokenPriceWei}).should.be.rejectedWith('Token amount bust be a positive integer.')
    await this.saleInstance.buyTokens(user1, 1, zeroAddress, {from: user1}).should.be.rejectedWith('Either no active sale or zero ETH sent.')
  })

  it('grants 10% referral bounty', async () => {
    let recruiterBalanceBefore = await this.saleInstance.payments.call(user1)
    await this.saleInstance.buyTokens(user2, 10, user1, {from: user2, value: this.tokenPriceWei.mul(10)})
    let recruiterBalanceAfter = await this.saleInstance.payments.call(user1)

    recruiterBalanceAfter.sub(this.tokenPriceWei).should.be.bignumber.equal(recruiterBalanceBefore)
  })

  it('disallows self referral', async () => {
    await this.saleInstance.buyTokens(user1, 1, user1, {from: user2, value: this.tokenPriceWei}).should.be.rejectedWith('Recruiter must not be purchaser or beneficiary.')
    await this.saleInstance.buyTokens(user2, 1, user1, {from: user1, value: this.tokenPriceWei}).should.be.rejectedWith('Recruiter must not be purchaser or beneficiary.')
  })

  it('prevents setting wrong or unauthorized exchange rate', async () => {
    let newETHUSD = this.ethusd === 5000000 ? 50000000 : 5000000
    await this.saleInstance.setEthUsd(0, {from: owner}).should.be.rejectedWith('ETHUSD must be > 0')
    await this.saleInstance.setEthUsd(newETHUSD, {from: user1}).should.be.rejectedWith(EVMThrow)
  })

  it('sets ethusd manually', async () => {
    // Set exchange rate to $50k (20ETH for all MDAPP). If it is already, then to $500k (2ETH for all MDAPP)
    let newETHUSD = this.ethusd === 5000000 ? 50000000 : 5000000
    await this.saleInstance.setEthUsd(newETHUSD, {from: owner})

    this.ethusd = Number((await this.saleInstance.ethusd.call()))
    this.ethusd.should.equal(newETHUSD)
  })

  it('takes max supply into account', async () => {
    // Get current supply
    let supply = Number(await this.saleInstance.supply.call())
    let available = Number(await this.saleInstance.maxSupply.call()) - supply

    // Calc current price
    this.ethusd = Number((await this.saleInstance.ethusd.call()))
    let rate = calcRate(this.ethusd)
    this.pixelPriceWei = rate[0]
    this.tokenPriceWei = rate[1]

    // Buy one more than available
    let total = this.tokenPriceWei.mul(available + 1)
    await this.saleInstance.buyTokens(user2, available + 1, zeroAddress, {from: user2, value: total}).should.be.rejectedWith('Not enough tokens available.')

    // Buy exact amount
    await this.saleInstance.buyTokens(user2, available, zeroAddress, {from: user2, value: this.tokenPriceWei.mul(available)});
    Number(await this.saleInstance.supply.call()).should.equal(10000)
  })

  it('solds out', async () => {
    (await this.saleInstance.soldOut.call()).should.equal(true)
  })

  it('does not grant bounties when sold out', async () => {
    await this.saleInstance.grantBounty(user2, 1, 'Ignoring max supply', {from: owner}).should.be.rejectedWith('Not enough tokens available.')
  })

  it('does not allow purchases when sold out', async () => {
    await this.saleInstance.buyTokens(user2, 1, zeroAddress, {from: user2, value: this.tokenPriceWei}).should.be.rejectedWith('Either no active sale or zero ETH sent.')
  })

  it('allows withdrawal', async () => {
    let withdrawableBalance = await this.saleInstance.payments.call(wallet)
    let walletBalance = web3.eth.getBalance(wallet)
    await this.saleInstance.withdrawPayments({from: wallet})

    // The wallets wallet-balance should have grown by at least 90% of the withdrawable balance (considering unknown tx fees)
    let newWalletBalance = web3.eth.getBalance(wallet)
    newWalletBalance.should.be.bignumber.greaterThan(walletBalance.add(withdrawableBalance.mul(0.9)))
  })
})
