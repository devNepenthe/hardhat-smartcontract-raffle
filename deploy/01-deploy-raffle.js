const { network, ethers } = require("hardhat");
const { networkConfig, devChains } = require("../helper-hardhat-config");

const FUND_AMOUNT = ethers.parseEther("2");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let vrfCoordinatorV2Address, subscriptionId;

    const entranceFee = networkConfig[chainId]["entranceFee"];
    const gasLane = networkConfig[chainId]["gasLane"];
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
    const updateInterval = networkConfig[chainId]["updateInterval"];

    if (devChains.includes(network.name)) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.target;
        txResponse = await vrfCoordinatorV2Mock.createSubscription();
        txReceipt = await txResponse.wait(1);
        subscriptionId = txReceipt.logs[0].args.subId;

        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinator"];
        subscriptionId = "0";
    }

    const args = [
        entranceFee,
        vrfCoordinatorV2Address,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        updateInterval,
    ];

    const raffle = await deploy("Raffle", {
        contract: "Raffle",
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: network.config.blockConfirmations || 1, // when on hardhat, >1 waitConfirmations takes forever
    });

    // VRFCoordinatorV2Mock update now requires consuming contract to be added as consumer
    if (devChains.includes(network.name)) {
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address);
    }

    if (!devChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(raffle.target, args);
    }

    log("------------------------------------------");
};

module.exports.tags = ["all", "raffle"];
