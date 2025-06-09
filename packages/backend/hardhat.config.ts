import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";

if (!process.env.API_URL) throw new Error("API_URL is required");
if (!process.env.PRIVATE_KEY) throw new Error("PRIVATE_KEY is required");

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
    },
    sepolia: {
      url: process.env.API_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
};

export default config;
