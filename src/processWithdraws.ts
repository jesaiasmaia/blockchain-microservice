import cron from 'node-cron';
import { InterfaceAbi, ethers } from 'ethers';
import redis from 'redis';
import { RedisClientType } from 'redis';
import { checkOrCreateWallet } from './createWallet';

interface Transaction {
    wallet: string;
    amount: string;
    status: 'pending' | 'in_process' | 'success' | 'failed';
    hash: string;
    errorReason:string;
}

interface ContractSettings {
    abi: InterfaceAbi;
    address: string;
    privateKey: string;
}

const processWithdrawals = (
    client: RedisClientType<any, any>, 
    provider: ethers.JsonRpcProvider, 
    { abi, address }: ContractSettings
) => {
    cron.schedule('*/1 * * * *', async () => {

        const { privateKey } = await checkOrCreateWallet();
        const customWallet = new ethers.Wallet(privateKey, provider);

        const keys = await client.keys('*');

        console.log(keys)

        for (const key of keys) {
            console.log(key);
            let txn = JSON.parse(await client.get(key) || '') as Transaction;
            if (txn && txn.status === 'pending') {
                txn.status = 'in_process';
                await client.set(key, JSON.stringify(txn));

                const contract = new ethers.Contract(address, abi, customWallet);

                try {
                    const txResponse = await contract.withdrawNoSwap(txn.wallet, ethers.parseEther(txn.amount.toString()));
                    const receipt = await txResponse.wait();

                    txn.hash = txResponse.hash;
                    txn.status = receipt.status === 1 ? 'success' : 'failed';
                    
                    console.log(receipt)
                    
                    await client.set(key, JSON.stringify(txn));
                } catch (error:any) {
                    console.error('Error processing transaction:', error);
                    txn.status = 'failed';
                    
                    if (error.reason) {
                        txn.errorReason = error.reason;
                    } else {
                        txn.errorReason = error.message;
                    }

                    await client.set(key, JSON.stringify(txn));
                }
            }
        }
    });
};

export default processWithdrawals;
