import express from 'express';
import checkToken from './middlewares/checkToken';
import { Wallet, ethers, toUtf8Bytes, hashMessage, recoverAddress, getAddress, JsonRpcProvider, Interface, Contract } from 'ethers';
import bodyParser from 'body-parser';
import BoxContract from './abi/box_contract.json'
import {marketplaceABI} from './abi/marketplace'
import redis, { RedisClientType, createClient } from 'redis';
import withdrawABI from './abi/withdraw';
import {fusionABI} from './abi/fusion';

import 'dotenv/config'
import processWithdrawals from './processWithdraws';
import { checkOrCreateWallet } from './createWallet';

require('dotenv').config()


const client: RedisClientType<any, any> = createClient({
    url: process.env.REDIS_URL,
    database: parseInt(process.env.REDIS_DB_INDEX || "0")
});
client.connect();

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.use(express.json());

const provider = new JsonRpcProvider(process.env.CRYPTO_PROVIDER_BSC);

app.use((req, res, next) => {
    if (req.path !== '/') {
        return checkToken(req, res, next);
    } else {
        next();
    }
});

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to microservice!', version: '1.0.0' });
});

app.post('/sign-message', async (req, res) => {
    const wallet = new Wallet('');

    const mensagemBytes = toUtf8Bytes("Welcome! RDXX waits you!");

    const signedMessage = await wallet.signMessage(mensagemBytes);

    return res.json({ success: true, signed: signedMessage, 'publicKey': wallet.address });
});

