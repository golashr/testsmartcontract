'use strict';
const fs = require('fs');
const moment = require('moment');
const mnemonic = require('./mnemonic');
const solc = require('solc');
const EthereumTx = require('ethereumjs-tx');
var keythereum = require('keythereum');
const ethUtil = require('ethereumjs-util');

class utils {
    async getCurrentTime () {
        return moment().format('YYYY-MM-DD HH:mm:ss').trim();
    }
      
    async transaction (from,to,value,data){
        return {
            from    : from,
            to      : to,
            data    : data,
            value   : value,
            gasPrice: '0x00',
            gas     : 4700000
        }
    }

    async getContractEncodeABI(abi,bytecode,web3,arg){
        try{
            let contract = new web3.eth.Contract(JSON.parse(abi));
            return await contract.deploy({ data : bytecode, arguments : arg}).encodeABI();
        } catch (error) {
            console.log("Exception in utils.getContractEncodeABI(): " + error);
        } 
    }
    
    async deployContract(contractAbi, bytecode, ownerAddress, constructorParameters) {
        console.log("deployContract");
        try{
            let deployedContract = new web3.eth.Contract(JSON.parse(contractAbi));
            deployedAddress = await deployedContract.deploy({
                data : bytecode, 
                arguments: constructorParameters
            })
            .send({
                from : ownerAddress,
                gas : 5500000
            });
            return deployedAddress._address;
        } catch (error) {
            console.log("Exception in utils.deployContract(): " + error);
        }    
    }

    async deployContractOldWeb3(contractAbi, bytecode, fromAccountAddress, privateKey, constructorParameters) {
        console.log("deployContractOldWeb3");
        try{
            var myContract = web3.eth.contract(JSON.parse(contractAbi));
            var byteCodeWithParam = myContract.new.getData(constructorParameters[0],constructorParameters[1],
                constructorParameters[2],constructorParameters[3],
                {data: bytecode});
            nonceToUse = await web3.eth.getTransactionCount(fromAccountAddress, 'pending');
            {
                console.log("nonceToUse ",nonceToUse);
                const txParams = {
                    nonce: nonceToUse,
                    gasPrice: '0x00',
                    gasLimit: 4700000,
                    from: fromAccountAddress,
                    data: byteCodeWithParam
                }
                const tx = new EthereumTx(txParams);
                const privateKeyBuffer = new Buffer(privateKey, 'hex');
                tx.sign(privateKeyBuffer);
                const serializedTx = tx.serialize();

                var transactionHash = await web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'));
                var receipt;
                do{
                    receipt = await web3.eth.getTransactionReceipt(transactionHash);
                }
                while(receipt == null)
                return receipt.contractAddress;
            }
        } catch (error) {
            console.log("Exception in utils.deployContractOldWeb3(): " + error);
        }    
    }
    
    async sendMethodTransactionOld (fromAccountAddress, toContractAddress, methodData, privateKey, value, _web3){
        try{
            nonceToUse = await _web3.eth.getTransactionCount(fromAccountAddress, 'pending');
            {
                console.log("nonceToUse ",nonceToUse);
                const txParams = {
                    nonce: nonceToUse,
                    gasPrice: '0x00',
                    gasLimit: 4700000, //estimatedGas, //20000000, // Todo, estimate gas
                    from: fromAccountAddress,
                    to: toContractAddress,
                    //value: value,
                    data: methodData
                }
                const tx = new EthereumTx(txParams)
                const privateKeyBuffer = new Buffer(privateKey, 'hex');
                tx.sign(privateKeyBuffer);
                const serializedTx = tx.serialize();

                transactionHash = await _web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'));
                // var receipt;
                // do{
                //     receipt = await _web3.eth.getTransactionReceipt(transactionHash);
                // }
                //while(receipt == null)
                if(transactionHash.status)
                    return transactionHash;
                else
                    return "";
            }
        } catch (error) {
            console.log("Exception in utils.sendMethodTransactionOld(): " + error);
        } 
    }  
    
