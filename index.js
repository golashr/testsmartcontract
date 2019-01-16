'use strict';
const fs = require('fs');
const Web3 = require('web3');
const Utils =  require('./web3util');
const privateTran =  require('./privatetransactions');

var provider;
var protocol,host,port,web3;
var subscribePastEventsFlag = false;
var webSocketProtocolFlag = false;
global.webSocketProtocolFlag = webSocketProtocolFlag;
global.subscribePastEventsFlag = subscribePastEventsFlag;

var web3;
global.web3 = web3;

const utils = new Utils();
global.utils = utils;

var privateKey = {};
var accountAddressList = [];
var contractsList = {};
var usecontractconfigFlag = false;

global.contractsList = contractsList;

var main = async function () {

  const args = process.argv.slice(2);
  for (let i=0; i<args.length ; i++) {
      let temp = args[i].split("=");
      switch (temp[0]) {
            case "protocol":
                switch (temp[1]) {
                    case "ws":
                        protocol = "ws://";
                        global.protocol = protocol;
                        webSocketProtocolFlag = true;
                        global.webSocketProtocolFlag = webSocketProtocolFlag;
                        break;
                    case "http":
                    default:
                        protocol = "http://";
                        global.protocol = protocol;
                        webSocketProtocolFlag = false;
                        global.webSocketProtocolFlag = webSocketProtocolFlag;
                        break;
                }
                break;
            case "hostname":
                host = temp[1];
                global.host = host;
                break;
            case "port":
                port = temp[1];
                global.port = port;
                let URL = "http://" + host + ":" + port;
                web3 = new Web3(new Web3.providers.HttpProvider(URL));
                global.web3 = web3;
                break;
            case "privateKeys":
                let prvKeys = temp[1].split(",");
                utils.createAccountsAndManageKeysFromPrivateKeys(prvKeys);
                utils.writeAccountsAndKeys();
                break;
            case "readkeyconfig":
                let readkeyconfig = temp[1];
                switch(readkeyconfig){
                    case "true":
                    default: 
                        utils.readAccountsAndKeys();
                        break;
                    case "false":
                        console.log("Given readkeyconfig option not supported! Provide correct details");
                        break;     
                }
                break;
            case "rinkeby":
                let HDWalletProvider = require("truffle-hdwallet-provider");
                provider = new HDWalletProvider(privateKey[accountAddressList[0]], "https://rinkeby.infura.io/v3/931eac1d45254c16acc71d0fc11b88f0");
                web3 = new Web3();
                web3.setProvider(provider);
                global.web3 = web3;
                break;
            case "testgreeter":
                await testGreetingContract();
                break;
            case "testprivate":
                privateTran.deploy();
                break;
            case "testInvoices":
                let list = temp[1].split(",");
                await testInvoicesContract(list[0],list[1]);
                break;
            case "testSmartUniversity":
                await testSmartUniversityContract();
                break;
            case "deployERC20Mock":
                await deployERC20MockContract();
                break;
            case "testPersonalImportAccount":
                await testPersonalImportAccount();
                break;
            default:
                //throw "command should be of form :\n node deploy.js host=<host> file=<file> contracts=<c1>,<c2> dir=<dir>";
                break;
      }
  }

  if(provider)
      provider.engine.stop();
  return;
}

main();

