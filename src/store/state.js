let state = {
  web3: {
    isInjected: false,
    web3Instance: null,
    networkId: null,
    coinbase: null,
    balance: null,
    balanceEth: null,
    gasPrice: null,
    block: null,
    blockTimes: new Map() // Holds minig date for each relevant block
  },
  saleContractInstance: null,
  tokenContractInstance: null,
  mdappContractInstance: null,

  // Helper for triggering changes in unreactive data structures (like Map())
  trigger: {
    tx: 1,
    txWatch: 1,
    myAds: 1,
    allAds: 1,
    forceNSFW: 1
  },

  // MetaMask, Unlock, Ether, MDAPP, Claim, Image
  helperProgress: [false, false, false, false, false, false],

  // Sale contract constants
  startTimePresale: 0, // ms timestamp
  endTimePresale: 0, // ms timestamp
  startTimeSale: 0, // ms timestamp
  maxSupply: 10000, // hardcoded
  wallet: null,

  // MDAPP contract constants
  adStartPresale: null, // ms timestamp
  adStartAll: null, // ms timestamp
  owner: null,
  presaleTokens: 0,

  // Sale contract variables
  ethusd: 0,
  soldOut: false,
  supply: 0,
  withdrawableBalance: 0,
  oracleActive: false,
  oracleLastUpdate: 0,
  oracleFunds: null,
  oracleGasPrice: 0,
  oracleGasLimit: 0,
  oracleInterval: 0,

  // Token contract variables
  balance: null,
  transferableTokens: null,
  lockedTokens: null,
  mintingFinished: false,
  forceTransferEnable: false,

  // Filter results
  initBlock: process.env.START_BLOCK, // will be set to the blocknumber at which we initially loaded the state. Start from here watching.
  myAds: new Map(), // current users ads (including claims with placeholder ads)
  allAds: new Map(), // general ads (including claims with placeholder ads)
  blockingPixels: new Set(), // [pixelblock] = true if it is claimed by anyone. Pixelblock ranges from 0 to 9999. Calc it with: x/10 + y/10 * 125
  adsQueue: new Map(), // newly detected ads will be queued here for beeing processed in the canvas component, then added to the regular ad store
  adsQueueIsWaiting: false, // a way for our filters to trigger the canvas component to process the queue
  forceNSFW: new Set(), // holds all adIds which have been force to NSFW by the contract owner
  adsWithNSFW: 0, // number of the active ads with the NSFW flag set to true

  // User transactions
  transactions: new Map(),
  txWatchlist: new Map()
}
export default state
