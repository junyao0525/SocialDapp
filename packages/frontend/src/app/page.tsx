"use client"

import Header from "@/components/Header"
import Post from "@/components/Post"
import SendPost from "@/components/SendPost"
import { useWeb3 } from "@/hooks/useWeb3"
import { BigNumberish } from "ethers"
import { useEffect, useState } from "react"

interface PostData {
  id: string
  author: string
  content: string
  timestamp: string
  isOwner: boolean
  mediaHash?: string
  mediaType?: string
}

function Page() {
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const { getAllPosts, account, contract,isRegistered:isUser } = useWeb3()
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 10

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }


  const loadPosts = async () => {
    if (!contract) {
      setLoading(false)
    }

    try {
      setLoading(true)
      const [ids, authors, contents, mediaHashes, mediaTypes, timestamps] = await getAllPosts()
      
      if (!contract) return

      // Fetch usernames for all authors
      const usernames = await Promise.all(
        authors.map(async (address: string) => {
          try {
            const isRegistered = await contract.isUserRegistered(address)
            if (isRegistered) {
              const userInfo = await contract.getUserInfo(address)
              return userInfo.username
            }
            return formatAddress(address)
          } catch (err) {
            console.error("Error fetching username for address:", address, err)
            return formatAddress(address)
          }
        })
      )

      const formattedPosts = ids.map((id: BigNumberish, index: number) => ({
        id: id.toString(),
        author: usernames[index],
        content: contents[index],
        timestamp: new Date(Number(timestamps[index]) * 1000).toLocaleString(),
        isOwner: authors[index].toLowerCase() === account?.toLowerCase(),
        mediaHash: mediaHashes[index] || undefined,
        mediaType: mediaTypes[index] || undefined
      }))

      setPosts(formattedPosts)
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (account && contract) {
      loadPosts()
    }
  }, [account, contract])

  // Calculate pagination
  const indexOfLastPost = currentPage * postsPerPage
  const indexOfFirstPost = indexOfLastPost - postsPerPage
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost)
  const totalPages = Math.ceil(posts.length / postsPerPage)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Header />
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-full max-w-2xl p-4">
          <div className="mb-4">
          </div>
          {isUser ? <SendPost onPostCreated={loadPosts} /> : 
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 w-full max-w-2xl">
              <p className="text-center text-gray-600">Please connect your wallet to create posts</p>
          </div>
          </>
        }
        
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No posts yet. Be the first to post!</p>
            </div>
          ) : (
            <>
              {currentPosts.map((post) => (
                <Post
                  key={`post-${post.id}`}
                  id={post.id}
                  author={post.author}
                  content={post.content}
                  timestamp={post.timestamp}
                  isOwner={post.isOwner}
                  onPostEdited={loadPosts}
                  mediaHash={post.mediaHash}
                  mediaType={post.mediaType}
                />
              ))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2 mt-6 mb-4">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-3 py-1 rounded ${
                        currentPage === index + 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Page