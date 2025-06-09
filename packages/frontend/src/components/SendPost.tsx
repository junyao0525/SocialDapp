"use client"

import { useWeb3 } from "@/hooks/useWeb3";
import Image from "next/image";
import { useRef, useState } from "react";

interface SendPostProps {
  onPostCreated?: () => void;
}

export default function SendPost({ onPostCreated }: SendPostProps) {
  const { createPost } = useWeb3()
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setError("")

      // Create preview URL for images
      if (selectedFile.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(selectedFile)
        setPreview(previewUrl)
      } else {
        setPreview("")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !file) {
      setError("Please add some text or an image to your post")
      return
    }

    try {
      setUploading(true)
      setError("")

      let mediaHash = ""
      let mediaType = ""

      // Upload file if present
      if (file) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to upload file")
        }

        const data = await response.json()
        // Extract just the IPFS hash from the URL
        const ipfsHash = data.url.split('/ipfs/')[1]
        mediaHash = ipfsHash
        mediaType = file.type
      }

      // Create post with content and media
      await createPost(
        content.trim() || "Shared an image", // Use default text if no content
        mediaHash || "", // Empty string if no file
        mediaType || ""  // Empty string if no file
      )

      // Reset form
      setContent("")
      setFile(null)
      setPreview("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      
      // Call onPostCreated callback if provided
      onPostCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post")
      console.error("Error creating post:", err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200 p-6 mb-6 w-full max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black bg-white min-h-[120px]"
          />
        </div>

        <div className="mb-4">
          <label className="block">
            <span className="sr-only">Choose file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-gradient-to-r file:from-blue-500 file:to-indigo-600
                file:text-white
                hover:file:from-blue-600 hover:file:to-indigo-700
                cursor-pointer"
            />
          </label>
        </div>

        {preview && (
          <div className="mb-4 relative w-full h-64">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain rounded-lg"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={(!content.trim() && !file) || uploading}
          className={`w-full py-3 px-4 rounded-xl text-white font-medium transition-all duration-200 transform hover:-translate-y-0.5
            ${(!content.trim() && !file) || uploading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg"}`}
        >
          {uploading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Posting...
            </div>
          ) : (
            'Post'
          )}
        </button>
      </form>
    </div>
  )
} 