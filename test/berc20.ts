import { expect } from "chai";
import { ethers } from "hardhat";

describe("BERC20", function () {
  it("Should return total supply of ERC20 token", async function () {
    const BERC20 = await ethers.getContractFactory("BERC20");
    const amount = 1000000;
    const berc20 = await BERC20.deploy(amount);
    await berc20.deployed();

    expect(await berc20.totalSupply()).to.equal(amount);
  });
});
