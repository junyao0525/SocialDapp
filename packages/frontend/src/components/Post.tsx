"use client"

import { useWeb3 } from "@/hooks/useWeb3"
import Image from "next/image"
import { useEffect, useState } from "react"
import { TipModal } from "./TipModal"

interface PostProps {
  id: string
  author: string
  content: string
  timestamp: string
  isOwner: boolean
  onPostEdited: () => void
  mediaHash?: string
  mediaType?: string
}

export default function Post({ id, author, content, timestamp, isOwner, onPostEdited, mediaHash, mediaType }: PostProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  const [loading, setLoading] = useState(false)
  const [isTipModalOpen, setIsTipModalOpen] = useState(false)
  const [isEdited, setIsEdited] = useState(false)
  const { editPost } = useWeb3()

  // Load edited status from localStorage on component mount
  useEffect(() => {
    const editedPosts = JSON.parse(localStorage.getItem('editedPosts') || '{}')
    setIsEdited(editedPosts[id] || false)
  }, [id])

  const handleEdit = async () => {
    if (!editContent.trim()) return

    try {
      setLoading(true)
      const tx = await editPost(id, editContent)
      await tx.wait()
      setIsEditing(false)
      setIsEdited(true)
      
      // Save edited status to localStorage
      const editedPosts = JSON.parse(localStorage.getItem('editedPosts') || '{}')
      editedPosts[id] = true
      localStorage.setItem('editedPosts', JSON.stringify(editedPosts))
      
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

  const getMediaUrl = () => {
    if (!mediaHash) return null;
    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.pinata.cloud';
    return `${gatewayUrl}/ipfs/${mediaHash}`;
  };

  const renderMedia = () => {
    const mediaUrl = getMediaUrl();
    if (!mediaUrl) return null;

    if (mediaType?.startsWith('image/')) {
      return (
        <div className="mt-4 relative w-full h-64">
          <Image
            src={mediaUrl}
            alt="Post media"
            fill
            className="object-contain rounded-lg"
          />
        </div>
      );
    }

    return (
      <div className="mt-4">
        <a 
          href={mediaUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          View Media
        </a>
      </div>
    );
  };

  return (
    <>
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200 p-6 mb-4 w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
              {isOwner ? "👤" : author.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center">
                {isOwner ? "You" : author}
                {isOwner && (
                  <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs rounded-full">
                    Creator
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-500 flex items-center space-x-2">
                <span>{timestamp}</span>
                {isEdited && (
                  <span className="text-xs text-gray-400 italic">(edited)</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isOwner && (
              <button
                onClick={() => setIsTipModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span>Tip</span>
                </div>
              </button>
            )}
            {isOwner && !isEditing && (
              <button 
                className="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                onClick={() => setIsEditing(true)}
                disabled={loading}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="space-y-4">
            <textarea
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black bg-white"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={loading}
              rows={4}
            />
            {mediaHash && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                <p className="text-sm">
                  Note: Media cannot be edited. Only the text content can be modified.
                </p>
              </div>
            )}
            <div className="flex space-x-3">
              <button
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                onClick={handleEdit}
                disabled={loading || !editContent.trim()}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                onClick={cancelEdit}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
            {renderMedia()}
          </div>
        )}
      </div>

      {/* Tip Modal */}
      <TipModal
        postId={id}
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        onTipSuccess={onPostEdited}
      />
    </>
  )
} 