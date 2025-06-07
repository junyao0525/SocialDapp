"use client"

import { Web3Provider } from "@/providers/Web3Provider"

export default function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return <Web3Provider>{children}</Web3Provider>
} 