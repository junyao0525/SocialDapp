"use client"

import { useWeb3 } from "@/hooks/useWeb3"
import Link from "next/link"
import { useEffect, useState } from "react"

function Header() {
  const { account, contract, isRegistered } = useWeb3()
  const [username, setUsername] = useState<string>("")

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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <header className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          SocialChain
        </Link>
        <div className="flex items-center space-x-4">
          {account ? (
            <div className="flex items-center space-x-4">
              <Link
                href="/withdraw-tips"
                className="text-sm text-gray-200 hover:text-white transition-colors"
              >
                Withdraw
              </Link>
              <span className="text-sm bg-blue-700 px-3 py-1 rounded-full">
                {isRegistered ? `${username} (${formatAddress(account)})` : formatAddress(account)}
              </span>
             
              {!isRegistered && (
                <Link
                  href="/login"
                  className="text-sm text-blue-200 hover:text-white transition-colors"
                >
                  Complete Registration
                </Link>
              )}
             
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
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
