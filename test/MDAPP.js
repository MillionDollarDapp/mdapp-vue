const { calcRate, duration, EVMThrow, increaseTime, latestTime, should, sleep } = require('./utils')

const MDAPPSale = artifacts.require('MDAPPSale')
const MDAPP = artifacts.require('MDAPP')
const MDAPPToken = artifacts.require('MDAPPToken')

contract('MDAPP', accounts => {
  const [owner, wallet, user1, user2, user3] = accounts
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
  })

  it('allows only Sale contract to mint', async () => {
    // Jump into presale period
    let countdown = this.startTimePresale - latestTime() + 5
    await increaseTime(countdown)

    await this.mdappInstance.mint(user1, 10, true, {from: owner}).should.be.rejectedWith(EVMThrow)

    // 10 presale MDAPP for user1
    // Sale calls MDAPP
    await this.saleInstance.buyTokens(user1, 10, zeroAddress, {from: user1, value: this.tokenPriceWei.mul(10)})
    Number(await this.mdappInstance.presaleBalanceOf.call(user1, {from: user1})).should.equal(10)
  })

  it('does not allow claiming before presaleAdStart', async () => {
    await this.mdappInstance.claim(0, 0, 5, 2, {from: user1}).should.be.rejectedWith('Claim period not yet started.')
  })

  it('allows only presale tokens before allAdStart', async () => {
    // Jump to time when presaleAdStart and startTimeSale are overlapping.
    let targetTime = this.presaleAdStart <= this.startTimeSale ? this.startTimeSale : this.presaleAdStart
    let countdown = targetTime - web3.eth.getBlock('latest').timestamp
    await increaseTime(countdown)

    // 10 regular MDAPP for user2
    await this.saleInstance.buyTokens(user2, 10, zeroAddress, {from: user2, value: this.tokenPriceWei.mul(10)})
    Number(await this.mdappInstance.presaleBalanceOf.call(user2, {from: user2})).should.equal(0)

    // Try claiming with regular tokens of user2
    await this.mdappInstance.claim(0, 0, 1, 1, {from: user2}).should.be.rejectedWith('Not enough unlocked presale tokens available.')

    // Try claiming with presale tokens of user1
    let result = await this.mdappInstance.claim(0, 0, 1, 1, {from: user1})
    result.logs[0].event.should.equal('Claim')
    result.logs[0].args.owner.should.equal(user1)
    result.logs[0].args.x.should.be.bignumber.equal(web3.toBigNumber(0))
    result.logs[0].args.y.should.be.bignumber.equal(web3.toBigNumber(0))
    result.logs[0].args.width.should.be.bignumber.equal(web3.toBigNumber(1))
    result.logs[0].args.height.should.be.bignumber.equal(web3.toBigNumber(1))

    // User1 should have 1 locked token
    Number(await this.tokenInstance.lockedTokensOf.call(user1, {from: user1})).should.equal(1)

    // ...and only 9 presale tokens left
    Number(await this.mdappInstance.presaleBalanceOf.call(user1, {from: user1})).should.equal(9)
  })

  it('reverts when ad is unknown', async () => {
    await this.mdappInstance.release(5, {from: user1}).should.be.rejectedWith('Ad does not exist.')
  })

  it('prohibits unauthorized releases', async () => {
    await this.mdappInstance.release(0, {from: user2}).should.be.rejectedWith('Access denied.')
  })

  it('unlocks presale tokens before allAdStart', async () => {
    // Unlock previously locked tokens by releasing adId 0
    await this.mdappInstance.release(0, {from: user1})

    // User1 should have 0 locked tokens
    Number(await this.tokenInstance.lockedTokensOf.call(user1, {from: user1})).should.equal(0)

    // ...and again 10 presale tokens
    Number(await this.mdappInstance.presaleBalanceOf.call(user1, {from: user1})).should.equal(10)
  })

  it('checks coordinates and dimensions', async () => {
    // x/y negative
    await this.mdappInstance.claim(-1, 0, 1, 1, {from: user1}).should.be.rejectedWith('Invalid coordinates.')
    await this.mdappInstance.claim(0, -1, 1, 1, {from: user1}).should.be.rejectedWith('Invalid coordinates.')
    await this.mdappInstance.claim(-1, -1, 1, 1, {from: user1}).should.be.rejectedWith('Invalid coordinates.')

    // x/y out of bounds
    await this.mdappInstance.claim(125, 0, 1, 1, {from: user1}).should.be.rejectedWith('Invalid coordinates.')
    await this.mdappInstance.claim(0, 80, 1, 1, {from: user1}).should.be.rejectedWith('Invalid coordinates.')
    await this.mdappInstance.claim(125, 80, 1, 1, {from: user1}).should.be.rejectedWith('Invalid coordinates.')

    // Rectangle going out of bounds
    await this.mdappInstance.claim(124, 0, 2, 1, {from: user1}).should.be.rejectedWith('Invalid coordinates.')
    await this.mdappInstance.claim(0, 79, 1, 2, {from: user1}).should.be.rejectedWith('Invalid coordinates.')
    await this.mdappInstance.claim(124, 79, 2, 2, {from: user1}).should.be.rejectedWith('Invalid coordinates.')

    // Negative/Zero dimensions
    await this.mdappInstance.claim(10, 10, 0, 1, {from: user1}).should.be.rejectedWith('Invalid dimensions.')
    await this.mdappInstance.claim(10, 10, 1, 0, {from: user1}).should.be.rejectedWith('Invalid dimensions.')
    await this.mdappInstance.claim(10, 10, 0, 0, {from: user1}).should.be.rejectedWith('Invalid dimensions.')
    await this.mdappInstance.claim(10, 10, -1, 1, {from: user1}).should.be.rejectedWith('Invalid dimensions.')
    await this.mdappInstance.claim(10, 10, 1, -1, {from: user1}).should.be.rejectedWith('Invalid dimensions.')
    await this.mdappInstance.claim(10, 10, -1, -1, {from: user1}).should.be.rejectedWith('Invalid dimensions.')
  })

  it('requires the correct amount of presale tokens', async () => {
    await this.mdappInstance.claim(0, 0, 11, 1, {from: user1}).should.be.rejectedWith('Not enough unlocked presale tokens available.')

    // Claim 5 squares
    await this.mdappInstance.claim(1, 0, 1, 5, {from: user1})

    // User1 should have 5 locked tokens
    Number(await this.tokenInstance.lockedTokensOf.call(user1, {from: user1})).should.equal(5)
  })

  it('prohibits claiming pixels twice', async () => {
    await this.mdappInstance.claim(1, 0, 1, 5, {from: user1}).should.be.rejectedWith('Already claimed.')
    await this.mdappInstance.claim(0, 1, 3, 1, {from: user1}).should.be.rejectedWith('Already claimed.')
  })

  it('returns a correct adIds[] list', async () => {
    // Claim more pixels => adId=2
    await this.mdappInstance.claim(2, 0, 1, 5, {from: user1})

    let adIds = await this.mdappInstance.getAdIds.call()
    adIds[0].should.be.bignumber.equal(web3.toBigNumber(1))
    adIds[1].should.be.bignumber.equal(web3.toBigNumber(2))
  })

  it('(un-)locks the correct amount of tokens', async () => {
    // Release ad1
    await this.mdappInstance.release(1, {from: user1})
    Number(await this.tokenInstance.lockedTokensOf.call(user1, {from: user1})).should.equal(5)

    // Release ad2
    await this.mdappInstance.release(2, {from: user1})
    Number(await this.tokenInstance.lockedTokensOf.call(user1, {from: user1})).should.equal(0)
  })

  it('requires correct token amount after allAdStart', async () => {
    // Jump to allAdStart
    let countdown = this.allAdStart - web3.eth.getBlock('latest').timestamp
    await increaseTime(countdown)

    // Claim 5 squares => adId=3
    await this.mdappInstance.claim(1, 1, 1, 5, {from: user1})
    Number(await this.tokenInstance.lockedTokensOf.call(user1, {from: user1})).should.equal(5)

    // Buy 5 regular tokens for user1
    await this.saleInstance.buyTokens(user1, 5, zeroAddress, {from: user1, value: this.tokenPriceWei.mul(5)})
    Number(await this.tokenInstance.balanceOf.call(user1, {from: user1})).should.equal(15)
    Number(await this.tokenInstance.lockedTokensOf.call(user1, {from: user1})).should.equal(5)

    // Claim 10 squares (5 presale and 5 regular tokens used) => adId4
    await this.mdappInstance.claim(2, 1, 1, 10, {from: user1})
    Number(await this.tokenInstance.lockedTokensOf.call(user1, {from: user1})).should.equal(15)
  })

  it('prohibits editing of foreign ads', async () => {
    await this.mdappInstance.editAd(3, 'link', 'title', 'text', 'contact', false, web3.toHex('digest'), web3.toHex('20'), 255, web3.toHex('ipfs'), {from: user2}).should.be.rejectedWith('Access denied.')
  })

  it('allows editing of own ads', async () => {
    let result = await this.mdappInstance.editAd(4, 'link', 'title', 'text', 'contact', true, web3.toHex('digest'), web3.toHex('20'), 255, web3.toHex('ipfs'), {from: user1})
    result.logs[0].event.should.equal('EditAd')
    result.logs[0].args.id.should.be.bignumber.equal(web3.toBigNumber(4))
    result.logs[0].args.owner.should.equal(user1)
    result.logs[0].args.link.should.equal('link')
    result.logs[0].args.title.should.equal('title')
    result.logs[0].args.text.should.equal('text')
    result.logs[0].args.contact.should.equal('contact')
    result.logs[0].args.NSFW.should.equal(true)
    result.logs[0].args.digest.should.startWith(web3.toHex('digest'))
    result.logs[0].args.hashFunction.should.startWith(web3.toHex('20'))
    result.logs[0].args.size.should.be.bignumber.equal(web3.toBigNumber(255))
    result.logs[0].args.storageEngine.should.startWith(web3.toHex('ipfs'))
  })
})
