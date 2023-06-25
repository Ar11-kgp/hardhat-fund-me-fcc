// this will define, how we deploy the fund-me contract

const { getNamedAccounts, deployments } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { netwrok } = require("hardhat")
const { verify } = require("../utils/verify")
require("dotenv").config()
/* same as:
const helperConfig = require("../helper-hardhat-config")
const networkConfig = helperConfig.netwrokConfig */

// we r gonna create a func called deployFunc() and then export it as the default func for hardhat-deploy to look for

/* function deployFunc(hre) {
    console.log("hi")
    hre.getNamedAccounts
    hre.deployments
}

module.exports.default = deployFunc */

// we will make deployFunc as an anonymous func ysing arrow funcs

// this is same as what we have above
/* module.exports = async (hre) => {
    const {getNamedAccounts, deployments} = hre */

module.exports = async ({ getNamedAccounts, deployments }) => {
    // we r using the deployments obj to get 2 functions:
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // if network A, use this address B
    // if network C, use this address D
    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        // we can get the most recent deployment using the cmd "get"
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        // if we r not on a dev chain, if we didn't deploy a mock
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    //mock contract:
    // if the contract doesn't exist, we deploy a minimal version of it for our local testing
    // deploying mocks is technically a deploy script
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // put price feed address
        log: true, // custom logging so that we don't have to do console.log
        waitConfirmations: network.config.blockConfirmations || 1,
        // 1 means, if no blockConfirmations is given in our hardhat.config, we will just wait 1 block
    })
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        //VERIFY
        await verify(fundMe.address, args)
    }
    log("--------------------------------------------------")
}

// hre.getNamedAccounts
// hre.deployments
//}
module.exports.tags = ["all", "fundme"]
// we wanna make a fake price feed contract that we can use and control wen working locally
// re-factoring: going back and chainging the way your code works
