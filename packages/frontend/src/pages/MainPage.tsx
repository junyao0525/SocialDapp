import React, { useEffect, useState } from 'react';
import { TipPost } from '../components/TipPost';
import { WithdrawTips } from '../components/WithdrawTips';
import { useWeb3 } from '../hooks/useWeb3';

interface Post {
  id: bigint;
  content: string;
  author: string;
  timestamp: bigint;
}

export const MainPage: React.FC = () => {
  const { contract, account, disconnectWallet, createPost, editPost, getAllPosts } = useWeb3();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    if (!contract) return;

    try {
      const [ids, contents, authors, timestamps] = await getAllPosts();
      const formattedPosts = ids.map((id, index) => ({
        id: BigInt(id),
        content: contents[index],
        author: authors[index],
        timestamp: BigInt(timestamps[index])
      }));
      setPosts(formattedPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to fetch posts');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [contract]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const tx = await createPost(newPost);
      await tx.wait();
      setNewPost('');
      await fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPost = async (postId: string) => {
    const newContent = prompt('Enter new content:');
    if (!newContent) return;

    try {
      setLoading(true);
      setError(null);
      const tx = await editPost(postId, newContent);
      await tx.wait();
      await fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Social Media DApp</h1>
            </div>
            <div className="flex items-center space-x-4">
              <WithdrawTips />
              <button
                onClick={disconnectWallet}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Create Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Posts</h2>
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id.toString()} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-gray-600">Post ID: {post.id.toString()}</p>
                      <p className="text-gray-600">Author: {post.author}</p>
                    </div>
                    {post.author === account && (
                      <button
                        onClick={() => handleEditPost(post.id.toString())}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <p className="text-lg mb-4">{post.content}</p>
                  <TipPost postId={post.id.toString()} onTipSuccess={fetchPosts} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}; 