    async sendMethodTransaction (fromAccountAddress, toContractAddress, methodData, privateKey, web3, estimatedGas){//, calleeMethodName,callback) {
        try
        {
            var gasPrice = await web3.eth.getGasPrice();
            console.log("gasPrice ",web3.utils.toHex(gasPrice)); 

            var balance = await web3.eth.getBalance(fromAccountAddress);
            console.log("FromAccount", fromAccountAddress, "has balance of", web3.utils.fromWei(balance, 'ether'), "ether");
            
            let nonceToUse = await web3.eth.getTransactionCount(fromAccountAddress, 'pending');
            console.log("nonceToUse ",nonceToUse);
            const txParams = {
                nonce: nonceToUse,
                //gasPrice: '0x00',
                gasPrice: web3.utils.toHex(gasPrice),//'0x4A817C800', //20Gwei
                gasLimit: '0x47b760',//'0x48A1C0',//web3.utils.toWei(20,'gwei'), //estimatedGas, // Todo, estimate gas
                from: fromAccountAddress,
                to: toContractAddress,
                value: web3.utils.toHex(0),
                data: methodData
                //"privateFor" : privateFor
            }
            const tx = new EthereumTx(txParams);
            const privateKeyBuffer = new Buffer(privateKey, 'hex');
            tx.sign(privateKeyBuffer);
            const serializedTx = tx.serialize();

            let transactionHash = await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
            // var receipt;
            // do{
            //     receipt = await web3.eth.getTransactionReceipt(transactionHash);
            // }
            // while(receipt == null)
            if(transactionHash.status)
                return transactionHash;
            else
                return "";
        }
        catch (error) {
            console.log("Error in utils.sendMethodTransaction(): " + error);
            return "";
        }
    }

    async sendUnsignedTransaction (fromAccountAddress, toContractAddress, methodData, web3){
        try
        {
            var gasPrice = await web3.eth.getGasPrice();
            console.log("gasPrice ",web3.utils.toHex(gasPrice)); 
      
            let nonceToUse = await web3.eth.getTransactionCount(fromAccountAddress, 'pending');
            console.log("nonceToUse ",nonceToUse);
            const txParams = {
                nonce: nonceToUse,
                gasPrice: web3.utils.toHex(gasPrice),
                gasLimit: '0x47b760',
                from: fromAccountAddress,
                to: toContractAddress,
                value: web3.utils.toHex(0),
                data: methodData
                //"privateFor" : privateFor
            }
      
            let transactionHash = await web3.eth.sendTransaction(txParams);
            if(transactionHash.status)
                return transactionHash;
            else
                return "";
        }
        catch (error) {
            console.log("Error in utils.sendMethodTransaction(): " + error);
            return "";
        }
    }
    
    /** To get estimate of gas consumptio for the given transaction prior to actual
     * execution on blockchain! Extremely useful feature however, giving issues on quorum
    */
   async estimateGasTransaction (fromAccountAddress, toContractAddress, methodData, web3) {
        return await web3.eth.estimateGas(
            {
                from    : fromAccountAddress,
                to      : toContractAddress,
                data    : methodData
            });
    }

    /** to get receipt of the event raised from the blockchain
    */ 
    async getReceipt(transactionHash,web3){
        var receipt = web3.eth.getTransactionReceipt(transactionHash);
        if(!receipt)
            console.log("Transaction",transactionHash,"did not get mined!");
        return receipt;
    }
    
    /** to read .abi and .bin file and return the values
    */ 
    readSolidityContractJSON (filename) {
        let jsonAbi, jsonBytecode;
        try {
            jsonAbi = JSON.parse(fs.readFileSync(filename + ".abi", 'utf8'));
            jsonBytecode = "0x" + fs.readFileSync(filename + ".bin", 'utf8');
            return [JSON.stringify(jsonAbi), jsonBytecode];
        } catch (error) {
            if (error.code === 'ENOENT')
                console.log(error.path, 'file not found!');
            else
                console.log("readSolidityContractJSON error ", error);
            return ["",""];
        }
    }

    compileSolidityContract (filename,contractName) {
        let source = fs.readFileSync(filename, 'utf8');
        let compiledContract = solc.compile(source, 1);
        let abi = compiledContract.contracts[":"+contractName].interface;
        let bytecode = compiledContract.contracts[":"+contractName].bytecode;
        return [abi, bytecode];
    }

    keccakM (web3,text){
        return web3.sha3(text);
    }

    async sendTransaction(web3,transaction){
        return await web3.eth.sendTransaction(transaction);
    }

    generatePublicKey (privateKey) {
        return '0x'+ethUtil.privateToAddress(privateKey).toString('hex');
    }

    getPrivateKeyFromKeyStore (accountAddress, keyStorePath, password) {
        var keyObject = keythereum.importFromFile(accountAddress, keyStorePath);
        var privateKey = keythereum.recover(password, keyObject);
        return privateKey.toString('hex');
    }

    async subscribe (string,web3,callback) {
        web3.eth.subscribe(string,(error,transaction)=>{
            if(error){
                console.log("error",`SUBSCRIBE:\n${error.message}\n${error.stack}`);
            }else{
                callback(transaction);
            }
        });
    }
    
