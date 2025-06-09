"use client"

import { useWeb3 } from "@/hooks/useWeb3"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function LoginPage() {
  const { connectWallet, account, loading, isRegistered, registerUser, isUsernameAvailable } = useWeb3()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [showRegistration, setShowRegistration] = useState(false)
  const [usernameError, setUsernameError] = useState("")

  useEffect(() => {
    if (account && isRegistered) {
      router.push("/")
    } else if (account && !isRegistered) {
      setShowRegistration(true)
    }
  }, [account, isRegistered, router])

  const handleConnect = async () => {
    try {
      await connectWallet()
    } catch (error) {
      console.error("Error connecting wallet:", error)
      alert(error instanceof Error ? error.message : "Failed to connect wallet")
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    try {
      setUsernameError("")
      const isAvailable = await isUsernameAvailable(username)
      
      if (!isAvailable) {
        setUsernameError("This username is already taken")
        return
      }

      await registerUser(username)
      router.push("/")
    } catch (error) {
      console.error("Error registering user:", error)
      alert(error instanceof Error ? error.message : "Failed to register user")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8 text-blue-600">Welcome to SocialChain</h1>
        
        {!showRegistration ? (
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
              Don&apos;t have a wallet?{" "}
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
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setUsernameError("")
                }}
                placeholder="Enter your username"
                className={`w-full px-4 py-2 border ${usernameError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black`}
                required
              />
              {usernameError && (
                <p className="text-red-500 text-sm mt-1">{usernameError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Username"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
} 