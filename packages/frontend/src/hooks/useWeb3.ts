import SocialDApp from "@/contracts/socialMedia.json";
import { ethers } from "ethers";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

const CONTRACT_ADDRESS = "0xe8fAEE27f64Dde6CBc0c77A2Dcda0E61D9c98C63";

interface Web3HookReturn {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  contract: ethers.Contract | null;
  account: string;
  isRegistered: boolean;
  loading: boolean;
  connectWallet: () => Promise<{ provider: ethers.BrowserProvider; signer: ethers.JsonRpcSigner; contract: ethers.Contract; address: string; registered: boolean }>;
  disconnectWallet: () => void;
  createPost: (content: string) => Promise<ethers.ContractTransactionResponse>;
  editPost: (postId: string, content: string) => Promise<ethers.ContractTransactionResponse>;
  getAllPosts: () => Promise<[ethers.BigNumberish[], string[], string[], ethers.BigNumberish[]]>;
  registerUser: (name: string) => Promise<ethers.ContractTransactionResponse>;
  isUsernameAvailable: (username: string) => Promise<boolean>;
}

export function useWeb3(): Web3HookReturn {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    try {
      setLoading(true);
      if (typeof window.ethereum === "undefined") {
        throw new Error("Please install MetaMask");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        SocialDApp.abi,
        signer
      );

      setProvider(provider);
      setSigner(signer);
      setContract(contract);
      setAccount(address);

      // Check if user is registered
      const registered = await contract.isUserRegistered(address);
      setIsRegistered(registered);

      // Set cookie for wallet connection
      Cookies.set("wallet_connected", "true", { expires: 7 });

      return { provider, signer, contract, address, registered };
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAccount("");
    setIsRegistered(false);
    Cookies.remove("wallet_connected");
  };

  const createPost = async (content: string) => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      setLoading(true);
      const tx = await contract.createPost(content);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const editPost = async (postId: string, content: string) => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      setLoading(true);
      const tx = await contract.editPost(postId, content);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error("Error editing post:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };


  const getAllPosts = async () => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      const posts = await contract.getAllPosts();
      return posts;
    } catch (error) {
      console.error("Error getting posts:", error);
      throw error;
    }
  };

  const registerUser = async (name: string) => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      setLoading(true);
      const tx = await contract.registerUser(name);
      await tx.wait();
      setIsRegistered(true);
      return tx;
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isUsernameAvailable = async (username: string): Promise<boolean> => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      const [usersCount] = await contract.getPlatformStats();
      const allPosts = await contract.getAllPosts();
      const authors = allPosts[1]; // Get all author addresses

      // Check each registered user's username
      for (let i = 0; i < authors.length; i++) {
        const isRegistered = await contract.isUserRegistered(authors[i]);
        if (isRegistered) {
          const userInfo = await contract.getUserInfo(authors[i]);
          if (userInfo.username.toLowerCase() === username.toLowerCase()) {
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      console.error("Error checking username availability:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Check for existing wallet connection
    const checkConnection = async () => {
      if (
        typeof window.ethereum !== "undefined" &&
        Cookies.get("wallet_connected")
      ) {
        try {
          await connectWallet();
        } catch (error) {
          console.error("Error reconnecting wallet:", error);
          disconnectWallet();
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", async (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          await connectWallet();
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }

    return () => {
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  return {
    provider,
    signer,
    contract,
    account,
    isRegistered,
    loading,
    connectWallet,
    disconnectWallet,
    createPost,
    editPost,
    getAllPosts,
    registerUser,
    isUsernameAvailable
  };
}
