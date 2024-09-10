import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

const walletFilePath = path.join(__dirname, 'walletWithdraw.json');

interface WalletData {
    publicKey: string;
    privateKey: string;
}

export const checkOrCreateWallet = async (): Promise<WalletData> => {
    try {
        if (fs.existsSync(walletFilePath)) {
            const data = fs.readFileSync(walletFilePath, 'utf8');
            return JSON.parse(data) as WalletData;
        } else {
            const wallet = ethers.Wallet.createRandom();
            const walletData: WalletData = {
                publicKey: wallet.address,
                privateKey: wallet.privateKey
            };

            fs.writeFileSync(walletFilePath, JSON.stringify(walletData, null, 2), 'utf8');

            return walletData;
        }
    } catch (error) {
        console.error('Failed to check or create wallet:', error);
        throw error;
    }
};
