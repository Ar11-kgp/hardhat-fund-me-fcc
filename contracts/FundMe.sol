//SPDX-License-Identifier: MIT
// We want to
// Get funds from users, withdraw funds and set a minimum funding value in USD
// in solidity, there r 2 keywords using which we can keep variables constant:
// Conventions: constant var: ALL CAPS, immutable var: i_varname
// we can further make our contract gas efficient by
// pragma:
pragma solidity ^0.8.8;

// imports:
import "./PriceConvertor.sol"; // imported the library
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
// import "hardhat/console.sol";

// error codes: shud be written as NameOfContract_Error()
error FundMe__NotOwner(); // to replace if statement

// INterfaces, Libraries, Contracts

/** @title A Contract For Crowd Funding
 *  @author Arya Rajendra
 *  @notice This contract is to demo a sample funding contracts
 *  @dev This implements price feeds as our library
 */

contract FundMe {
    // Type Declarations
    using PriceConvertor for uint256; // using this as a library on top of uinit256
    //uint256 public number;

    // State Variables

    // lets set the min USD value that we want peoPle to send
    // multiplied by 1e18 bcoz ConversionRate() will return a value with 18 zeros
    uint256 public constant minUSD = 50 * 1e18; // This value is assigned outside the BC and to get this value in  BC
    // the constant keyword fixes the value of minUSD and doesn't take any storage
    // 837,273 --> 817,719 transaction cost reduced by using constant keyword
    // 2517 --> 417 execution cost reduced using constant keyword. gas price = value*43000000000
    // We have to use a decentralised Oracle network to get the price of 1 ETH in USD

    // lets create some data structures to keep a track of s_funders
    //creating an array of addresses called s_funders and we will keep adding all the s_funders who keep sending money to us
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded; // crating a mapping from addresses to value funded
    /* 
    function callMeRightAway(){// right after we deploy this contract, we call this func, which will setup us as the owner
        // we would be required to make 2 transactions and that would be really annoying, so we use a constructor instead
    }
*/
    address private immutable i_owner; //creating a global variable. we will set this only once

    // variables that we set one time, but outside of the same line that they are declared can be marked immutable
    // 2558 --> 422 execution cost me farak. we are saving them directly into the bytecode of the contract hence saving costs

    // as the constructor takes a parameter for the priceFeed, we can actually save an aggregatorV3Interface object as a global var
    AggregatorV3Interface public s_priceFeed;

    // current issue: anybody can withdraw from this contract, we want withdraw func to be called only by the owner of this contract
    // modifier is gonna be a keyword that we gonna add right in the function declaration to modify the func with that functionality

    modifier onlyOwner() {
        // this part will get looked into 1st and then the rest of the code of withdraw()
        //require(msg.sender == i_owner, "Sender is not owner");// as we want the condition of only owner to withdraw funds
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        } // this ends up saving lots of gas as we don't have to store a string
        // revert keyword does the exact same thing as require, without the condition
        _; // this underscore represents doing the rest of the code
    } // if the require statement would have been below underscore, the rest of the code would have been executed 1st and then the condition

    // Functions Order:
    //// constructor
    //// receive
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view/pure

    // we are parameterizing the priceFeedAddress and passing it with a constructor that gets saved as a global var into an
    // aggregatorV3 interface type, or passing it to a getConversionRate function, which passes it to the het price function, which then just calls latestRoundData
    constructor(address priceFeedAddress) {
        // one of the parameters which we would like constructor to have is the address
        // func that gets called immediately, whenever u deploy a contract
        // we can have the constructor set up who the owner of this contract is
        i_owner = msg.sender; // msg.sender will be whoever deployed this contract
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // What happens if someone sends this contract ETH without calling the fund function ?
    // we can add fallback and receive funcs just in case somebody actully sends us contract money instead of calling fund()
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
     *  @notice This function funds this contract
     *  @dev This implements price feeds as our library
     */
    function fund() public payable {
        // msg.value.getCoversionRate() is same as getConversionRate(msg.value)
        // we want to be able to set the minimum amt in USD
        // 1. How do we send ETH to this contract?
        // we need to mark the func as payable
        // smart contracts can hold funds like wallets
        //number = 5; //if the requirement isn't met, it will undo the prev lines of code
        require(
            msg.value.getConversionRate(s_priceFeed) >= minUSD, // initial parameter of getConversionRate is gonna be msg.value
            "Didn't send enough!" // contract will fail if not enuf ETH is sent
        ); //msg.value helps to access value. atleast 1 eth needs to be sent is sending anything
        // msg.value is actually the 1sr parameter of getConversionRate()

        s_funders.push(msg.sender); // msg,sender is also an always available global keyword
        //.value stands for how much eth is sent, .sender stands for the address of whoever calls the fund()
        // since our address is sending the ether, we gonna add our address to this s_funders list/array
        // this way we can keep track of all the donaters who are donating to our contract

        s_addressToAmountFunded[msg.sender] = msg.value;

        // money math is done in terms of wei
        // require keyword is a checker
        // reverting is cancelling the transaction when requirement is not met and undoing any action before and sending the remaining gas back
    }

    // once the s_funders have gone ahead and funded, we r going to want the project to be able to withdraw the funds out of this contract
    // so that they can actually go ahead and buy things for this project

    function withdraw() public onlyOwner {
        // we will have to reset our s_funders array and addressToAmountFunded
        // since we will be withdrawing all the fund, those amnts shud go back down to 0
        // hence we shud loop thru the s_funders array and update our mapping object so that each of these s_funders now has 0
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex]; // now we have this funder address and we will use this to reset our mapping
            s_addressToAmountFunded[funder] = 0; //in fund() we update the amnt, in withdraw() we will reset it back to 0
            // we still need to reset s_funders array to a blank array and actually withdarw the funds
            // to reset the array, we cud loop thru it and delete the objects or just totally refresh this variable
        }
        s_funders = new address[](0); // we r saying this s_funders var now equals a brand new address array with 0 objects in it to start
        // we r gonna start it as a completely brand new array

        (
            bool callSuccess, /*bytes memory dataReturned*/

        ) = payable(msg.sender).call{value: address(this).balance}(""); // leaving blank as we don't wanna call any func rn
        // we will use this call func as if its a regular transaction and we can add stuff like msg.value
        // call returns 2 vars
        // since bytes objects are arrays, data returns needs to be in memory but as in our code, we r not callin any func, we dont care abt the data returned
        require(callSuccess, "Call Failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        // funderIndex < s_funders.length; this is costing a lot of gas
        // so instead of reading from storage again n again, we can store this array into memory one time nd then read from memory
        address[] memory funders = s_funders;
        // mappings can't be in memory
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0; // resetting our funders mapping
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    //View/Pure functions: the getters

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
// there r 3 different ways to send a blockchain currency
// transfer, send and call
/*You can send Ether to other contracts by

        transfer (2300 gas, throws error)
        send (2300 gas, returns bool)
        call (forward all gas or set gas, returns bool)*/

// transfer:
/*       payable(msg.sender).transfer(address(this).balance);// in solidity in order to send the native blockchain token, u can only work with payable addresses
        // this keyword refers to the whole contract
        //payable(msg.sender) = payable address

        // send:
        bool sendSuccess = payable(msg.sender).send(address(this).balance);
        require(sendSuccess, "Send Failed");// this way, if it fails, we will still revert by adding our require statement
        // transfer automatically reverts, but send needs require statement
 */
//call:
// we can use this command to call virtually any func in all of ethereum, without even having to have the ABI

// as there are a lot of functions which require msg.sender to be owner or require other requires
// we don't have to copy paste this line to every single one of our functions, this is where modifiers come in

// After Deploying:
// withdraw() will be of orange color as we ain't paying but actually gaining ethereum
// fund() will be red bcoz it is a payable function that we r going to be sending ethereum to

// Whenever u run into errors: follow these steos
// 1. Tinker and try to pin[point exactly what's going on.
// limit tinkering to 20 mins and make sure u have atleast spend 15mins yiurself
// 2. Google search the exact error
// go to the ffc github discussion section to see if anyone has already asked ur ques
// 3. Ask ques on stack overflow or stack exchange ETH
