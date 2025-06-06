import { ethers } from "hardhat";

async function main() {
  console.log("Deploying SocialDApp contract...");

  const SocialDApp = await ethers.getContractFactory("SocialDApp");
  const socialDApp = await SocialDApp.deploy();

  await socialDApp.waitForDeployment();

  const address = await socialDApp.getAddress();
  console.log(`SocialDApp deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 