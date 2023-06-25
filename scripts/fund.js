// if we wanna func our contracts really quickly, we can just run this and do it
const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContractAt("FundMe", deployer)
    const sendValue = ethers.utils.parseEther("0.1")
    console.log("Funding contract...")
    const transactionResponse = await fundMe.fund({ value: sendValue })
    await transactionResponse.wait(1)
    console.log("Funded!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