    // to get all events from a submitted transaction to send to node application
    async listen(contract,callback){
        contract.events.allEvents({
            fromBlock: 0,
            toBlock  : 'latest'
        },(err,event)=>{
            if(err){
                console.log('error',`\n${err.message}\n${err.stack}`)
            }else{
                console.log('info',`:\n${event}`);
                callback(event);
            }
        });
    }

    async getData(fromAccount,toContract,endata,web3){
        return await web3.eth.call({
            from : fromAccount,
            to: toContract,
            data: endata
        });
    }

    split(array){
        temp = [];
        add = [];
        array = array.slice(2,array.length);
        for(var i=0;i<array.length;i+=64){
            temp.push(array.slice(i,i+64));
        }
        for(var j=0;j<temp.length;j++){
            add.push("0x"+temp[j].slice(24,64));
        }
        return add.splice(2, add.length);
    }

    convertToBool(inputString){
        if(inputString == "0x0000000000000000000000000000000000000000000000000000000000000001")
            return true;
        else (inputString == "0x0000000000000000000000000000000000000000000000000000000000000000")
            return false;
    }

    async personalImportAccount(privateKey,password){
        var message = {
            method: "personal_importRawKey",
            params: [privateKey,password],
            jsonrpc: "2.0",
            id: new Date().getTime()
            };
        
        await web3.currentProvider.send(message);
        return;
    }

    async unlockPersonalAccount(account, password){
        var message = {
            method: "personal_unlockAccount",
            params: [account,password],
            jsonrpc: "2.0",
            id: new Date().getTime()
            };
        
        await web3.currentProvider.send(message);
        return;
    }

    async lockPersonalAccount(account){
        var message = {
            method: "personal_lockAccount",
            params: [account],
            jsonrpc: "2.0",
            id: new Date().getTime()
            };
        
        await web3.currentProvider.send(message);
        return;
    }

    sleep(ms){
        return new Promise(resolve=>{
            setTimeout(resolve,ms)
        })
    }

    async createAccountsAndManageKeys(){

        var privateKeyFileName = __dirname + "/keystore/" + "privatekey.json";
        if(fs.existsSync(privateKeyFileName)){
            var keyData = fs.readFileSync(privateKeyFileName,"utf8");
            privateKey = JSON.parse(keyData);
            accountAddressList = Object.keys(privateKey);
        }    
        else{    
            var prvkey1 = keccakM(web3,mnemonic['account1']);
            var prvkey2 = keccakM(web3,mnemonic['account2']);
            var prvkey3 = keccakM(web3,mnemonic['account3']);
            var prvkey4 = keccakM(web3,mnemonic['account4']);
      
            pubkey1 = generatePublicKey(prvkey1);
            pubkey2 = generatePublicKey(prvkey2);
            pubkey3 = generatePublicKey(prvkey3);
            pubkey4 = generatePublicKey(prvkey4);
            
            accountAddressList.length = 0;
            accountAddressList.push(pubkey1);
            accountAddressList.push(pubkey2);
            accountAddressList.push(pubkey3);
            accountAddressList.push(pubkey4);
      
            privateKey[pubkey1] = prvkey1.slice(2,66);
            privateKey[pubkey2] = prvkey2.slice(2,66);
            privateKey[pubkey3] = prvkey3.slice(2,66);
            privateKey[pubkey4] = prvkey4.slice(2,66);
      
            var data = JSON.stringify(privateKey,null, 2);
            fs.writeFileSync(privateKeyFileName,data);
        }
        var noOfPrivateKeys = Object.keys(privateKey).length;
        var noOfAccounts = accountAddressList.length;
        if(noOfAccounts > 0 && noOfPrivateKeys > 0 && (noOfAccounts == noOfPrivateKeys)){
            console.log("There are", accountAddressList.length, "accounts in the config file");
        }
        global.accountAddressList = accountAddressList;
        global.privateKey = privateKey;
        //return [accountAddressList,privateKey];
        return;
    }
      
    async createAccountsAndManageKeysFromPrivateKeys(inputPrivateKeys){
    
        accountAddressList.length = 0;
        let pubkey;
        for(var index = 0; index < inputPrivateKeys.length; index++){
            let eachElement = inputPrivateKeys[index];
            try{
                let prvKey = ethUtil.toBuffer("0x" + eachElement);
                pubkey = '0x' + ethUtil.privateToAddress(prvKey).toString('hex');
            }
            catch (error) {
                console.log("Error in utils.createAccountsAndManageKeysFromPrivateKeys(): " + error);
                return "";
            }    
            accountAddressList.push(pubkey);
            privateKey[pubkey] = eachElement;
        }
        var noOfPrivateKeys = Object.keys(privateKey).length;
        var noOfAccounts = accountAddressList.length;
        if(noOfAccounts > 0 && noOfPrivateKeys > 0 && (noOfAccounts == noOfPrivateKeys)){
            console.log(accountAddressList.length + " ethereum accounts are created using private keys!");
        }
        global.accountAddressList = accountAddressList;
        global.privateKey = privateKey;
        return;
    }
      
