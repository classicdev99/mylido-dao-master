// SPDX-FileCopyrightText: 2020 Lido <info@lido.fi>

// SPDX-License-Identifier: GPL-3.0

/* See contracts/COMPILERS.md */
pragma solidity 0.4.24;

interface ILidoCustody {

    /***************
     * Events
     ***************/

    event Deposit(address depositor, uint256 amount, uint256 stEthMinted);

    event Withdraw(address user, uint256 amount);

    /***************
     * Functions
     ***************/

    function deposit() external payable returns (uint256);

    function withdraw(uint256 _amount) external;
}
