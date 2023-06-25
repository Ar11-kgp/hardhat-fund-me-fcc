// 00 bcoz we don't always deploy mocks
const { netwrok } = require("hardhat")
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    if (developmentChains.includes(network.name)) {
        // includes keyword checks to see if some var is inside an array (here: chainId)
        log("Local network detected! Deploying mocks...")
        await deploy("MockV3Aggregator", {
            // to get really specific
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER], //constructor parameters for the MockV3Aggregator
            // we will get t0 know wot paras thru looking into node modules or github wala MockV3..code
        })
        log("Mocks deployed!")
        log("-----------------------------") // representing the end of deploy script
    }
}

// to run only our deploy mock script:
module.exports.tags = ["all", "mocks"]
// yarn hardhat deploy --tags
