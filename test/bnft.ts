import { expect } from "chai";
import { ethers } from "hardhat";

describe("BNFT", function () {
  it("Should return the new NFT after it's mint", async function () {
    const BNFT = await ethers.getContractFactory("BNFT");
    const bnft = await BNFT.deploy();
    await bnft.deployed();

    const uri = "http://localhost";

    const mintTx = await (await bnft.mint(uri)).wait();

    const tokenId = mintTx!.events![0]!.args![2].toNumber();

    expect(tokenId).to.equal(1);

    expect(await bnft.tokenURI(tokenId)).to.equal(uri);
  });
});