async function deployERC20MockContract() {

    accountAddressList = global.accountAddressList;
    privateKey = global.privateKey;

    var ethAccountToUse = accountAddressList[0];
    
    // Todo: Read ABI from dynamic source.
    var filename = __dirname + "/build/contracts/ERC20Mock";
    var value = utils.readSolidityContractJSON(filename);
    if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
        return;
    }
    
    var deployedERC20MockAddress;
    if(!usecontractconfigFlag){
        let constructorParameters = [];
        constructorParameters.push(accountAddressList[0]);
        constructorParameters.push("2500");
        //value[0] = Contract ABI and value[1] =  Contract Bytecode
        //var deployedERC20MockAddress = "0x0000000000000000000000000000000000002020";
        let encodedABI = await utils.getContractEncodeABI(value[0], value[1],web3,constructorParameters);
        let transactionHash = await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey[ethAccountToUse],web3,0);
        deployedERC20MockAddress = transactionHash.contractAddress;
        console.log("ERC20Mock deployedAddress ", deployedERC20MockAddress);

        utils.writeContractsINConfig("ERC20Mock",deployedERC20MockAddress);
    }
    else{
        deployedERC20MockAddress = utils.readContractFromConfigContracts("ERC20Mock");
    }    
    
    var mock20ERC = new web3.eth.Contract(JSON.parse(value[0]),deployedERC20MockAddress);
    global.ERC20Mock = mock20ERC;

    //[1] - Total Supply
    var result = await mock20ERC.methods.totalSupply().call();
    console.log("totalSupply", result);

    //[2] - Balance of account which has tokens
    var result = await mock20ERC.methods.balanceOf(ethAccountToUse).call();
    console.log("balanceOf", result, "of account", ethAccountToUse);

    //[3] - Balance of account which doesnot have tokens
    var result = await mock20ERC.methods.balanceOf(accountAddressList[1]).call();
    console.log("balanceOf", result, "of account",  accountAddressList[1]);
    
    //[4] - Transfer
    //[4.1] - When the recipient is the non zero address
    //[4.1.1] - When the sender doesnot have enough balance
    var encodedABI = mock20ERC.methods.transfer(accountAddressList[1],100).encodeABI();
    var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    console.log("TransactionLog for ERC20Mock transfer without enough balance-", transactionObject.transactionHash);

    //[4.1.2]
    // var encodedABI = mock20ERC.methods.transfer(accountAddressList[1],123).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // console.log("TransactionLog for ERC20Mock transfer with enough balance-", transactionObject.transactionHash);

    //[4.2] - When the recipient is the zero address
    var zeroAddress = '0x0000000000000000000000000000000000000000';
    // var encodedABI = mock20ERC.methods.transfer(zeroAddress,123).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // console.log("TransactionLog for ERC20Mock transfer to zero address-", transactionObject.transactionHash);

    // result = await mock20ERC.methods.balanceOf(accountAddressList[1]).call();
    // console.log("balanceOf", result, "of account",  accountAddressList[1]);

    // result = await mock20ERC.methods.balanceOf(accountAddressList[0]).call();
    // console.log("balanceOf", result, "of account",  accountAddressList[0]);

    //[5] - Approve
    //[5.1] - When the spender is not the zero address
    //[5.1.1] - When the sender has enough balance
    // var encodedABI = mock20ERC.methods.approve(ethAccountToUse, 100).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // var logs = await mock20ERC.getPastEvents('Approval');
    // console.log("TransactionLog for ERC20Mock approve ", JSON.stringify(logs));

    //[5.1.2] - When there was no approved amount before
    // var result = await mock20ERC.methods.allowance(ethAccountToUse, ethAccountToUse).call();
    // console.log("When there was no approved amount before " + result)

    //[5.1.3] - When the spender has an approved amount
    // var encodedABI = mock20ERC.methods.approve(ethAccountToUse, 10).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // var result = await mock20ERC.methods.allowance(ethAccountToUse, ethAccountToUse).call();
    // console.log("When there was approved amount (replaces the previous one) " + result)

    //[5.2] - When the sender doesnot have enough balance
    //[5.2.1]
    // var encodedABI = mock20ERC.methods.approve(ethAccountToUse, 5000).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // var logs = await mock20ERC.getPastEvents('Approval');
    // /**?*/console.log("TransactionLog for ERC20Mock approve without enough balance ", JSON.stringify(logs));

    //[5.2.2] - When there was no approved amount before
    // var result = await mock20ERC.methods.allowance(ethAccountToUse, ethAccountToUse).call();
    // console.log("Allowance - When there was no approved amount before " + result)

    //[5.2.3] - When the spender had an approved amount
    //Same as 5.1.3

    //[5.3] - When the spender is the zero address
    // var encodedABI = mock20ERC.methods.approve(zeroAddress, 100).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // console.log("TransactionLog for ERC20Mock approve with zero address ", transactionObject.transactionHash);

    //[6] - Transfer from
    //[6.1] - When the recipient is not the zero address
    //[6.1.1] - When the spender has enough approved balance,
    //        - When the owner has enough balance

    //transferFrom not working

    // var encodedABI = mock20ERC.methods.approve(accountAddressList[1], 100).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // var result = await mock20ERC.methods.allowance(ethAccountToUse, accountAddressList[1]).call();
    // console.log("Allownace of ", accountAddressList[1], ' is ', result);

    // var encodedABI = mock20ERC.methods.transferFrom(accountAddressList[1], accountAddressList[2],100).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // console.log("TransactionLog for ERC20Mock transferFrom ", transactionObject.transactionHash);
    // var balance1 = await mock20ERC.methods.balanceOf(accountAddressList[1]).call();
    // var balance2 = await mock20ERC.methods.balanceOf(accountAddressList[2]).call();
    // console.log("After transferFrom, Balance of accountAddressList[1] ", accountAddressList[1], ' is ', balance1);
    // console.log("After transferFrom, Balance of accountAddressList[2] ", accountAddressList[2], ' is ', balance2);
    
    // var logs = await mock20ERC.getPastEvents('Transfer');
    // /**?*/console.log("TransactionLog for ERC20Mock approve without enough balance ", JSON.stringify(logs));

    //[6.1.2] - When the owner doesnot have enough balance
    // var encodedABI = mock20ERC.methods.transferFrom(accountAddressList[1], accountAddressList[2],101).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // console.log("TransactionLog for ERC20Mock transferFrom without enough balance in owner", transactionObject.transactionHash);
    
    //[7] - Decrease allowance
    //[7.1] - When the spender is not the zero address
    //[7.1.1] - When there was no approved amount before
    // var result = await mock20ERC.methods.allowance(ethAccountToUse, accountAddressList[2]).call();
    // console.log('Allowance (should be 0) ' + result)
    // var encodedABI = await mock20ERC.methods.decreaseAllowance(accountAddressList[2], 100).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // console.log("TransactionLog for ERC20Mock decreaseAllowance without approved amount", transactionObject.transactionHash);

    //[7.1.2] - When the spender had an approved amount
    var encodedABI = mock20ERC.methods.approve(accountAddressList[2], 100).encodeABI();
    var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    var result = await mock20ERC.methods.allowance(ethAccountToUse, accountAddressList[2]).call();
    console.log("Allownace of ", accountAddressList[2], ' is ', result);

    // var encodedABI = await mock20ERC.methods.decreaseAllowance(accountAddressList[2], 50).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // var result = await mock20ERC.methods.allowance(ethAccountToUse, accountAddressList[2]).call();
    // var logs = await mock20ERC.getPastEvents('Approval')
    // console.log("Event log for ERC20Mock decreaseAllowance with approved amount", JSON.stringify(logs));
    // console.log('Allowance of ', accountAddressList[2], " after decreasing allowance is ", result )

    //[7.1.3] - Decrease the allowance subtracting the requested amount
    // var encodedABI = await mock20ERC.methods.decreaseAllowance(accountAddressList[2], 50).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // var result = await mock20ERC.methods.allowance(ethAccountToUse, accountAddressList[2]).call();
    // var logs = await mock20ERC.getPastEvents('Approval')
    // console.log("Event log for ERC20Mock decreaseAllowance with approved amount", JSON.stringify(logs));
    // console.log('Allowance of ', accountAddressList[2], " after decreasing allowance is ", result )

    //[7.1.4] - Sets the allowance to zero when all allowance is removed
    // var encodedABI = await mock20ERC.methods.decreaseAllowance(accountAddressList[2], 50).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // var result = await mock20ERC.methods.allowance(ethAccountToUse, accountAddressList[2]).call();
    // var logs = await mock20ERC.getPastEvents('Approval')
    // console.log("Event log for ERC20Mock decreaseAllowance with approved amount", JSON.stringify(logs));
    // console.log('Allowance of ', accountAddressList[2], " after decreasing full allowance is ", result )

    //[7.1.5] - Reverts when more than full allowance is removed
    // var encodedABI = await mock20ERC.methods.decreaseAllowance(accountAddressList[2], 50).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // var result = await mock20ERC.methods.allowance(ethAccountToUse, accountAddressList[2]).call();
    // var logs = await mock20ERC.getPastEvents('Approval')
    // console.log("Event log for ERC20Mock decreaseAllowance with approved amount", JSON.stringify(logs));
    // console.log('Allowance of ', accountAddressList[2], " after decreasing more than full allowance is ", transactionObject.transactionHash )

    //[7.2] - When the spender is zero address
    // var encodedABI = await mock20ERC.methods.decreaseAllowance(zeroAddress, 50).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // console.log("Transaction log for ERC20Mock decreaseAllowance of zero address", transactionObject.transactionHash);
    
    //[8] - Increase Allowance
    //[8.1] - When the spender is not the zero address
    //[8.1.1] - When the sender has enough balance
    // var encodedABI = await mock20ERC.methods.increaseAllowance(accountAddressList[2], 50).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // var result = await mock20ERC.methods.allowance(ethAccountToUse, accountAddressList[2]).call();
    // var logs = await mock20ERC.getPastEvents('Approval')
    // console.log("Event log for ERC20Mock increaseAllowance with approved amount", JSON.stringify(logs));
    // console.log('Allowance of ', accountAddressList[2], " after increasing allowance is ", result )

    //[8.2] - When the spender is the zero address
    // var encodedABI = await mock20ERC.methods.increaseAllowance(zeroAddress, 50).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // console.log('Transaction logs for ERC20Mock increaseAllowance of zero address ' + transactionObject.transactionHash)

    //[9] - Mint
    //[9.1] - Rejects a null account
    // var encodedABI = await mock20ERC.methods.mint(zeroAddress, 50).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // console.log('Transaction logs for ERC20Mock mint for zero address ' + transactionObject.transactionHash)

    //[9.2] - Increments totalSupply
    // var encodedABI = await ERC20Mock.methods.mint(ethAccountToUse, 100).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // var result = await ERC20Mock.methods.totalSupply().call();
    // console.log('Increment total Supply ' + result)
    // var result1 = await ERC20Mock.methods.balanceOf(ethAccountToUse).call();
    // /**? */console.log('Balance of ', ethAccountToUse, ' is ' , result1)
    // var logs = await ERC20Mock.getPastEvents('Transfer');
    // console.log('Transfer event after minting '+ JSON.stringify(logs))

    //[10] - burn
    //[10.1] - Rejects a null account
    // var encodedABI = await ERC20Mock.methods.burn(zeroAddress, 1);
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // console.log('Transaction log for burn - zeroAddress ' + transactionObject.transactionHash)

    //[10.2] - For a non null account, rejects burning more than balance
    // var encodedABI = await ERC20Mock.methods.burn(ethAccountToUse, 1);
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // /**Not working - Invalid type */console.log('Transaction log for burning more than balance ' + transactionObject.transactionHash)

    //[11] - burnFrom
    //[11.1] - Rejects a null account
    // var encodedABI = await ERC20Mock.methods.burnFrom(zeroAddress, 1);
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20MockAddress,encodedABI,privateKey[ethAccountToUse],web3,0);
    // console.log('Transaction log for burnFrom - zeroAddress ' + transactionObject.transactionHash)
}

