"use client"

import { useWeb3 } from "@/hooks/useWeb3"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LoginPage() {
  const { connectWallet, account, loading } = useWeb3()
  const router = useRouter()

  useEffect(() => {
    if (account) {
      router.push("/")
    }
  }, [account, router])

  const handleConnect = async () => {
    try {
      await connectWallet()
    } catch (error) {
      console.error("Error connecting wallet:", error)
      alert(error instanceof Error ? error.message : "Failed to connect wallet")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8 text-blue-600">Welcome to SocialChain</h1>
        
        <div className="space-y-4">
          <p className="text-gray-600 text-center mb-6">
            Connect your wallet to start sharing your thoughts on the blockchain
          </p>
          
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Connect Wallet</span>
              </>
            )}
          </button>

          <p className="text-sm text-gray-500 text-center mt-4">
            Don't have a wallet?{" "}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
            >
              Install MetaMask
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 