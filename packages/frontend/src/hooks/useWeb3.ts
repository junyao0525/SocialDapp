import SocialDApp from '@/contracts/socialMedia.json'
import { ethers } from 'ethers'
import Cookies from 'js-cookie'
import { useEffect, useState } from 'react'

const CONTRACT_ADDRESS = "0x9b4D2c892A73C31bac871d935Cf4c9d0295432F9"

export function useWeb3() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [account, setAccount] = useState("")
  const [isRegistered, setIsRegistered] = useState(false)
  const [loading, setLoading] = useState(false)

  const connectWallet = async () => {
    try {
      setLoading(true)
      if (typeof window.ethereum === "undefined") {
        throw new Error("Please install MetaMask")
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        SocialDApp.abi,
        signer
      )

      setProvider(provider)
      setSigner(signer)
      setContract(contract)
      setAccount(address)

      // Check if user is registered
      const registered = await contract.isUserRegistered(address)
      setIsRegistered(registered)

      // Set cookie for wallet connection
      Cookies.set('wallet_connected', 'true', { expires: 7 })

      return { provider, signer, contract, address, registered }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const disconnectWallet = () => {
    setProvider(null)
    setSigner(null)
    setContract(null)
    setAccount("")
    setIsRegistered(false)
    Cookies.remove('wallet_connected')
  }

  const createPost = async (content: string) => {
    if (!contract) throw new Error("Contract not initialized")
    
    try {
      setLoading(true)
      const tx = await contract.createPost(content)
      await tx.wait()
      return tx
    } catch (error) {
      console.error("Error creating post:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const editPost = async (postId: string, content: string) => {
    if (!contract) throw new Error("Contract not initialized")
    
    try {
      setLoading(true)
      const tx = await contract.editPost(postId, content)
      await tx.wait()
      return tx
    } catch (error) {
      console.error("Error editing post:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async (postId: string) => {
    if (!contract) throw new Error("Contract not initialized")
    
    try {
      setLoading(true)
      const tx = await contract.deletePost(postId)
      await tx.wait()
      return tx
    } catch (error) {
      console.error("Error deleting post:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getAllPosts = async () => {
    if (!contract) throw new Error("Contract not initialized")
    
    try {
      const posts = await contract.getAllPosts()
      return posts
    } catch (error) {
      console.error("Error getting posts:", error)
      throw error
    }
  }

  useEffect(() => {
    // Check for existing wallet connection
    const checkConnection = async () => {
      if (typeof window.ethereum !== "undefined" && Cookies.get('wallet_connected')) {
        try {
          await connectWallet()
        } catch (error) {
          console.error("Error reconnecting wallet:", error)
          disconnectWallet()
        }
      }
    }

    checkConnection()

    // Listen for account changes
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", async (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          await connectWallet()
        }
      })

      window.ethereum.on("chainChanged", () => {
        window.location.reload()
      })
    }

    return () => {
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeAllListeners()
      }
    }
  }, [])

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
    deletePost,
    getAllPosts
  }
} 