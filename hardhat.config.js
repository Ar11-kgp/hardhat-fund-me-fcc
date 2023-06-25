require("@nomicfoundation/hardhat-toolbox")
require("hardhat-deploy")
require("@nomiclabs/hardhat-ethers")
require("dotenv").config()
require("solidity-coverage")

/** @type import('hardhat/config').HardhatUserConfig */

const SEPOLIA_URL = process.env.SEPOLIA_URL || "https://eth-sepolia" // just if I do not use sepolia
const PRIVATE_KEY = process.env.PRIVATE_KEY || "Oxkey"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "key"
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "key"

module.exports = {
    // solidity: "0.8.8",
    solidity: {
        compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0,
        },
    },
    defaultNetwork: "hardhat",

    networks: {
        hardhat: {
            chainId: 31337,
            // gasPrice: 130000000000,
        },
        sepolia: {
            url: SEPOLIA_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6, //how many blocks we wanna wait
        },
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true, // the reason we do this is bcoz the colors can get messed up after adding to the file
        currency: "USD", // to get the cost in USD for a BC like ethereum
        //coinmarketcap: COINMARKETCAP_API_KEY, // getting the API key
        token: "MATIC",
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
}

// the deploy folder is where our hardhat deploy module looks to deploy our scripts
