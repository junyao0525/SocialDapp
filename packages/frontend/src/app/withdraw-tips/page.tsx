"use client"

import Header from "@/components/Header"
import { WithdrawTips } from "@/components/WithdrawTips"



function Withdraw() {
  return (
    <>
    <Header/>
    <div className="flex justify-center items-center min-h-screen">
    <div className="w-full max-w-2xl  items-center">
      <WithdrawTips/>
    </div>
    </div>
   </>
  )
}
export default Withdraw