const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const { devChains, networkConfig } = require("../../helper-hardhat-config");

devChains.includes(network.name)
    ? describe.skip
    : describe("Raffle staging tests", function () {
          let raffle, deployer, entranceFee;
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              raffle = await ethers.getContract("Raffle", deployer);
              entranceFee = await raffle.getEntranceFee();
          });
          describe("fulfillRandomWords", function () {
              it("works with live Chainlink Keepers and VRF, and picks a random winner.", async function () {
                  console.log("Setting up test...");
                  const startTimeStamp = await raffle.getLastTimeStamp();
                  const accounts = await ethers.getSigners();

                  console.log("Setting up listener...");
                  await new Promise(async (resolve, reject) => {
                      raffle.once("PickRandomWinner", async () => {
                          console.log("PickRandomWinner event fired!");
                          try {
                              const recentWinner = await raffle.getRecentWinner();
                              const winnerEndingBalance = await raffle.runner.provider.getBalance(
                                  accounts[0],
                              );
                              const numPlayers = await raffle.getNumPlayers();
                              const raffleState = await raffle.getRaffleState();
                              const endTimeStamp = await raffle.getLastTimeStamp();

                              assert.equal(numPlayers.toString(), "0");
                              assert.equal(raffleState.toString(), "0");
                              assert.equal(recentWinner.toString(), accounts[0].address);
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  (winnerStartingBalance + entranceFee).toString(),
                              );
                              assert(endTimeStamp > startTimeStamp);

                              resolve();
                          } catch (error) {
                              console.log(error);
                              reject(error);
                          }
                      });

                      console.log("Entering raffle...");
                      const tx = await raffle.enterRaffle({ value: entranceFee });
                      await tx.wait(1);
                      console.log("Please wait...");
                      const winnerStartingBalance = await raffle.runner.provider.getBalance(
                          accounts[0],
                      );
                  });
              });
          });
      });
