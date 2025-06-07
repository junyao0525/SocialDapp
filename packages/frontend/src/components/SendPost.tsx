"use client"

import { useWeb3 } from "@/hooks/useWeb3"
import { useState } from "react"

interface SendPostProps {
  onPostCreated?: () => void
}

function SendPost({ onPostCreated }: SendPostProps) {
  const [content, setContent] = useState("")
  const { createPost, loading, account } = useWeb3()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      await createPost(content)
      setContent("")
      onPostCreated?.()
    } catch (error) {
      console.error("Error posting:", error)
      alert(error instanceof Error ? error.message : "Failed to create post")
    }
  }

  if (!account) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 w-full max-w-2xl">
        <p className="text-center text-gray-600">Please connect your wallet to create posts</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 w-full max-w-2xl">
      <h2 className="text-xl font-semibold mb-4 text-black">Create Post</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black"
          rows={4}
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
        />
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">
            {content.length}/1000 characters
          </span>
          <button
            type="submit"
            disabled={!content.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SendPost 