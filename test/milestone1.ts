import { expect } from "chai";
import { ethers } from "hardhat";

describe("Milestone1", function () {
  it("Should return total supply of token", async function () {
    const Milestone1 = await ethers.getContractFactory("Milestone1");
    const amount = 1000000;
    const milestone1 = await Milestone1.deploy(
      amount,
      1,
      1,
      ethers.utils.parseEther("0.0001")
    );
    await milestone1.deployed();

    expect(await milestone1.totalSupply()).to.equal(amount);
  });

  it("Should buy tokens", async function () {
    const Milestone1 = await ethers.getContractFactory("Milestone1");
    const amount = 100000;
    const milestone1 = await Milestone1.deploy(
      amount,
      1,
      1,
      ethers.utils.parseEther("0.0001")
    );
    await milestone1.deployed();

    const [account] = await ethers.getSigners();

    expect(await milestone1.balanceOf(account.address)).to.equal(0);

    const options = { value: ethers.utils.parseEther("1.0") };
    const buyTx = await milestone1.connect(account).buy(options);

    const receiptBuyTx = await buyTx.wait();

    expect(await milestone1.balanceOf(account.address)).to.equal(10000);
    expect(receiptBuyTx.events?.pop()?.event).to.equal("Buy");
  });

  it("Should sell tokens", async function () {
    const Milestone1 = await ethers.getContractFactory("Milestone1");
    const amount = 100000;
    const milestone1 = await Milestone1.deploy(
      amount,
      1,
      1,
      ethers.utils.parseEther("0.0001")
    );
    await milestone1.deployed();

    const [account] = await ethers.getSigners();

    const options = { value: ethers.utils.parseEther("1.0") };
    const u = await milestone1.connect(account).buy(options);

    await u.wait();

    const balanceBefore = await account.getBalance();

    const sellTx = await milestone1.connect(account).sell(5000);

    const receiptSellTx = await sellTx.wait();

    const finney = ethers.utils.parseUnits("1", "finney");

    expect(await milestone1.balanceOf(account.address)).to.equal(5000);
    expect((await (await account.getBalance()).div(finney))).to.equal(balanceBefore.add(ethers.utils.parseEther("0.5")).div(finney));
    expect(receiptSellTx.events?.pop()?.event).to.equal("Sell");
  });

  it("Should start voting", async function () {
    const Milestone1 = await ethers.getContractFactory("Milestone1");
    const amount = 100000;
    const milestone1 = await Milestone1.deploy(
      amount,
      1,
      1,
      ethers.utils.parseEther("0.0001")
    );
    await milestone1.deployed();

    const [account] = await ethers.getSigners();

    const options = { value: ethers.utils.parseEther("1.0") };
    const buyTx = await milestone1.connect(account).buy(options);

    await buyTx.wait();

    const startVotingTx = await milestone1.connect(account).startVoting(ethers.utils.parseEther("0.00001"));

    const receiptStartVotingTx = await startVotingTx.wait();

    expect(receiptStartVotingTx.events?.pop()?.event).to.equal("StartVoting");
  });

  it("Should start voting, vote, end voting and win", async function () {
    const Milestone1 = await ethers.getContractFactory("Milestone1");
    const amount = 100000;
    const milestone1 = await Milestone1.deploy(
      amount,
      30,
      1,
      ethers.utils.parseEther("0.0001")
    );
    await milestone1.deployed();

    const [account] = await ethers.getSigners();

    const options = { value: ethers.utils.parseEther("1.0") };
    const buyTx = await milestone1.connect(account).buy(options);

    await buyTx.wait();

    const oldPrice = await milestone1.currentPrice();
    const newPrice = ethers.utils.parseEther("0.00001");

    const startVotingTx = await milestone1.connect(account).startVoting(newPrice);

    await startVotingTx.wait();

    const voteTx = await milestone1.connect(account).vote(true);

    await voteTx.wait();

    await ethers.provider.send("evm_increaseTime", [30]);

    const endVotingTx = await milestone1.connect(account).endVoting();

    const receiptEndVotingTx = await endVotingTx.wait();

    expect(await milestone1.currentPrice()).to.not.equal(oldPrice);
    expect(await milestone1.currentPrice()).to.equal(newPrice);
    expect(receiptEndVotingTx.events?.pop()?.event).to.equal("EndVoting");
  });

  it("Should start voting, vote, end voting and lose", async function () {
    const Milestone1 = await ethers.getContractFactory("Milestone1");
    const amount = 100000;
    const milestone1 = await Milestone1.deploy(
      amount,
      30,
      1,
      ethers.utils.parseEther("0.0001")
    );
    await milestone1.deployed();

    const [account1, account2] = await ethers.getSigners();

    const account1Options = { value: ethers.utils.parseEther("1.0") };
    const account1BuyTx = await milestone1.connect(account1).buy(account1Options);

    await account1BuyTx.wait();

    const account2Options = { value: ethers.utils.parseEther("2.0") };
    const account2BuyTx = await milestone1.connect(account2).buy(account2Options);

    await account2BuyTx.wait();

    const oldPrice = await milestone1.currentPrice();
    const newPrice = ethers.utils.parseEther("0.00001");

    const startVotingTx = await milestone1.connect(account1).startVoting(newPrice);

    await startVotingTx.wait();

    const account1VoteTx = await milestone1.connect(account1).vote(true);

    await account1VoteTx.wait();

    const account2VoteTx = await milestone1.connect(account2).vote(false);

    await account2VoteTx.wait();

    await ethers.provider.send("evm_increaseTime", [30]);

    const endVotingTx = await milestone1.connect(account1).endVoting();

    const receiptEndVotingTx = await endVotingTx.wait();

    expect(await milestone1.currentPrice()).to.equal(oldPrice);
    expect(await milestone1.currentPrice()).to.not.equal(newPrice);
    expect(receiptEndVotingTx.events?.pop()?.event).to.equal("EndVoting");
  });
});
