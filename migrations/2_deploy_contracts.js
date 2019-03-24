var MDAPPSale = artifacts.require("MDAPPSale")
var MDAPP = artifacts.require("MDAPP")
var MDAPPToken = artifacts.require("MDAPPToken")

/**
 * MDAPP owns MDAPPToken
 * MDAPPSale calls MDAPP which mints at MDAPPToken
 *
 * 1. Deploy MDAPP
 * 2. Let MDAPP create MDAPPToken
 * 3. Deploy MDAPPSale and set MDAPP
 * 4. Tell MDAPP about MDAPPSale
 */

function latestTime() {
  // return web3.eth.getBlock('latest').timestamp;
  return Math.floor(new Date().getTime()/1000);
}

const duration = {
  seconds: function(val) { return val},
  minutes: function(val) { return val * this.seconds(60) },
  hours:   function(val) { return val * this.minutes(60) },
  days:    function(val) { return val * this.hours(24) },
  weeks:   function(val) { return val * this.days(7) },
  years:   function(val) { return val * this.days(365)}
};

module.exports = function(deployer, network, accounts) {
  console.log('################################################');
  console.log('Deploying on network:', network);
  console.log('Used account:', accounts[0]);

  startTimePre = latestTime() + duration.seconds(180);
  endTimePre = startTimePre + duration.seconds(120);
  startTimeSale = endTimePre + duration.seconds(30);
  presaleAdStart = startTimeSale;
  allAdStart = startTimeSale + duration.seconds(120);

  ethusd = 50000000;
  oracleInterval = 30;
  wallet = accounts[1];
  // OAR = '0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475';

  if (network === 'rinkeby') {
    console.log('Loading config for Rinkeby');
    startTimePre = 1539216000; // 11.10. 00:00 UTC
    endTimePre = 1539820799; // 17.10. 23:59:59 UTC
    startTimeSale = 1539820800; // 18.10. 00:00 UTC
    presaleAdStart = 1539820800; // 18.10. 00:00 UTC
    allAdStart = 1540425600; // 25.10. 00:00 UTC

    ethusd = 22000;
    oracleInterval = duration.hours(2);
    wallet = '0xeF3aB84122597654F1B4641Beb281603F3067CE3';
    // OAR = '0x146500cfd35B22E4A392Fe0aDc06De1a1368Ed48';
  }

  var mdappInstance = null;
  var saleInstance = null;
  var tokenInstance = null;

  console.log("Deploying MDAPPToken...");
  return deployer.deploy(MDAPPToken).then(() => {
    return MDAPPToken.deployed();
  }).then((_tokenInstance) => {
    tokenInstance = _tokenInstance;
    console.log('MDAPP parameters:', presaleAdStart, allAdStart, tokenInstance.address);
    return deployer.deploy(MDAPP, presaleAdStart, allAdStart, tokenInstance.address);
  }).then(() => {
    return MDAPP.deployed();
  }).then((_mdappInstance) => {
    mdappInstance = _mdappInstance;
    console.log('Transfering Ownership of Token contract to MDAPP...');
    return tokenInstance.transferOwnership(mdappInstance.address);
  }).then(() => {
    console.log('...done.');
    console.log('MDAPPSale parameters:', startTimePre, endTimePre, startTimeSale, wallet, ethusd, oracleInterval, mdappInstance.address);
    return deployer.deploy(MDAPPSale, startTimePre, endTimePre, startTimeSale, wallet, ethusd, oracleInterval, mdappInstance.address);
  }).then(() => {
    return MDAPPSale.deployed();
  }).then((_saleInstance) => {
    saleInstance = _saleInstance;
    return mdappInstance.setMDAPPSale(saleInstance.address);
  }).then(() => {
    console.log("Handed MDAPPSale over to MDAPP");
    return
  });
};
