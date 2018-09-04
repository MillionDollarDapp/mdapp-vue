pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "./libs/SafeMath16.sol";


/**
 * @title MDAPPToken
 * @dev Token for the Million Dollar Decentralized Application (MDAPP).
 * Once a holder uses it to claim pixels the appropriate tokens are burned (1 Token <=> 10x10 pixel).
 * If one releases his pixels new tokens are generated and credited to ones balance. Therefore, supply will
 * vary between 0 and 10,000 tokens.
 * Tokens are transferable once minting has finished.
 * @dev Owned by MDAPP.sol
 */
contract MDAPPToken is MintableToken {
  using SafeMath16 for uint16;
  using SafeMath for uint256;

  string public constant name = "MillionDollarDapp";
  string public constant symbol = "MDAPP";
  uint8 public constant decimals = 0;

  mapping (address => uint16) locked;

  bool public forceTransferEnable = false;

  /*********************************************************
   *                                                       *
   *                       Events                          *
   *                                                       *
   *********************************************************/

  // Emitted when owner force-allows transfers of tokens.
  event AllowTransfer();

  /*********************************************************
   *                                                       *
   *                      Modifiers                        *
   *                                                       *
   *********************************************************/

  modifier hasLocked(address _account, uint16 _value) {
    require(_value <= locked[_account], "Not enough locked tokens available.");
    _;
  }

  modifier hasUnlocked(address _account, uint16 _value) {
    require(balanceOf(_account).sub(uint256(locked[_account])) >= _value, "Not enough unlocked tokens available.");
    _;
  }

  /**
   * @dev Checks whether it can transfer or otherwise throws.
   */
  modifier canTransfer(address _sender, uint256 _value) {
    require(_value <= transferableTokensOf(_sender), "Not enough unlocked tokens available.");
    _;
  }


  /*********************************************************
   *                                                       *
   *                Limited Transfer Logic                 *
   *            Taken from openzeppelin 1.3.0              *
   *                                                       *
   *********************************************************/

  function lockToken(address _account, uint16 _value) onlyOwner hasUnlocked(_account, _value) public {
    locked[_account] = locked[_account].add(_value);
  }

  function unlockToken(address _account, uint16 _value) onlyOwner hasLocked(_account, _value) public {
    locked[_account] = locked[_account].sub(_value);
  }

  /**
   * @dev Checks modifier and allows transfer if tokens are not locked.
   * @param _to The address that will receive the tokens.
   * @param _value The amount of tokens to be transferred.
   */
  function transfer(address _to, uint256 _value) canTransfer(msg.sender, _value) public returns (bool) {
    return super.transfer(_to, _value);
  }

  /**
  * @dev Checks modifier and allows transfer if tokens are not locked.
  * @param _from The address that will send the tokens.
  * @param _to The address that will receive the tokens.
  * @param _value The amount of tokens to be transferred.
  */
  function transferFrom(address _from, address _to, uint256 _value) canTransfer(_from, _value) public returns (bool) {
    return super.transferFrom(_from, _to, _value);
  }

  /**
   * @dev Allow the holder to transfer his tokens only if every token in
   * existence has already been distributed / minting is finished.
   * Tokens which are locked for a claimed space cannot be transferred.
   */
  function transferableTokensOf(address _holder) public view returns (uint16) {
    if (!mintingFinished && !forceTransferEnable) return 0;

    return uint16(balanceOf(_holder)).sub(locked[_holder]);
  }

  /**
   * @dev Get the number of pixel-locked tokens.
   */
  function lockedTokensOf(address _holder) public view returns (uint16) {
    return locked[_holder];
  }

  /**
   * @dev Get the number of unlocked tokens usable for claiming pixels.
   */
  function unlockedTokensOf(address _holder) public view returns (uint256) {
    return balanceOf(_holder).sub(uint256(locked[_holder]));
  }

  // Allow transfer of tokens even if minting is not yet finished.
  function allowTransfer() onlyOwner public {
    require(forceTransferEnable == false, 'Transfer already force-allowed.');

    forceTransferEnable = true;
    emit AllowTransfer();
  }
}
