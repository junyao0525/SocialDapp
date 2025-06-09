"use client"

import { useWeb3 } from "@/hooks/useWeb3"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

function Header() {
  const { account, contract, isRegistered, disconnectWallet } = useWeb3()
  const [username, setUsername] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    const loadUsername = async () => {
      if (contract && account && isRegistered) {
        try {
          const userInfo = await contract.getUserInfo(account)
          setUsername(userInfo.username)
        } catch (error) {
          console.error("Error loading username:", error)
        }
      }
    }

    loadUsername()
  }, [contract, account, isRegistered])

  const handleDisconnect = () => {
    disconnectWallet()
    router.refresh()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold hover:text-blue-100 transition-colors">
          SocialChain
        </Link>
        <div className="flex items-center space-x-4">
          {account ? (
            <div className="flex items-center space-x-4">
              <Link
                href="/withdraw-tips"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all duration-200"
              >
                Withdraw Tips
              </Link>
              <div className="flex items-center space-x-2">
                <div className="bg-white/10 px-4 py-2 rounded-lg flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {isRegistered ? username : "Unregistered"}
                  </span>
                  <span className="text-sm text-blue-200">
                    {formatAddress(account)}
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Disconnect Wallet"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
              {!isRegistered && (
                <Link
                  href="/login"
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium"
                >
                  Complete Registration
                </Link>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              Connect Wallet
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
