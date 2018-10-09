# mdapp-vue
Truffle project containing the MDAPP frontend and smart contracts.


## Testing
Solidity tests are requiring local [Ganache](https://github.com/trufflesuite/ganache) or
[Ganache-Cli](https://github.com/trufflesuite/ganache-cli).  
`Automine` and `Error on Transaction Failure` MUST BE activated.


You also need to run Oraclize's [Ethereum Bridge](https://github.com/oraclize/ethereum-bridge):  
`ethereum-bridge -H localhost:8545 -a 9 --dev`

Finally: `truffle test`
