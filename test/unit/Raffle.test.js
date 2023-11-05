const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const { devChains, networkConfig } = require("../../helper-hardhat-config");
const { boolean } = require("hardhat/internal/core/params/argumentTypes");

!devChains.includes(network.name)
    ? describe.skip
    : describe("Raffle", function () {
          let raffle, vrfCoordinatorV2Mock, deployer;
          const chainId = network.config.chainId;

          beforeEach(async function () {
              await deployments.fixture(["all"]);
              deployer = (await getNamedAccounts()).deployer;
              raffle = await ethers.getContract("Raffle", deployer);
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
          });

          describe("constructor", function () {
              it("initializes the entranceFee correctly.", async function () {
                  const entranceFee = await raffle.getEntranceFee();
                  assert.equal(entranceFee, networkConfig[chainId]["entranceFee"]);
              });

              it("initializes the gasLane correctly.", async function () {
                  const gasLane = (await raffle.getGasLane()).toString();
                  assert.equal(gasLane, networkConfig[chainId]["gasLane"]);
              });

              it("initializes the callbackGasLimit correctly.", async function () {
                  const callbackGasLimit = (await raffle.getCallbackGasLimit()).toString();
                  assert.equal(callbackGasLimit, networkConfig[chainId]["callbackGasLimit"]);
              });

              it("initialized the update interval correctly.", async function () {
                  const interval = (await raffle.getInterval()).toString();
                  assert.equal(interval, networkConfig[chainId]["updateInterval"]);
              });

              it("initializes the raffleState correctly.", async function () {
                  const raffleState = (await raffle.getRaffleState()).toString();
                  assert.equal(raffleState, "0");
              });

              it("initializes the lastTimeStamp correctly.", async function () {
                  const blockHash = (await deployments.get("Raffle")).receipt.blockHash;
                  const block = await ethers.provider.getBlock(blockHash);
                  const lastTimeStamp = await raffle.getLastTimeStamp();
                  assert.equal(lastTimeStamp.toString(), block.timestamp.toString());
              });

              it("sets the vrf coordinator address correctly.", async function () {
                  const vrfCoordinatorV2Address = await raffle.getVrfCoordinatorAddress();
                  assert.equal(vrfCoordinatorV2Address, vrfCoordinatorV2Mock.target);
              });

              it("sets the subId correctly.", async function () {
                  const subId = (await raffle.getSubId()).toString();
                  assert.equal(subId, (await deployments.get("Raffle")).args[3].toString());
              });
          });
      });