async function testGreetingContract() {
    
    accountAddressList = global.accountAddressList;
    privateKey = global.privateKey;  
  
    // Todo: Read ABI from dynamic source.
    var value = utils.readSolidityContractJSON("./build/contracts/Greeter");
    if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
        return;
    }
    var ethAccountToUse = accountAddressList[0];
    var deployedAddressGreeter;
    if(!usecontractconfigFlag){
        let constructorParameters = [];
        constructorParameters.push("Hi Ledgerium");
        //value[0] = Contract ABI and value[1] =  Contract Bytecode
        //var deployedAddressGreeter = "0x0000000000000000000000000000000000002020";
        let encodedABI = await utils.getContractEncodeABI(value[0], value[1],web3,constructorParameters);
        let transactionHash = await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey[ethAccountToUse],web3,0);
        deployedAddressGreeter = transactionHash.contractAddress;
        console.log("Greeter deployedAddress ", deployedAddressGreeter);

        utils.writeContractsINConfig("Greeter",deployedAddressGreeter);
    }
    else{
        deployedAddressGreeter = utils.readContractFromConfigContracts("Greeter");
    }
    
    var greeting = new web3.eth.Contract(JSON.parse(value[0]),deployedAddressGreeter);
    global.greeting = greeting;
    
    var result = await greeting.methods.getMyNumber().call({from : ethAccountToUse});
    console.log("getMyNumber", result);
    
    let encodedABI = greeting.methods.setMyNumber(499).encodeABI();
    var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedAddressGreeter,encodedABI,privateKey[ethAccountToUse],web3,0);
    console.log("TransactionLog for Greeter Setvalue -", transactionObject.transactionHash);

    result = await greeting.methods.getMyNumber().call({from : ethAccountToUse});
    console.log("getMyNumber after", result);
}