app.post('/check-signed-message', async (req, res) => {
    try {
        const { address, message, signature } = req.body;
        console.log(req.body);

        if (!address || !message || !signature) {
            return res.status(400).json({ error: 'Wrong parameters' });
        }

        const messageBytes = toUtf8Bytes(message);

        const messageHash = hashMessage(messageBytes);

        const publickKey = recoverAddress(messageHash, signature);

        const enderecoVerificado = getAddress(publickKey) === getAddress(address);

        return res.json({ success: enderecoVerificado, message: enderecoVerificado ? 'Signature correct' : 'Error' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error' });
    }
});

app.get('/get-transaction-event/PurchaseMade/:hash', async (req, res) => {

    if(!req.params.hash)
        return res.status(500).json({ error: 'Empty hash' });

    const hash = req.params.hash.toString();

    const provider = new JsonRpcProvider(process.env.CRYPTO_PROVIDER_BSC ?? '');

    const abi = BoxContract;

    const contractAddress = process.env.CONTRTACT_ADDRESS ?? '';

    const contract = new Contract(contractAddress, abi, provider)

    const receipt = await provider.getTransactionReceipt(hash);

    if(receipt){

        var returnedData = {};
        if(receipt.status == 1){
            receipt!.logs.forEach(function(value){
                const event = contract.interface.parseLog(value);
                
                if(event?.name == 'PurchaseMade'){
                    const amount = ethers.formatEther(event?.args[3])
    
                    returnedData = {
                        "buyer": event?.args[0],
                        "boxId": event?.args[1].toString(),
                        "quantity": event?.args[2].toString(),
                        "amount": amount.toString(),
                        "status": 1,
                    }
                }
            });
    
            return res.status(200).json({ data: returnedData });
        } else if(receipt.status == 0){
            returnedData = {
                "status": 0,
            }
            return res.status(200).json({ data: returnedData });
        }
    }

    return res.status(200).json({ data: {} });
});

app.get('/get-fragment-transaction/:hash', async (req, res) => {

    if(!req.params.hash)
        return res.status(500).json({ error: 'Empty hash' });

    return res.status(200).json({ data: {} });
});

app.get('/get-potion-transaction/:hash', async (req, res) => {

    if(!req.params.hash)
        return res.status(500).json({ error: 'Empty hash' });

    const hash = req.params.hash.toString();

    const provider = new JsonRpcProvider(process.env.CRYPTO_PROVIDER_BSC ?? '');

    const abi = BoxContract;

    const contractAddress = process.env.CONTRACT_POTION ?? '';

    const contract = new Contract(contractAddress, abi, provider)

    const receipt = await provider.getTransactionReceipt(hash);

    if(receipt){

        var returnedData = {};
        if(receipt.status == 1){
            
            returnedData = {"status": 1}

            receipt!.logs.forEach(function(value){
                const event = contract.interface.parseLog(value);
                
                if(event?.name == 'PurchaseNFT'){
                    const amount = ethers.formatEther(event?.args[1])
    
                    returnedData = {
                        "buyer": event?.args[0],
                        "amount": amount.toString(),
                        "status": 1,
                    }
                }
            });
    
            return res.status(200).json({ data: returnedData });
        } else if(receipt.status == 0){
            returnedData = {
                "status": 0,
            }
            return res.status(200).json({ data: returnedData });
        }
    }

    return res.status(200).json({ data: {} });
});

app.get('/get-transaction-event/merge/:hash', async (req, res) => {

    if(!req.params.hash)
        return res.status(500).json({ error: 'Empty hash' });

    const hash = req.params.hash.toString();

    const provider = new JsonRpcProvider(process.env.CRYPTO_PROVIDER_BSC ?? '');

    const abi = fusionABI;

    const contractAddress = process.env.CONTRACT_MERGE ?? '';

    const contract = new Contract(contractAddress, abi, provider)

    const receipt = await provider.getTransactionReceipt(hash);

    if(receipt){

        var returnedData = {};
        if(receipt.status == 1){
            
            returnedData = {"status": 1}

            receipt!.logs.forEach(function(value){
                const event = contract.interface.parseLog(value);
                
                if(event?.name == 'NftFusion'){
                    const price = ethers.formatEther(event?.args[1])
                    const priceRestoreLife = ethers.formatEther(event?.args[2])
    
                    returnedData = {
                        "user": event?.args[0],
                        "price": price.toString(),
                        "priceRestoreLife": priceRestoreLife.toString(),
                        "level": event?.args[3].toString(),
                        "status": 1,
                    }
                }
            });
    
            return res.status(200).json({ data: returnedData });
        } else if(receipt.status == 0){
            returnedData = {
                "status": 0,
            }
            return res.status(200).json({ data: returnedData });
        }
    }

    return res.status(200).json({ data: {} });
});

app.get('/get-transaction-event/marketplace/:hash/:event', async (req, res) => {

    if(!req.params.hash)
        return res.status(500).json({ error: 'Empty hash' });

    console.log("======= TRANSACTION CHECK MARKETPLACE ============");
    console.log(req.params.hash);
    console.log(req.params.event);
    console.log(process.env.CONTRTACT_MARKETPLACE_ADDRESS);

    const hash = req.params.hash.toString();
    const eventName = req.params.event.toString();

    const provider = new JsonRpcProvider(process.env.CRYPTO_PROVIDER_BSC ?? '');

    const abi = marketplaceABI;

    const contractAddress = process.env.CONTRTACT_MARKETPLACE_ADDRESS ?? '';

    const contract = new Contract(contractAddress, abi, provider)

    const receipt = await provider.getTransactionReceipt(hash);

    if(receipt){

        var returnedData:any = [];
        if(receipt.status == 1){
            console.log('Logs count',receipt!.logs.length);
            receipt!.logs.forEach(function(value){
                console.log(value);
                const event = contract.interface.parseLog(value);
                
                returnedData = {"status": 1}

                if(event?.name == 'ItemListed' && eventName == 'ItemListed'){
                    const amount = ethers.formatUnits(event?.args[2], 6)

                    returnedData = {
                        "name": event?.name,
                        "seller": event?.args[0],
                        "uuid": event?.args[1],
                        "price": amount.toString(),
                        "status": 1,
                    };
                } else if(event?.name == 'NftSold' && eventName == 'NftSold'){
                    const amount = ethers.formatUnits(event?.args[3], 6)

                    returnedData = {
                        "name": event?.name,
                        "buyer": event?.args[0],
                        "uuid": event?.args[1],
                        "seller": event?.args[2],
                        "price": amount.toString(),
                        "status": 1,
                    };
                } else if(event?.name == 'ItemRemoved' && eventName == 'ItemRemoved'){

                    returnedData = {
                        "name": event?.name,
                        "seller": event?.args[0],
                        "uuid": event?.args[1],
                        "status": 1,
                    };
                } else if(event?.name == 'ItemPriceSet' && eventName == 'ItemPriceSet'){
                    const amount = ethers.formatUnits(event?.args[2], 6)
                    returnedData = {
                        "name": event?.name,
                        "seller": event?.args[0],
                        "uuid": event?.args[1],
                        "price": amount.toString(),
                        "status": 1,
                    };
                }
            });
            console.log(returnedData);
            return res.status(200).json({ data: returnedData });
        } else if(receipt.status == 0){
            console.log("TRANSACTION NOT CONFIRMED");
            returnedData = {
                "status": 0,
            }
            return res.status(200).json({ data: returnedData });
        }
    }

    console.log("TRANSACTION NOT FOUND");

    return res.status(200).json({ data: {} });
});

app.post('/withdraw', async (req, res) => {
    const { wallet, amount } = req.body;
    if (!wallet || !amount) {
        return res.status(400).json({ error: 'Wrong parameters' });
    }

    const key = `wallet:${wallet}`;
    const exists = await client.exists(key);

    if (exists) {
        return res.status(409).json({ error: 'Transaction already started' });
    } else {
        /*
        "{\"wallet\":\"0x3781f4b7d8ffba39057a4606a66205b366fdd772\",\"amount\":5785,\"status\":\"success\",\"hash\":\"0x423689d1dde17b9bff25ece6abd7822fbe5677cf3c1045e76a151c91a5176271\",\"errorReason\":\"\"}"
        */
        const transaction = JSON.stringify({
            wallet,
            amount,
            status: 'pending',
            hash: '',
            errorReason:''
        });

        await client.set(key, transaction);
        return res.status(200).json({ success: true });
    }
});

app.get('/transaction/:wallet', async (req, res) => {
    const key = `wallet:${req.params.wallet}`;

    const data:any = await client.get(key);

    return res.json(JSON.parse(data));
});

app.delete('/transaction/:wallet', async (req, res) => {

    const key = `wallet:${req.params.wallet}`;

    await client.del(key);
    return res.status(204).send();
});

//processWithdrawals(client, provider, contractSettings);

checkOrCreateWallet().then(walletData => {
    console.log(`Wallet loaded: ${walletData.publicKey}`);

    const contractSettings = {
      abi: withdrawABI,
      address: process.env.CONTRACT_WITHDRAW!,
      privateKey: walletData.privateKey!,
    };
  
    processWithdrawals(client, provider, contractSettings);

    app.listen(port, () => {
      console.log(`Server online http://localhost:${port}`);
    });
  }).catch(error => {
    console.error('Wrong wallet:', error);
    process.exit(1);
  });
