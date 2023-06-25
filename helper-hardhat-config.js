// if network A, use this address B
// if network C, use this address D
// to enable this functionality, we use aave protocol
const networkConfig = {
    11155111: {
        // chainId of sepolia
        name: "sepolia",
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    }, // now we have a simple methodology of keeping track of different price feeds or chains

    137: {
        // polygon
        name: "polygon",
        ethUsdPriceFeed: "0xf9680d99d6c9589e2a93a78a04a279e509205945",
    },
}
const developmentChains = ["hardhat", "localhost"]
// these are the chains on whcih i can deploy my mocks to
const DECIMALS = 8
const INITIAL_ANSWER = 200000000000

module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
}