async function testInvoicesContract(invoiceID,hashVal) {
    
    accountAddressList = global.accountAddressList;
    privateKey = global.privateKey;  

    // Todo: Read ABI from dynamic source.
    var value = utils.readSolidityContractJSON("./build/contracts/Invoice");
    if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
        return;
    }
    var ethAccountToUse = accountAddressList[0];
    var deployedAddressInvoice = "0x0000000000000000000000000000000000002020";
    
    var invoice = new web3.eth.Contract(JSON.parse(value[0]),deployedAddressInvoice);
    global.invoice = invoice;
    
    var result = await invoice.methods.isHashExists(hashVal).call({from : ethAccountToUse});
    console.log("isHashExists after", result);
    
    let encodedABI = invoice.methods.addInvoice(invoiceID,hashVal).encodeABI();
    var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedAddressInvoice,encodedABI,privateKey[ethAccountToUse],web3,0);
    console.log("TransactionLog for Invoice Setvalue -", transactionObject.transactionHash);

    result = await invoice.methods.isHashExists(hashVal).call({from : ethAccountToUse});
    console.log("isHashExists after", result);

    result = await invoice.methods.getInvoiceID(hashVal).call({from : ethAccountToUse});
    console.log("getInvoiceID after", result);
}

async function testControllerContract() {
    
    accountAddressList = global.accountAddressList;
    privateKey = global.privateKey;  

    // Todo: Read ABI from dynamic source.
    var value = utils.readSolidityContractJSON("./build/contracts/Invoice");
    if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
        return;
    }
    var ethAccountToUse = accountAddressList[0];
    var deployedAddressInvoice = "0x0000000000000000000000000000000000002020";
    
    var invoice = new web3.eth.Contract(JSON.parse(value[0]),deployedAddressInvoice);
    global.invoice = invoice;
    
    var result = await invoice.methods.isHashExists(hashVal).call({from : ethAccountToUse});
    console.log("isHashExists after", result);
    
    let encodedABI = invoice.methods.addInvoice(invoiceID,hashVal).encodeABI();
    var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedAddressInvoice,encodedABI,privateKey[ethAccountToUse],web3,0);
    console.log("TransactionLog for Invoice Setvalue -", transactionObject.transactionHash);

    result = await invoice.methods.isHashExists(hashVal).call({from : ethAccountToUse});
    console.log("isHashExists after", result);

    result = await invoice.methods.getInvoiceID(hashVal).call({from : ethAccountToUse});
    console.log("getInvoiceID after", result);
}

