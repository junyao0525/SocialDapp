"use client"

import { useWeb3 } from "@/hooks/useWeb3"
import { useState } from "react"
import { TipPost } from "./TipPost"

interface PostProps {
  id: string
  author: string
  content: string
  timestamp: string
  isOwner: boolean
  onPostEdited: () => void
}

export default function Post({ id, author, content, timestamp, isOwner, onPostEdited }: PostProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [loading, setLoading] = useState(false)
  const { editPost } = useWeb3()

  const handleEdit = async () => {
    if (!editContent.trim()) return

    try {
      setLoading(true)
      const tx = await editPost(id, editContent)
      await tx.wait()
      setIsEditing(false)
      onPostEdited()
    } catch (error) {
      console.error("Error editing post:", error)
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditContent(content)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 w-full max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            {isOwner ? "👤" : author.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">
              {isOwner ? "You" : author}
              {isOwner && " 🔥"}
            </h3>
            <p className="text-sm text-gray-500">{timestamp}</p>
          </div>
        </div>
        {isOwner && !isEditing && (
          <button 
            className="text-blue-600 hover:text-blue-800"
            onClick={() => setIsEditing(true)}
            disabled={loading}
          >
            Edit
          </button>
        )}
      </div>
      {isEditing ? (
        <div>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black mb-4"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={loading}
          />
          <div className="flex space-x-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              onClick={handleEdit}
              disabled={loading || !editContent.trim()}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              onClick={cancelEdit}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-gray-700 mb-4">{content}</p>
          {isOwner ? "" :
            <>
              <hr className="border-t border-gray-300 my-4" />
              <div className="mt-4">
                <TipPost postId={id} onTipSuccess={onPostEdited} />
              </div>
            </>}
        </>
      )}
    </div>
  )
} 