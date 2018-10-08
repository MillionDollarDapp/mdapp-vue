/***************************************************************
 * Modified Crowdsale.sol from the zeppelin-solidity framework *
 * to support zero decimal token. The end time has been        *
 * removed.                                                    *
 * https://github.com/OpenZeppelin/zeppelin-solidity           *
 ***************************************************************/

pragma solidity ^0.4.24;


import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/payment/PullPayment.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./MDAPP.sol";
import "./libs/SafeMath16.sol";
import "oraclize-api/contracts/usingOraclize.sol";


/*
 * @title MDAPPSale
 * @dev MDAPPSale is a base contract for managing the token sale.
 * MDAPPSale has got a start timestamp, from where buyers can make
 * token purchases and the contract will assign them tokens based
 * on a ETH per token rate. Funds collected are forwarded to a wallet
 * as they arrive.
 */
contract MDAPPSale is Ownable, PullPayment, usingOraclize {
//contract MDAPPSale is Ownable, PullPayment {
  using SafeMath for uint256;
  using SafeMath16 for uint16;

  // The MDAPP core contract
  MDAPP public mdapp;

  // Start timestamp for presale (inclusive)
  uint256 public startTimePresale;

  // End timestamp for presale
  uint256 public endTimePresale;

  // Start timestamp sale
  uint256 public startTimeSale;

  // Address where funds are collected
  address public wallet;

  // Amount of raised money in wei. Only for stats. Don't use for calculations.
  uint256 public weiRaised;

  // Sold out / sale active?
  bool public soldOut = false;

  // Max supply
  uint16 public constant maxSupply = 10000;

  // Initial supply
  uint16 public supply = 0;

  // Oracle active?
  bool public oracleActive = false;

  // Delay between autonomous oraclize requests
  uint256 public oracleInterval;

  // Gas price for oraclize callback transaction
  uint256 public oracleGasPrice = 7000000000;

  // Gas limit for oraclize callback transaction
  // Unused gas is returned to oraclize.
  uint256 public oracleGasLimit = 105000;

  // When was the ethusd rate updated the last time?
  uint256 public oracleLastUpdate = 1;

  // Alternative: json(https://api.kraken.com/0/public/Ticker?pair=ETHUSD).result.XETHZUSD.c.0
  string public oracleQueryString = 'json(https://api.gdax.com/products/ETH-USD/ticker).price';

  // USD Cent value of 1 ether
  uint256 public ethusd;
  uint256 ethusdLast;


  /*********************************************************
   *                                                       *
   *                       Events                          *
   *                                                       *
   *********************************************************/

  /*
   * Event for token purchase logging.
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param tokens amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint16 tokens);

  event Recruited(address indexed purchaser, address indexed beneficiary, address indexed recruiter, uint256 value, uint256 share, uint16 tokens);

  // Received ETH via fallback function
  event Receive(address sender, uint256 value);

  event BountyGranted(address indexed beneficiary, uint16 tokens, string reason);

  event LogPriceUpdated(uint256 price);
  event OracleFundsWithdraw(uint256 value);
  event OracleGasPriceChange(uint256 value);
  event OracleGasLimitChange(uint256 value);
  event OracleIntervalChange(uint256 value);
  event OracleQueryStringChange(string value);
  event ETHUSDSet(uint256 value);

  /*********************************************************
   *                                                       *
   *                  Initial deployment                   *
   *                                                       *
   *********************************************************/


  constructor(uint256 _startTimePre, uint256 _endTimePre, uint256 _startTimeSale, address _wallet, uint256 _ethusd, uint _oracleInterval, address _mdapp) public {
    require(_startTimePre >= now);
    require(_endTimePre > _startTimePre);
    require(_startTimeSale >= _endTimePre);
    require(_wallet != 0x0);
    require(_ethusd > 0);
    require(_mdapp != 0x0);

    ethusd = _ethusd;
    ethusdLast = ethusd;
    oracleInterval = _oracleInterval;
    startTimePresale = _startTimePre;
    endTimePresale = _endTimePre;
    startTimeSale = _startTimeSale;
    wallet = _wallet;
    mdapp = MDAPP(_mdapp);

    oraclize_setCustomGasPrice(oracleGasPrice);
  }

  /*********************************************************
   *                                                       *
   *         Price calculation and oracle handling         *
   *                                                       *
   *********************************************************/

  /**
   * @dev Request ETHUSD rate from oraclize
   * @param _delay in seconds when the request should be scheduled from now on
   */
  function requestEthUsd(uint _delay) internal {              // Internal call:
    if (oracleActive && !soldOut) {
      if (oraclize_getPrice("URL") > address(this).balance) {
        oracleActive = false;
      } else {
        if (_delay == 0) {
          oraclize_query("URL", oracleQueryString, oracleGasLimit);
        } else {
          oraclize_query(_delay, "URL", oracleQueryString, oracleGasLimit);
        }
      }
    }
  }

  /**
   * @dev Called by oraclize.
   */
  function __callback(bytes32 myid, string result) public {
    if (msg.sender != oraclize_cbAddress()) revert();
    ethusdLast = ethusd;
    ethusd = parseInt(result, 2);
    oracleLastUpdate = now;
    emit LogPriceUpdated(ethusd);
    requestEthUsd(oracleInterval);
  }

  // Activate ethusd oracle
  function activateOracle() onlyOwner external payable {
    oracleActive = true;
    requestEthUsd(0);
  }

  function setOracleGasPrice(uint256 _gasPrice) onlyOwner external {
    require(_gasPrice > 0, "Gas price must be a positive number.");
    oraclize_setCustomGasPrice(_gasPrice);
    oracleGasPrice = _gasPrice;
    emit OracleGasPriceChange(_gasPrice);
  }

  function setOracleGasLimit(uint256 _gasLimit) onlyOwner external {
    require(_gasLimit > 0, "Gas limit must be a positive number.");
    oracleGasLimit = _gasLimit;
    emit OracleGasLimitChange(_gasLimit);
  }

  function setOracleInterval(uint256 _interval) onlyOwner external {
    require(_interval > 0, "Interval must be > 0");
    oracleInterval = _interval;
    emit OracleIntervalChange(_interval);
  }

  function setOracleQueryString(string _queryString) onlyOwner external {
    oracleQueryString = _queryString;
    emit OracleQueryStringChange(_queryString);
  }

  /**
   * Only needed to be independent from Oraclize - just for the worst case they stop their service.
   */
  function setEthUsd(uint256 _ethusd) onlyOwner external {
    require(_ethusd > 0, "ETHUSD must be > 0");
    ethusd = _ethusd;
    emit ETHUSDSet(_ethusd);
  }

  /**
   * @dev Withdraw remaining oracle funds.
   */
  function withdrawOracleFunds() onlyOwner external {
    oracleActive = false;
    emit OracleFundsWithdraw(address(this).balance);
    owner.transfer(address(this).balance);
  }

  /*********************************************************
   *                                                       *
   *              Token and pixel purchase                 *
   *                                                       *
   *********************************************************/


  // Primary token purchase function.
  function buyTokens(address _beneficiary, uint16 _tokenAmount, address _recruiter) external payable {
    require(_beneficiary != address(0), "Invalid beneficiary.");
    require(_tokenAmount > 0, "Token amount bust be a positive integer.");
    require(validPurchase(), "Either no active sale or zero ETH sent.");
    require(_recruiter != _beneficiary && _recruiter != msg.sender, "Recruiter must not be purchaser or beneficiary.");
    assert(ethusd > 0);

    // Each pixel costs $1 and 1 token represents 10x10 pixel => x100. ETHUSD comes in Cent => x100 once more
    // 10**18 * 10**2 * 10**2 = 10**22
    uint256 rate = uint256(10 ** 22).div(ethusd);
    // Calculate how much the tokens cost.
    // Overpayed purchases don't receive a return.
    uint256 cost = uint256(_tokenAmount).mul(rate);

    // Accept previous exchange rate if it changed within the last 2 minutes to improve UX during high network load.
    if (cost > msg.value) {
      if (now - oracleLastUpdate <= 120) {
        assert(ethusdLast > 0);
        rate = uint256(10 ** 22).div(ethusdLast);
        cost = uint256(_tokenAmount).mul(rate);
      }
    }

    require(msg.value >= cost, "Not enough ETH sent.");

    // Update supply.
    supply += _tokenAmount;
    require(supply <= maxSupply, "Not enough tokens available.");

    if (_recruiter == address(0)) {
      weiRaised = weiRaised.add(msg.value);
      asyncTransfer(wallet, msg.value);
    } else {
      // Purchaser has been recruited. Grant the recruiter 10%.
      uint256 tenPercent = msg.value.div(10);
      uint256 ninetyPercent = msg.value.sub(tenPercent);
      weiRaised = weiRaised.add(ninetyPercent);
      asyncTransfer(wallet, ninetyPercent);
      asyncTransfer(_recruiter, tenPercent);
      emit Recruited(msg.sender, _beneficiary, _recruiter, msg.value, tenPercent, _tokenAmount);
    }

    // Mint tokens.
    bool isPresale = endTimePresale >= now ? true : false;
    mdapp.mint(_beneficiary, _tokenAmount, isPresale);
    emit TokenPurchase(msg.sender, _beneficiary, msg.value, _tokenAmount);

    // Stop minting once we reach max supply.
    if (supply == maxSupply) {
      soldOut = true;
      mdapp.finishMinting();
    }
  }

  function grantBounty(address _beneficiary, uint16 _tokenAmount, string _reason) onlyOwner external {
    require(_beneficiary != address(0), "Invalid beneficiary.");
    require(_tokenAmount > 0, "Token amount bust be a positive integer.");

    // Update supply.
    supply += _tokenAmount;
    require(supply <= maxSupply, "Not enough tokens available.");

    // Mint tokens.
    bool isPresale = endTimePresale >= now ? true : false;
    mdapp.mint(_beneficiary, _tokenAmount, isPresale);

    // Stop minting once we reach max supply.
    if (supply == maxSupply) {
      soldOut = true;
      mdapp.finishMinting();
    }

    emit BountyGranted(_beneficiary, _tokenAmount, _reason);
  }

  // Fallback function. Load contract with ETH to use oraclize.
  function() public payable {
    emit Receive(msg.sender, msg.value);
  }

  /*********************************************************
   *                                                       *
   *                       Helpers                         *
   *                                                       *
   *********************************************************/

  // @return true if the transaction can buy tokens
  function validPurchase() internal view returns (bool) {
    bool withinPeriod = (now >= startTimeSale) || ((now >= startTimePresale) && (now < endTimePresale));
    bool nonZeroPurchase = msg.value > 0;
    return withinPeriod && nonZeroPurchase && !soldOut;
  }
}