async function testSmartUniversityContract() {
    
    accountAddressList = global.accountAddressList;
    privateKey = global.privateKey;

    var ethAccountToUse = accountAddressList[0];
    var deployedAddressUniversity,deployedAddressInst,deployedAddressCourse,deployedAddressBatch;
    var deployedAddressCert,deployedAddressStudent,deployedAddressController;

    if(!usecontractconfigFlag){
        let constructorParameters = [];

        //University Deployment
        // Todo: Read ABI from dynamic source.
        var value = utils.readSolidityContractJSON("./build/contracts/University");
        if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
            return;
        }
        constructorParameters.push("RMIT");
        let encodedABI = await utils.getContractEncodeABI(value[0], value[1],web3,constructorParameters);
        let transactionHash = await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey[ethAccountToUse],web3,0);
        deployedAddressUniversity = transactionHash.contractAddress;
        console.log("University deployedAddress ", deployedAddressUniversity);
        utils.writeContractsINConfig("University",deployedAddressUniversity);

        
        //Institute Deployment
        value = utils.readSolidityContractJSON("./build/contracts/Institute");
        if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
            return;
        }
        constructorParameters = [];
        constructorParameters.push(deployedAddressUniversity);
        constructorParameters.push("Inst1");
        encodedABI = await utils.getContractEncodeABI(value[0], value[1],web3,constructorParameters);
        transactionHash = await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey[ethAccountToUse],web3,0);
        deployedAddressInst = transactionHash.contractAddress;
        console.log("Institute deployedAddress ", deployedAddressInst);

        
        //Course Deployment
        value = utils.readSolidityContractJSON("./build/contracts/Course");
        if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
            return;
        }
        constructorParameters = [];
        constructorParameters.push(deployedAddressInst);
        constructorParameters.push("Course1");
        encodedABI = await utils.getContractEncodeABI(value[0], value[1],web3,constructorParameters);
        transactionHash = await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey[ethAccountToUse],web3,0);
        deployedAddressCourse = transactionHash.contractAddress;
        console.log("Course deployedAddress ", deployedAddressCourse);


        //Batch Deployment
        value = utils.readSolidityContractJSON("./build/contracts/Batch");
        if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
            return;
        }
        constructorParameters = [];
        constructorParameters.push(deployedAddressCourse);
        constructorParameters.push("Batch1");
        encodedABI = await utils.getContractEncodeABI(value[0], value[1],web3,constructorParameters);
        transactionHash = await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey[ethAccountToUse],web3,0);
        deployedAddressBatch = transactionHash.contractAddress;
        console.log("Batch deployedAddress ", deployedAddressBatch);


        //Certificate Deployment
        value = utils.readSolidityContractJSON("./build/contracts/Certificate");
        if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
            return;
        }
        constructorParameters = [];
        constructorParameters.push(deployedAddressBatch);
        constructorParameters.push("BTech");
        encodedABI = await utils.getContractEncodeABI(value[0], value[1],web3,constructorParameters);
        transactionHash = await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey[ethAccountToUse],web3,0);
        deployedAddressCert = transactionHash.contractAddress;
        console.log("Certificate deployedAddress ", deployedAddressCert);

        
        //Student Deployment
        value = utils.readSolidityContractJSON("./build/contracts/Student");
        if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
            return;
        }
        constructorParameters = [];
        constructorParameters.push("Vitalin Butarik");
        encodedABI = await utils.getContractEncodeABI(value[0], value[1],web3,constructorParameters);
        transactionHash = await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey[ethAccountToUse],web3,0);
        deployedAddressStudent = transactionHash.contractAddress;
        console.log("Student deployedAddress ", deployedAddressStudent);


        //ControllerContract Deployment
        value = utils.readSolidityContractJSON("./build/contracts/ControllerContract");
        if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
            return;
        }
        constructorParameters = [];
        encodedABI = await utils.getContractEncodeABI(value[0], value[1],web3,constructorParameters);
        transactionHash = await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey[ethAccountToUse],web3,0);
        deployedAddressController = transactionHash.contractAddress;
        console.log("ControllerContract deployedAddress ", deployedAddressController);

        utils.writeContractsINConfig("University",deployedAddressUniversity);
        utils.writeContractsINConfig("Institute",deployedAddressInst);
        utils.writeContractsINConfig("Course",deployedAddressCourse);
        utils.writeContractsINConfig("Batch",deployedAddressBatch);
        utils.writeContractsINConfig("Certificate",deployedAddressCert);
        utils.writeContractsINConfig("Student",deployedAddressStudent);
        utils.writeContractsINConfig("ControllerContract",deployedAddressController);
    }
    else{
        deployedAddressUniversity = utils.readContractFromConfigContracts("University");
        deployedAddressInst = utils.readContractFromConfigContracts("Institute");
        deployedAddressCourse = utils.readContractFromConfigContracts("Course");
        deployedAddressBatch = utils.readContractFromConfigContracts("Batch");
        deployedAddressCert = utils.readContractFromConfigContracts("Certificate");
        deployedAddressStudent = utils.readContractFromConfigContracts("Student");
        deployedAddressController = utils.readContractFromConfigContracts("ControllerContract");
    }

    // var invoice = new web3.eth.Contract(JSON.parse(value[0]),deployedAddressSmartUniController);
    // global.invoice = invoice;
    
    // var result = await invoice.methods.isHashExists(hashVal).call({from : ethAccountToUse});
    // console.log("isHashExists after", result);
    
    // let encodedABI = invoice.methods.addInvoice(invoiceID,hashVal).encodeABI();
    // var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedAddressSmartUniController,encodedABI,privateKey[ethAccountToUse],web3,0);
    // console.log("TransactionLog for Invoice Setvalue -", transactionObject.transactionHash);

    // result = await invoice.methods.isHashExists(hashVal).call({from : ethAccountToUse});
    // console.log("isHashExists after", result);

    // result = await invoice.methods.getInvoiceID(hashVal).call({from : ethAccountToUse});
    // console.log("getInvoiceID after", result);
}

