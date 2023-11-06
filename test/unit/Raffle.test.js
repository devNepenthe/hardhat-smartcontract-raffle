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
              entranceFee = await raffle.getEntranceFee();
              interval = await raffle.getInterval();
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
                  assert.equal(interval.toString(), networkConfig[chainId]["updateInterval"]);
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

          describe("enterRaffle", function () {
              it("reverts when entering with ETH below minimum amount.", async function () {
                  await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(
                      raffle,
                      "Raffle__NotEnoughETH",
                  );
              });

              it("reverts when raffle is not open.", async function () {
                  await raffle.enterRaffle({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1]);
                  await network.provider.send("evm_mine", []);
                  //   await raffle.checkUpkeep("0x"); /** this is not necessary */
                  await raffle.performUpkeep("0x");

                  await expect(
                      raffle.enterRaffle({ value: entranceFee }),
                  ).to.be.revertedWithCustomError(raffle, "Raffle__RaffleNotOpen");
              });

              it("records raffle participants.", async function () {
                  await raffle.enterRaffle({ value: entranceFee });
                  const player = await raffle.getPlayer(0);
                  assert.equal(player, deployer);
              });

              it("emits event upon entry.", async function () {
                  await expect(raffle.enterRaffle({ value: entranceFee })).to.emit(
                      raffle,
                      "RaffleEnter",
                  );
              });
          });

          describe("checkUpkeep", function () {
              it("upkeepNeeded returns false when not enough time has passed.", async function () {
                  await raffle.enterRaffle({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [Number(interval) - 2]);
                  await network.provider.send("evm_mine", []);
                  /** Note:
                   * Since our checkUpkeep() function is a view function
                   * .staticCall(args) is not necessary
                   * If it wasn't like originally showcased, not using staticCall:
                   * 1. returns upkeepNeeded as undefined
                   * 2. sends a transaction, which we do not want if we only
                   *    intend to check the value of upkeepNeeded
                   */
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x");

                  assert(!upkeepNeeded);
              });
          });
      });
