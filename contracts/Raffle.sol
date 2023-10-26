/**
 * Raffle smart contract
 * 1. Enter the raffle by paying the set amount.
 * 2. Pick a random winner from the participants.
 * 3. Winner is selected every X minutes.
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

error Raffle__NotEnoughETH();

contract Raffle {
    /* Type Declarations */

    /* State Variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;

    /* Events */
    event RaffleEnter(address indexed player);

    /* Modifiers */

    /* Functions */
    constructor(uint256 entranceFee) {
        i_entranceFee = entranceFee;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughETH();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    // function pickRandomWinner() public {}

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }
}
