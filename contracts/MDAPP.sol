/*****************************************************************
 * Core contract of the Million Dollar Decentralized Application *
 *****************************************************************/

pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/ownership/HasNoEther.sol";
import "openzeppelin-solidity/contracts/ownership/CanReclaimToken.sol";
import "./MDAPPToken.sol";
import "./libs/SafeMath16.sol";


/**
 * @title MDAPP
 */
contract MDAPP is Ownable, HasNoEther, CanReclaimToken {
  using SafeMath for uint256;
  using SafeMath16 for uint16;

  // The tokens contract.
  MDAPPToken public token;

  // The sales contracts address. Only it is allowed to to call the public mint function.
  address public sale;

  // When are presale participants allowed to place ads?
  uint256 public presaleAdStart;

  // When are all token owners allowed to place ads?
  uint256 public allAdStart;

  // Quantity of tokens bought during presale.
  mapping (address => uint16) presales;

  // Indicates whether a 10x10px block is claimed or not.
  bool[80][125] grid;

  // Struct that represents an ad.
  struct Ad {
    address owner;
    Rect rect;
  }

  // Struct describing an rectangle area.
  struct Rect {
    uint16 x;
    uint16 y;
    uint16 width;
    uint16 height;
  }

  // Don't store ad details on blockchain. Use events as storage as they are significantly cheaper.
  // ads are stored in an array, the id of an ad is its index in this array.
  Ad[] ads;

  // The following holds a list of currently active ads (without holes between the indexes)
  uint256[] adIds;

  // Holds the mapping from adID to its index in the above adIds array. If an ad gets released, we know which index to
  // delete and being filled with the last element instead.
  mapping (uint256 => uint256) adIdToIndex;


  /*********************************************************
   *                                                       *
   *                       Events                          *
   *                                                       *
   *********************************************************/

  /*
   * Event for claiming pixel blocks.
   * @param id ID of the new ad
   * @param owner Who owns the used tokens
   * @param x Upper left corner x coordinate
   * @param y Upper left corner y coordinate
   * @param width Width of the claimed area
   * @param height Height of the claimed area
   */
  event Claim(uint256 indexed id, address indexed owner, uint16 x, uint16 y, uint16 width, uint16 height);

  /*
   * Event for releasing pixel blocks.
   * @param id ID the fading ad
   * @param owner Who owns the claimed blocks
   */
  event Release(uint256 indexed id, address indexed owner);

  /*
   * Event for editing an ad.
   * @param id ID of the ad
   * @param owner Who owns the ad
   * @param link A link
   * @param title Title of the ad
   * @param text Description of the ad
   * @param NSFW Whether the ad is safe for work
   * @param digest IPFS hash digest
   * @param hashFunction IPFS hash function
   * @param size IPFS length of digest
   * @param storageEngine e.g. ipfs or swrm (swarm)
   */
  event EditAd(uint256 indexed id, address indexed owner, string link, string title, string text, string contact, bool NSFW, bytes32 indexed digest, bytes2 hashFunction, uint8 size, bytes4 storageEngine);

  event ForceNSFW(uint256 indexed id);


  /*********************************************************
   *                                                       *
   *                      Modifiers                        *
   *                                                       *
   *********************************************************/

  modifier coordsValid(uint16 _x, uint16 _y, uint16 _width, uint16 _height) {
    require(_x >= 0 && (_x + _width - 1) < 125, "Invalid coordinates.");
    require(_y >= 0 && (_y + _height - 1) < 80, "Invalid coordinates.");

    _;
  }

  modifier onlyAdOwner(uint256 _id) {
    require(ads[_id].owner == msg.sender, "Access denied.");

    _;
  }

  modifier enoughTokens(uint16 _width, uint16 _height) {
    require(uint16(token.unlockedTokensOf(msg.sender)) >= _width.mul(_height), "Not enough unlocked tokens available.");

    _;
  }

  modifier claimAllowed(uint16 _width, uint16 _height) {
    require(now >= presaleAdStart, "Claim period not yet started.");

    if (now < allAdStart) {
      // Sender needs enough presale tokens to claim at this point.
      uint16 tokens = _width.mul(_height);
      require(presales[msg.sender] >= tokens, "Not enough unlocked presale tokens available.");

      presales[msg.sender] = presales[msg.sender].sub(tokens);
    }

    _;
  }

  modifier onlySale() {
    require(msg.sender == sale);
    _;
  }

  modifier adExists(uint256 _id) {
    uint256 index = adIdToIndex[_id];
    require(adIds[index] == _id, "Ad does not exist.");

    _;
  }

  /*********************************************************
   *                                                       *
   *                   Initialization                      *
   *                                                       *
   *********************************************************/

  constructor(uint256 _presaleAdStart, uint256 _allAdStart, address _token) public {
    require(_presaleAdStart >= now);
    require(_allAdStart > _presaleAdStart);

    presaleAdStart = _presaleAdStart;
    allAdStart = _allAdStart;
    token = MDAPPToken(_token);
  }

  function setMDAPPSale(address _mdappSale) onlyOwner external {
    require(sale == address(0));
    sale = _mdappSale;
  }

  /*********************************************************
   *                                                       *
   *                       Logic                           *
   *                                                       *
   *********************************************************/

  // Proxy function to pass minting from sale contract to token contract.
  function mint(address _beneficiary, uint256 _tokenAmount, bool isPresale) onlySale external {
    if (isPresale) {
      presales[_beneficiary] = presales[_beneficiary].add(uint16(_tokenAmount));
    }
    token.mint(_beneficiary, _tokenAmount);
  }

  // Proxy function to pass finishMinting() from sale contract to token contract.
  function finishMinting() onlySale external {
    token.finishMinting();
  }


  // Public function proxy to forward single parameters as a struct.
  function claim(uint16 _x, uint16 _y, uint16 _width, uint16 _height)
    claimAllowed(_width, _height)
    coordsValid(_x, _y, _width, _height)
    external returns (uint)
  {
    Rect memory rect = Rect(_x, _y, _width, _height);
    return claimShortParams(rect);
  }

  // Claims pixels and requires to have the sender enough unlocked tokens.
  // Has a modifier to take some of the "stack burden" from the proxy function.
  function claimShortParams(Rect _rect)
    enoughTokens(_rect.width, _rect.height)
    internal returns (uint id)
  {
    token.lockToken(msg.sender, _rect.width.mul(_rect.height));

    // Check affected pixelblocks.
    for (uint16 i = 0; i < _rect.width; i++) {
      for (uint16 j = 0; j < _rect.height; j++) {
        uint16 x = _rect.x.add(i);
        uint16 y = _rect.y.add(j);

        if (grid[x][y]) {
          revert("Already claimed");
        }

        // Mark block as claimed.
        grid[x][y] = true;
      }
    }

    // Create placeholder ad.
    id = createPlaceholderAd(_rect);

    emit Claim(id, msg.sender, _rect.x, _rect.y, _rect.width, _rect.height);
    return id;
  }

  // Delete an ad, unclaim pixelblocks and unlock tokens.
  function release(uint256 _id) adExists(_id) onlyAdOwner(_id) external {
    uint16 tokens = ads[_id].rect.width.mul(ads[_id].rect.height);

    // Mark blocks as unclaimed.
    for (uint16 i = 0; i < ads[_id].rect.width; i++) {
      for (uint16 j = 0; j < ads[_id].rect.height; j++) {
        uint16 x = ads[_id].rect.x.add(i);
        uint16 y = ads[_id].rect.y.add(j);

        // Mark block as unclaimed.
        grid[x][y] = false;
      }
    }

    // Delete ad
    delete ads[_id];
    // Reorganize index array and map
    uint256 key = adIdToIndex[_id];
    // Fill gap with last element of adIds
    adIds[key] = adIds[adIds.length - 1];
    // Update adIdToIndex
    adIdToIndex[adIds[key]] = key;
    // Decrease length of adIds array by 1
    adIds.length--;

    // Unlock tokens
    if (now < allAdStart) {
      // The ad must have locked presale tokens.
      presales[msg.sender] = presales[msg.sender].add(tokens);
    }
    token.unlockToken(msg.sender, tokens);

    emit Release(_id, msg.sender);
  }

  // The image must be an URL either of bzz, ipfs or http(s).
  function editAd(uint _id, string _link, string _title, string _text, string _contact, bool _NSFW, bytes32 _digest, bytes2 _hashFunction, uint8 _size, bytes4 _storageEnginge) adExists(_id) onlyAdOwner(_id) public {
    emit EditAd(_id, msg.sender, _link, _title, _text, _contact, _NSFW, _digest, _hashFunction, _size,  _storageEnginge);
  }

  // Allows contract owner to set the NSFW flag for a given ad.
  function forceNSFW(uint256 _id) onlyOwner adExists(_id) external {
    emit ForceNSFW(_id);
  }

  // Helper function for claim() to avoid a deep stack.
  function createPlaceholderAd(Rect _rect) internal returns (uint id) {
    Ad memory ad = Ad(msg.sender, _rect);
    id = ads.push(ad) - 1;
    uint256 key = adIds.push(id) - 1;
    adIdToIndex[id] = key;
    return id;
  }

  // Returns remaining balance of tokens purchased during presale period qualifying for earlier claims.
  function presaleBalanceOf(address _holder) public view returns (uint16) {
    return presales[_holder];
  }

  // Returns all currently active adIds.
  function getAdIds() external view returns (uint256[]) {
    return adIds;
  }

  /*********************************************************
   *                                                       *
   *                       Other                           *
   *                                                       *
   *********************************************************/

  // Allow transfer of tokens even if minting is not yet finished.
  function allowTransfer() onlyOwner external {
    token.allowTransfer();
  }
}