    async readWritePrivateKeys(){
        try{
            const password = "password";
            accountAddressList.length = 0;
            accountAddressList = await web3.eth.getAccounts();
            if(accountAddressList.length <= 0)
                return;
            
            var privateKeyFileName = __dirname + "/keystore/" + "privatekey.json";
            var keyStorePath = __dirname;
            
            var keyData = {};
            if(fs.existsSync(privateKeyFileName)){
                keyData = fs.readFileSync(privateKeyFileName,"utf8");
                keyData = JSON.parse(keyData);
            }    
            var key;
            console.log("There are", accountAddressList.length, "ethereum accounts in the blockchain");
            if(accountAddressList.length > 0){
                var i = 0;
                accountAddressList.forEach(eachElement => {
                console.log(i++,"th account",eachElement);
                
                if(keyData[eachElement] != undefined){
                    key = keyData[eachElement];
                }    
                else
                {    
                    try{
                        key = getPrivateKeyFromKeyStore(eachElement, keyStorePath, password);
                    }
                    catch (error) {
                        return;
                    }
                }    
                privateKey[eachElement] = key;
                console.log(key);
                });
            }    
            data = JSON.stringify(privateKey,null, 2);
            fs.writeFileSync(privateKeyFileName,data);
        
            console.log("No of private keys", Object.keys(privateKey).length);
            
            // var newAccount = await web3.eth.personal.newAccount(password);
            // console.log("accountAddressList ", newAccount);
        
            //var account = web3.eth.accounts.privateKeyToAccount(privateKey[accountAddressList[0]]);
            //console.log("accountaddress ", accountAddressList[0], "recovered account with private key is", privateKey[accountAddressList[0]], account.address);
        }
        catch (error) {
            console.log("Error in utils.readWritePrivateKeys: " + error);
        }
    }  
    
    async readAccountsAndKeys(){
        var privateKeyFileName = __dirname + "/keystore/" + "privatekey.json";
        if(fs.existsSync(privateKeyFileName)){
            var keyData = fs.readFileSync(privateKeyFileName,"utf8");
            var privateKey = JSON.parse(keyData);
            var accountAddressList = Object.keys(privateKey);
            console.log("There are", accountAddressList.length, "ethereum accounts & private keys in the privatekey file");
            global.accountAddressList = accountAddressList;
            global.privateKey = privateKey;
            return true;
        }
        else{
            console.log("privatekey.json file does not exist! The program may not function properly!");
            return false;
        }    
    }
      
    async writeAccountsAndKeys(){
        var privateKeyFileName = __dirname + "/keystore/" + "privatekey.json";
        var data = JSON.stringify(privateKey,null, 2);
        fs.writeFileSync(privateKeyFileName,data);
        console.log(accountAddressList.length + " ethereum accounts & private keys are written to the privateKey.json file");
        return false;
    }
      
    async readContractFromConfigContracts(contractName){
        try{
            var contractFileName = __dirname + "/keystore/" + "contractsconfig.json";
            var keyData = {};
            if(fs.existsSync(contractFileName)){
                keyData = fs.readFileSync(contractFileName,"utf8");
                contractsList = JSON.parse(keyData);
                if(contractsList[contractName] != undefined)
                    return contractsList[contractName];
                else 
                    return "";
            }
        }
        catch (error) {
            console.log("Error in readContractFromConfigContracts: " + error);
            return "";
        }
    }    
      
    async writeContractsINConfig(contractName,contractAddress){
        try{
            var contractFileName = __dirname + "/keystore/" + "contractsconfig.json";
            contractsList[contractName] = contractAddress;
        
            var data = JSON.stringify(contractsList,null, 2);
            fs.writeFileSync(contractFileName,data);
        }
        catch (error) {
            console.log("Error in writeContractsINConfig: " + error);
        }
    }

    readContractsFromConfig(){
        try{
              var contractFileName = __dirname + "/keystore/" + "contractsconfig.json";
              var keyData = {};
              if(fs.existsSync(contractFileName)){
                  keyData = fs.readFileSync(contractFileName,"utf8");
                  contractsList = JSON.parse(keyData);
              }
        }
        catch (error) {
            console.log("Error in utils.readContractsFromConfig: " + error);
        }
    }   
}
module.exports = utils;