// we gonna use hardhat-deploy to setup our tests

// we have to 1st puul in our deployments obj
const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe, deployer, mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1") // this parseEthers converts this 1 to 10^18 wei
          beforeEach(async function () {
              // deploy our FundMe contract using hardhat-deploy

              // we can also tell ethers, which acc we want connected to fundMe
              deployer = (await getNamedAccounts()).deployer // we need to abstract jus the deployer from getNamedAccounts

              // another way to get accounts directly from your hardhat.config is:
              /*  const accounts = await ethers.getSigners()
        const accountZero = accounts[0]   */

              await deployments.fixture(["all"])
              // fixture functions allows us to run our deploy folder with as many tags as we want
              // everything in that folder gets deployed by just this line

              // once all of our contracts have been deployed, we will start getting them
              // hardhat deploy grabs ethers with a func called getContract
              fundMe = await ethers.getContract("FundMe", deployer)
              // getContract will get the most recent deployment of whatever contract we tell it
              // whenever we call a func with fundMe, it will automatically be from deployer acc

              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
              // now we gonna make a bunch of transactions on our fundMe in order to test it
          })

          describe("constructor", function () {
              it("MockAggregator address should be the getPriceFeed address", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async function () {
              // it("Fails if enuf ETH is not sent", async function () {
              //     await expect(fundMe.fund()).to.be.revertedWith(
              //         "You need to spend more ETH"
              //     )
              // })

              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })

              it("Updates the amount funded data structure", async function () {
                  // we r calling fund() but we also need to pass some value to it so that we can test
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  // it is the mapping of each addres to amount funded: mapping(address => uint256) public s_addressToAmountFunded;
                  // hence deployer parameter in s_addressToAmountFunded gives us the amount funded
                  assert.equal(response.toString(), sendValue.toString()) // checks if value is updated
              })

              it("Adds funder to array of getFunder", async () => {
                  //await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getFunder(0) // getting the getFunder' address
                  assert.equal(response, deployer)
              })
          })

          describe("withdraw", async () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })

              it("Should withdraw ETH from a single founder", async function () {
                  // ARRANGE: actually check if we're correctly wihtdrawing the ETH from a single founder
                  // 1st we will get the starting balance of fundMe contract and starting balance of the deployer
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address) // fundMe contract comes with a provider. we just wanted to use getBalance func from provider obj
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // getting the starting balances to see later how much they have changed wen we withdraw

                  // ACT: Actaully running the withdraw func
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  // we can find gasCost from our transactionReceipt
                  const { gasUsed, effectiveGasPrice } = transactionReceipt // pulling out these values\
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert: check the balances
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              }) // startingFundMeBalance will be a big no., so its better to use .add instead of +
              // also, wen we calling withdraw, our deployer spent gas!

              it("allows us to withdraw with multiple getFunder", async function () {
                  // ARRANGE: we will create different accounts and fund them
                  const accounts = await ethers.getSigners()
                  // we can loop thru these accounts and have each one of these call fund()
                  for (let i = 1; i < 6; i++) {
                      // starting with 1 as 0th index will be deployer
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      ) // fundMe contract is connected to our deployer account, this is the acc which is calling the transaction
                      // we created new objects to connect to all of these diff accs
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address) // fundMe contract comes with a provider. we just wanted to use getBalance func from provider obj
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // ACT: Withdrawing
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  // we can find gasCost from our transactionReceipt
                  const { gasUsed, effectiveGasPrice } = transactionReceipt // pulling out these values\
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // ASSERT:
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // Make sure getFunder array is reset properly
                  // to do this, we can jus check to see if looking @ 0th position throws an error
                  await expect(fundMe.getFunder(0)).to.be.reverted // this shud revert

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  } // making sure that all the mappings r correctly updated to 0
              })

              it("only allows the owner to withdraw", async () => {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1] // we saying the 1st acc will be some random attacker
                  // we will connect this attacker to a new contract
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
                  // attacker shud not be able to withdraw
              })

              it("cheaperWithdraw testing...", async function () {
                  // ARRANGE: we will create different accounts and fund them
                  const accounts = await ethers.getSigners()
                  // we can loop thru these accounts and have each one of these call fund()
                  for (let i = 1; i < 6; i++) {
                      // starting with 1 as 0th index will be deployer
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      ) // fundMe contract is connected to our deployer account, this is the acc which is calling the transaction
                      // we created new objects to connect to all of these diff accs
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address) // fundMe contract comes with a provider. we just wanted to use getBalance func from provider obj
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // ACT: Withdrawing
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  // we can find gasCost from our transactionReceipt
                  const { gasUsed, effectiveGasPrice } = transactionReceipt // pulling out these values\
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // ASSERT:
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // Make sure getFunder array is reset properly
                  // to do this, we can jus check to see if looking @ 0th position throws an error
                  await expect(fundMe.getFunder(0)).to.be.reverted // this shud revert

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  } // making sure that all the mappings r correctly updated to 0
              })
          })
      })