async function deployERC20Contract(){

    accountAddressList = global.accountAddressList;
    privateKey = global.privateKey;

    var ethAccountToUse = accountAddressList[0];
    
    // Todo: Read ABI from dynamic source.
    var filename = __dirname + "/build/contracts/ERC20";
    var value = utils.readSolidityContractJSON(filename);
    if((value.length <= 0) || (value[0] == "") || (value[1] == "")) {
        return;
    }
    
    var deployedERC20Address;
    if(!usecontractconfigFlag){
        let constructorParameters = [];
        constructorParameters.push(accountAddressList[0]);
        constructorParameters.push("2500");
        //value[0] = Contract ABI and value[1] =  Contract Bytecode
        //var deployedERC20Address = "0x0000000000000000000000000000000000002020";
        let encodedABI = await utils.getContractEncodeABI(value[0], value[1],web3,constructorParameters);
        let transactionHash = await utils.sendMethodTransaction(ethAccountToUse,undefined,encodedABI,privateKey[ethAccountToUse],web3,0);
        deployedERC20Address = transactionHash.contractAddress;
        console.log("ERC20 deployedAddress ", deployedERC20Address);

        utils.writeContractsINConfig("ERC20",deployedERC20Address);
    }
    else{
        deployedERC20Address = utils.readContractFromConfigContracts("ERC20");
    }    
    
    var mock20ERC = new web3.eth.Contract(JSON.parse(value[0]),deployedERC20Address);
    global.ERC20 = mock20ERC;

    var result = await mock20ERC.methods.totalSupply().call();
    console.log("totalSupply", result);

    var result = await mock20ERC.methods.balanceOf(ethAccountToUse).call();
    console.log("balanceOf", result, "of account", ethAccountToUse);

    var result = await mock20ERC.methods.balanceOf(accountAddressList[1]).call();
    console.log("balanceOf", result, "of account",  accountAddressList[1]);
    
    let encodedABI = mock20ERC.methods.transfer(accountAddressList[1],123).encodeABI();
    var transactionObject = await utils.sendMethodTransaction(ethAccountToUse,deployedERC20Address,encodedABI,privateKey[ethAccountToUse],web3,0);
    console.log("TransactionLog for ERC20 transfer -", transactionObject.transactionHash);

    result = await mock20ERC.methods.balanceOf(accountAddressList[1]).call();
    console.log("balanceOf", result, "of account",  accountAddressList[1]);

    result = await mock20ERC.methods.balanceOf(accountAddressList[0]).call();
    console.log("balanceOf", result, "of account",  accountAddressList[0]);
}

