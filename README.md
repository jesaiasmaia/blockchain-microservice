# BSC Blockchain Transaction Monitor & Withdraw System

This project is a backend service built with TypeScript that connects to the Binance Smart Chain (BSC) blockchain to monitor transactions on specific contracts and perform actions such as validating transactions and processing withdrawal requests submitted by users.

## Features

- **Blockchain Monitoring**: Continuously monitors the BSC blockchain for transactions on specific smart contracts.
- **Transaction Validation**: Validates transactions on the blockchain and ensures they meet specific criteria.
- **Withdrawal Handling**: Processes withdrawal requests submitted by users through the backend, interacting with smart contracts for execution.
- **Backend-Driven Actions**: Actions are triggered based on user inputs or requests sent to the backend service.

## Prerequisites

To run this project, ensure that you have the following installed:

- Node.js (v16.x or higher)
- TypeScript (v4.x or higher)
- Binance Smart Chain (BSC) Node or access to a BSC provider like [Infura](https://infura.io/) or [Alchemy](https://www.alchemy.com/)
- Ethers.js or Web3.js for blockchain interactions
- Redis (optional, for queue management)

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/jesaiasmaia/blockchain-microservice.git
cd blockchain-microservice
npm install
