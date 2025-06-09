import SocialDApp from "@/contracts/socialMedia.json";
import { ethers } from "ethers";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

// Contract address - using environment variable with fallback
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";

// Log the contract address being used (for debugging)
console.log('Using contract address:', CONTRACT_ADDRESS);

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
  tipPost: (postId: string, amount: string) => Promise<ethers.ContractTransactionResponse>;
  withdrawTips: () => Promise<ethers.ContractTransactionResponse>;
  getPostTips: (postId: string) => Promise<bigint>;
  getUserTips: () => Promise<bigint>;
  getAvailableTips: () => Promise<{ total: string; withdrawn: string; available: string }>;
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
    if (!account) throw new Error("Pls Register as user first");

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
      // const [usersCount] = await contract.getPlatformStats();
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

  const tipPost = async (postId: string, amount: string) => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      setLoading(true);
      const amountInWei = ethers.parseEther(amount);
      const tx = await contract.giveTipping(postId, { value: amountInWei });
      await tx.wait();
      return tx;
    } catch (error) {
      console.error("Error tipping post:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAvailableTips = async () => {
    if (!contract) throw new Error("Contract not initialized");
    if (!account) throw new Error("No account connected");
    if (!isRegistered) throw new Error("Please register a username first");

    try {
      const [totalTipping, withdrawnTipping, availableTipping] = await contract.getUserTipping(account);
      return {
        total: ethers.formatEther(totalTipping),
        withdrawn: ethers.formatEther(withdrawnTipping),
        available: ethers.formatEther(availableTipping)
      };
    } catch (error) {
      console.error("Error getting available tips:", error);
      throw error;
    }
  };

  const withdrawTips = async () => {
    if (!contract) throw new Error("Contract not initialized");
    if (!account) throw new Error("No account connected");
    if (!isRegistered) throw new Error("Please register a username first");

    try {
      setLoading(true);
      // Check available tips before withdrawing
      const [totalTipping, withdrawnTipping, availableTipping] = await contract.getUserTipping(account);
      console.log("Tips info:", {
        total: ethers.formatEther(totalTipping),
        withdrawn: ethers.formatEther(withdrawnTipping),
        available: ethers.formatEther(availableTipping)
      });

      if (availableTipping.toString() === "0") {
        throw new Error("No tips available to withdraw");
      }

      const tx = await contract.withdrawTipping();
      console.log("Withdrawal transaction:", tx.hash);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error("Error withdrawing tips:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to withdraw tips: ${error.message}`);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getPostTips = async (postId: string): Promise<bigint> => {
    if (!contract) {
      console.error("Contract not initialized. Please connect your wallet first.");
      throw new Error("Please connect your wallet first");
    }
    if (!account) {
      console.error("No account connected");
      throw new Error("Please connect your wallet first");
    }

    try {
      console.log("Getting tips for post:", postId);
      console.log("Contract address:", contract.target);
      console.log("Account:", account);
      
      const [totalTipping] = await contract.getPostTipping(postId);
      console.log("Post tips:", totalTipping.toString());
      return totalTipping;
    } catch (error) {
      console.error("Error getting post tips:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to get post tips: ${error.message}`);
      }
      throw error;
    }
  };

  const getUserTips = async (): Promise<bigint> => {
    if (!contract) throw new Error("Contract not initialized");
    if (!account) throw new Error("No account connected");
  
    try {
      console.log("Contract:", contract.target); // Log contract address
      console.log("Account:", account); // Log current account
      console.log("Network:", await provider?.getNetwork()); // Log network
      
      const [totalTipping] = await contract.getUserTipping(account);
      return totalTipping;
    } catch (error) {
      console.error("Error getting user tips:", error);
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
          try {
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
          } catch (error) {
            console.error("Error handling account change:", error);
            disconnectWallet();
          }
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
    isUsernameAvailable,
    tipPost,
    withdrawTips,
    getPostTips,
    getUserTips,
    getAvailableTips
  };
}

