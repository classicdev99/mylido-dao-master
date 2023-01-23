// SPDX-FileCopyrightText: 2020 Lido <info@lido.fi>

// SPDX-License-Identifier: GPL-3.0

/* See contracts/COMPILERS.md */
pragma solidity 0.4.24;

import "@aragon/os/contracts/lib/math/SafeMath.sol";
import "../0.4.24/interfaces/ILido.sol";
import "../0.4.24/interfaces/ISTETH.sol";
import "./ILidoCustody.sol";
import "./ReentrancyGuard.sol";

/**
 * @title Interacts with Lido to deposit ETH and withdraws stETH
 */

contract LidoCustody is ILidoCustody, ReentrancyGuard {
    using SafeMath for uint256;

    /// @dev address of Lido contract
    address public lido;

    /// @dev stETH balance per user
    mapping(address => uint256) public stEthBalance;

    constructor(address _lido) ReentrancyGuard() {
        require(_lido != address(0), "Invalid lido address");
        lido = _lido;
    }

    /**
     * @dev fallback function
     */
    function() external payable { }

    /**
     * @dev deposits ether into Lido and retrives stETH returned
     * @return stEthMinted stETH amount minted returned from Lido after deposit
     */
    function deposit() external payable nonReentrant() returns (uint256 stEthMinted) {
        stEthMinted = ILido(lido).submit.value(msg.value)(address(0));
        stEthBalance[msg.sender] = stEthBalance[msg.sender].add(stEthMinted);

        emit Deposit(msg.sender, msg.value, stEthMinted);
    }

    /**
     * @dev withdraws stETH that this contract custodies
     * @param _amount witdhraw amount
     */
    function withdraw(uint256 _amount) external nonReentrant() {      
        require(_amount <= stEthBalance[msg.sender], "Too much withdraw amount");

        ISTETH(lido).transfer(msg.sender, _amount);
        stEthBalance[msg.sender] = stEthBalance[msg.sender].sub(_amount);

        emit Withdraw(msg.sender, _amount);
    }
}