async function testPersonalImportAccount() {

    accountAddressList = global.accountAddressList;
    privateKey = global.privateKey;  
  
    var password = "password";
    var ethereumAccountsList = await web3.eth.getAccounts();
    console.log("No of Ethereum accounts on the node ",ethereumAccountsList.length);
    //if(ethereumAccountsList.length < 3)
    {
        // await utils.personalImportAccount(privateKey[accountAddressList[0]],password);
        // await utils.personalImportAccount(privateKey[accountAddressList[1]],password);
        // await utils.personalImportAccount(privateKey[accountAddressList[2]],password);
        // await utils.personalImportAccount(privateKey[accountAddressList[10]],password);
        await utils.unlockPersonalAccount(accountAddressList[0],password);

      //Transfer some ether from coinbase account to newly created accounts!
      var coinbase = await web3.eth.getCoinbase();
      //var receipt;
      receipt = await utils.sendUnsignedTransaction(coinbase,accountAddressList[1],web3.utils.toWei("1.0", "ether"),web3);
      receipt = await utils.sendUnsignedTransaction(coinbase,accountAddressList[2],web3.utils.toWei("1.0", "ether"),web3);
      receipt = await utils.sendUnsignedTransaction(coinbase,accountAddressList[10],web3.utils.toWei("1.0", "ether"),web3);
      //receipt = await utils.sendUnsignedTransaction(coinbase,accountAddressList[10],"0x00",privateKey[coinbase],web3.utils.toWei("1.0", "ether"),web3);
      //receipt = await utils.sendMethodTransactionOld(coinbase,accountAddressList[1],"0x00",privateKey[coinbase],web3.utils.toWei("1.0", "ether"),web3);
      //receipt = await utils.sendMethodTransactionOld(coinbase,accountAddressList[2],"0x00",privateKey[coinbase],web3.utils.toWei("1.0", "ether"),web3);
    }
      
    //With assumption that accountAddressList[0],accountAddressList[1], accountAddressList[2] are present in etherum 
    //and needs to be unlocked before running the testcases. 
    // await utils.unlockPersonalAccount(accountAddressList[0],password);
    // await utils.unlockPersonalAccount(accountAddressList[1],password);
    // await utils.unlockPersonalAccount(accountAddressList[2],password);
}
  
async function test() {
    await utils.readAccountsAndKeys();
    await utils.readContractsFromConfig();
    await deployERC20MockContract();
}

//test();
