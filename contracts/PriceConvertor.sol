// SPDX-License-Identifier: MIT
// this file is going to be a library that we r going to attach to a uint256

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// importing directly from github
// now we have the minimilistic interface which will gib us the API
// we can actually go ahead and get the price

library PriceConvertor {
    // all the functions inside our lib need to be internal

    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        // to get the price, we need to use one of the chainlink datafeeds
        // we will be calling contracts outside of our project, hence we will need Address and ABI
        //address: 0x694AA1769357215DE4FAC081bf1f309aDC325306
        //creating an AggregatorV3Interface object = that cobtract @ that address

        // passing priceFeed in getConversionRate so that we don't have to hard code it anymore

        (, int256 price, , , ) = priceFeed.latestRoundData(); // int bcoz some priceFeeds could be -ve
        // removing the variables which latestRoundData returns and we don't need
        // ETH in USD. To get same no. of 18 decimal places and type casting to uint256
        return uint256(price * 1e10);
        // refer: https://github.com/smartcontractkit/chainlink/blob/develop/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol
    }

    function getVersion() internal view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            0x694AA1769357215DE4FAC081bf1f309aDC325306
        );
        return priceFeed.version();
    }

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        // we are passing some eth amount and on the other side we gonna get how much that eth is worth in terms of USD
        // in our lib, the 1st var that gets passed to the func is gonna be the object that its called on itself
        // msg.value will be passed as the input parameter
        uint256 ethPrice = getPrice(priceFeed); //1st we r calling our getPrice func to get the price of ethereum
        uint256 ethAmountInUSD = (ethPrice * ethAmount) / 1e18; //always multiply b4 u divide
        // dividing by 1e18 as the product will lead to 36 zeros
        return ethAmountInUSD;
    }
}
