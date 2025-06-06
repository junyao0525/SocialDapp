import { BrowserProvider } from "ethers";

const getEthers = async () => {
  if (typeof window === 'undefined') {
    throw new Error("This function can only be called in the browser");
  }

  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider;
};

export default getEthers;



