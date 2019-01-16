# testsmartcontracts
This repo is created to test smart contracts without using truffle for deploying and testing our smart contract

## Getting Started
This project 

### Clone the repo and install the project
- git clone https://github.com/ledgerium/testsmartcontracts.git 
- cd testsmartcontracts

### Smart Contracts are precompiled with command
- solc --overwrite --gas --bin --abi --optimize-runs=200 -o ./build/contracts ./contracts/contractname.sol
- Output files contractname.bin and contractname.abi are available in ./build/contracts folder. If not existing, program will exist with "file not found!" error

### Run the smart contracts
- npm install
- node index.js hostname=localhost port=8545 readkeyconfig=true testgreeter
- node index.js rinkeby readkeyconfig=true deployERC20Mock
- node index.js protocol=http hostname=localhost port=8545 readkeyconfig=true testInvoices=0x1234,790afdeb16ae5c22453f8eeee25038c314f09d64fc51b8e21a5a82225e54fde6
