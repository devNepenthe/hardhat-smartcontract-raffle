const { network, ethers } = require("hardhat");
const { devChains } = require("../helper-hardhat-config");

const BASE_FEE = ethers.parseEther("0.25"); // premium: 0.25 LINK
const GAS_PRICE_LINK = 1e9;

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    args = [BASE_FEE, GAS_PRICE_LINK];
    if (devChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...");
        await deploy("VRFCoordinatorV2Mock", {
            contract: "VRFCoordinatorV2Mock",
            from: deployer,
            log: true,
            args: args,
        });
        log("Mocks deployed!");
        log("------------------------------------------");
    }
};

module.exports.tags = ["all", "mocks"];
