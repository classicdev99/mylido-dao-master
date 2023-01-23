const { expect } = require('chai')
const { utils } = require('web3')
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers')
const LidoCustody = artifacts.require('LidoCustody.sol')
const Lido = artifacts.require('Lido.sol')

contract('Assignment - Lido Custody', ([, , alice]) => {
  let lidoCustody, lido

  before('deploy LidoCustody', async () => {
    lido = await Lido.at('0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84')
    lidoCustody = await LidoCustody.new(lido.address)
  })

  describe('deposit', () => {
    let tx, stEthBalanceOfCustody, stEthBalanceOfUser, stEthMinted
    const depositAmount = 100000

    before('make deposit', async () => {
      // get stETH balance
      stEthBalanceOfCustody = await lido.balanceOf(lidoCustody.address)
      stEthBalanceOfUser = await lidoCustody.stEthBalance(alice)

      tx = await lidoCustody.deposit({ from: alice, value: depositAmount })
    })

    it('Deposit event emits', async () => {
      const events = tx.logs.filter((e) => e.event === 'Deposit')

      // check Deposit event has been emitted
      expect(events.length).to.greaterThan(0)

      const { depositor, amount } = events[0].args

      // check event args
      expect(depositor).to.equal(alice)
      expect(amount.toNumber()).to.equal(depositAmount)

      // keep newly minted stETH amount for next test case
      stEthMinted = events[0].args.stEthMinted
    })

    it('stETH balance increased', async () => {
      // check stETH balance of lido custody has been increased
      expect((await lido.balanceOf(lidoCustody.address)).toNumber()).to.greaterThan(stEthBalanceOfCustody.toNumber())

      // check user's stETH balance has been increased
      expect((await lidoCustody.stEthBalance(alice)).toNumber()).to.equal(stEthBalanceOfUser.add(stEthMinted).toNumber())
    })
  })

  describe('withdraw', () => {
    let stEthBalanceOfCustody, stEthBalanceOfUser

    it('fails when withdraw above balance', async () => {
      // get stETH balance
      stEthBalanceOfCustody = await lido.balanceOf(lidoCustody.address)
      stEthBalanceOfUser = await lidoCustody.stEthBalance(alice)

      await expectRevert(lidoCustody.withdraw(stEthBalanceOfUser.add(new utils.BN(1)), { from: alice }), 'Too much withdraw amount')
    })

    it('stETH balance changed after withdraw', async () => {
      expectEvent(await lidoCustody.withdraw(stEthBalanceOfUser, { from: alice }), 'Withdraw', { user: alice, amount: stEthBalanceOfUser })

      expect((await lido.balanceOf(lidoCustody.address)).toNumber()).to.lessThan(stEthBalanceOfCustody.toNumber())

      expect((await lidoCustody.stEthBalance(alice)).toNumber()).to.equal(0)
    })
  })
})
