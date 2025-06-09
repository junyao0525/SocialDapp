"use client"

import { useWeb3 } from "@/hooks/useWeb3"
import { ethers } from "ethers"
import { createContext, ReactNode, useContext } from "react"

interface Web3ContextType {
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  contract: ethers.Contract | null
  account: string
  isRegistered: boolean
  loading: boolean
  connectWallet: () => Promise<{
    provider: ethers.BrowserProvider
    signer: ethers.JsonRpcSigner
    contract: ethers.Contract
    address: string
    registered: boolean
  }>
  createPost: (content: string) => Promise<ethers.ContractTransactionResponse>
  editPost: (postId: string, content: string) => Promise<ethers.ContractTransactionResponse>
  getAllPosts: () => Promise<[ethers.BigNumberish[], string[], string[], ethers.BigNumberish[]]>
}

const Web3Context = createContext<Web3ContextType | null>(null)

export function Web3Provider({ children }: { children: ReactNode }) {
  const web3 = useWeb3()

  return (
    <Web3Context.Provider value={web3}>
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3Context() {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error("useWeb3Context must be used within a Web3Provider")
  }
  return context
} 