const Web3       = require('web3')
const EthereumTx = require('ethereumjs-tx');
const ethUtil    = require('ethereumjs-util');

var w1,w2,w3,w4,w5,w6,w7;

const privateKey = "b955ce1cb6456631d4590d8c6a9fd8226e9e4a54087b735c62fade81c8ec6eb2";
const fromAccountAddress = '0x'+ethUtil.privateToAddress("0x"+privateKey).toString('hex');
console.log("privatetransactions:fromAccountAddress ", fromAccountAddress);
const abi = [{"constant":true,"inputs":[],"name":"storedData","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"retVal","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"initVal","type":"uint256"}],"payable":false,"type":"constructor"}];
const contractBytecode = "0x6060604052341561000f57600080fd5b604051602080610149833981016040528080519060200190919050505b806000819055505b505b610104806100456000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680632a1afcd914605157806360fe47b11460775780636d4ce63c146097575b600080fd5b3415605b57600080fd5b606160bd565b6040518082815260200191505060405180910390f35b3415608157600080fd5b6095600480803590602001909190505060c3565b005b341560a157600080fd5b60a760ce565b6040518082815260200191505060405180910390f35b60005481565b806000819055505b50565b6000805490505b905600a165627a7a72305820d5851baab720bba574474de3d09dbeaabc674a15f4dd93b974908476542c23f00029";
//var toContractAddress,value;
var pk = "WCfzYhsstvkn60vwQ3Xw6gp4c40ZK6jhPA1b587IGQw=";
var pk1 = "SoAALH55/9jrMIbEOu8Jj21xrNw/PxPgSn2orlXW9UM=";
//let contract = new w1.eth.Contract(abi);
// const methodData =  contract.deploy({
//     data : contractBytecode,
//     arguments : [42]
// }).encodeABI();

// const txParams = {
//     nonce: 0,
//     gasPrice: '0x00',
//     gasLimit: 4700000,
//     from: fromAccountAddress,
//     to: toContractAddress,
//     privateFor: [pk,pk1],
//     value: value,
//     data: methodData
// }

// function deploySign () {    
//     w1.eth.getTransactionCount(fromAccountAddress, 'pending',(err,nonce)=>{
//         txParams.nonce = nonce;
//         const tx = new EthereumTx(txParams);
//         const privateKeyBuffer = new Buffer(privateKey, 'hex');
//         tx.sign(privateKeyBuffer);
//         const serializedTx = tx.serialize();
//         w1.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'),console.log);
//     });
// }

exports.deploy = async function() {
    const h1 = "http://" + host + ":8545";
    const h2 = "http://" + host + ":8546";
    const h3 = "http://" + host + ":8547";
    const h4 = "http://" + host + ":8548";
    const h5 = "http://" + host + ":8549";
    const h6 = "http://" + host + ":8550";
    const h7 = "http://" + host + ":8551";

    w1 = new Web3(new Web3.providers.HttpProvider(h1));
    w2 = new Web3(new Web3.providers.HttpProvider(h2));
    w3 = new Web3(new Web3.providers.HttpProvider(h3));
    w4 = new Web3(new Web3.providers.HttpProvider(h4));
    w5 = new Web3(new Web3.providers.HttpProvider(h5));
    w6 = new Web3(new Web3.providers.HttpProvider(h6));
    w7 = new Web3(new Web3.providers.HttpProvider(h7));

    var accountAddress = await w1.eth.getAccounts();
    w1.eth.personal.unlockAccount(accountAddress[0],"")
     .then((err)=>{
         const contract = new w1.eth.Contract(abi);
         contract.deploy({
             data:contractBytecode,
             arguments : [99]
         }).send({ 
             from : accountAddress[0],
             gas : 4700000,
             privateFor: [pk,pk1] 
         },console.log)
         .on('error',console.log)
         .on('transactionHash',console.log)
         .on('receipt',(result,err)=>{
             console.log(err||result||result.contractAddress);
             get(result.contractAddress);
         });
     });
}

var get = function (addr){
    const c1 = new w1.eth.Contract(abi,addr);
    const c2 = new w2.eth.Contract(abi,addr);
    const c3 = new w3.eth.Contract(abi,addr);
    const c4 = new w4.eth.Contract(abi,addr);
    const c5 = new w5.eth.Contract(abi,addr);
    const c6 = new w6.eth.Contract(abi,addr);
    const c7 = new w7.eth.Contract(abi,addr);
    c1.methods.get().call().then(console.log).catch((err)=>{console.log("err 1")});
    c2.methods.get().call().then(console.log).catch((err)=>{console.log("err 2")});
    c3.methods.get().call().then(console.log).catch((err)=>{console.log("err 3")});
    c4.methods.get().call().then(console.log).catch((err)=>{console.log("err 4")});
    c5.methods.get().call().then(console.log).catch((err)=>{console.log("err 5")});
    c6.methods.get().call().then(console.log).catch((err)=>{console.log("err 6")});
    c7.methods.get().call().then(console.log).catch((err)=>{console.log("err 7")});
}

// module.export{
//     deploy,
//     get
// };

//deploy()