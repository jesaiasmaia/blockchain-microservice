import { Contract, JsonRpcProvider, ethers } from "ethers";
import axios, { AxiosResponse } from 'axios';
import BoxContract from './abi/box_contract.json'

import 'dotenv/config'

require('dotenv').config()

async function sendWebhook(url: string, dados: any, token: string): Promise<AxiosResponse> {
    try {
      const response = await axios.post(url, dados, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json', // Adapte conforme necessário
        },
      });
  
      return response;
    } catch (erro) {
      console.error('Erro na solicitação POST:', erro);
      throw erro;
    }
  }

(async () => {
    const provider = new JsonRpcProvider(process.env.CRYPTO_PROVIDER_BSC ?? '');

    const abi = BoxContract;

    const contractAddress = process.env.CONTRTACT_ADDRESS ?? '';

    const contract = new Contract(contractAddress, abi, provider)

    contract.on("PurchaseMade", (buyer, boxId, quantity, _amount, event) => {
        const amount = ethers.formatEther(_amount)
        
        sendWebhook(process.env.URL_API_BACKEND!, {
            wallet: buyer,
            box:boxId.toString(),
            amount:amount.toString(),
            hash:event.log.transactionHash
        }, process.env.SERVER_TOKEN!);

        // Optionally, stop listening
        //event.removeListener();
    });
})()
