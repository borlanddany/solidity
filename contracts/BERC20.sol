//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BERC20 is ERC20 {
    constructor(uint256 amount) ERC20("Borland token", "BERC") {
        _mint(msg.sender, amount);
    }
}