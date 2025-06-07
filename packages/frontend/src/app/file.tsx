"use client"
import SocialDApp from "@/contracts/socialMedia.json";
import getEthers from "@/utils/getEther";
import { BigNumberish, BrowserProvider, Contract, JsonRpcSigner } from "ethers";
import { useEffect, useState } from "react";
import "./App.css";

interface UserInfo {
  username: string;
  postCount: number;
}

interface Post {
  id: string;
  author: string;
  authorAddress: string;
  content: string;
  timestamp: string;
  isOwner: boolean;
}

function App() {
  // State management
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [account, setAccount] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({ username: "", postCount: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ usersCount: 0, postsCount: 0 });
  
  // Form states
  const [username, setUsername] = useState("");
  const [newPost, setNewPost] = useState("");
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);

  // Contract address - Replace with your deployed contract address
  const CONTRACT_ADDRESS = "0x9b4D2c892A73C31bac871d935Cf4c9d0295432F9";

  // Initialize contract and load data
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        console.log("Initializing contract...");
        
        const provider = await getEthers();
        const signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();

        console.log("Connected account:", signerAddress);

        console.log(provider)

        const abi = SocialDApp.abi;
        const contractInstance = new Contract(CONTRACT_ADDRESS, abi, signer);

        setProvider(provider);
        setSigner(signer);
        setContract(contractInstance);
        setAccount(signerAddress);

        // Check if user is registered
        console.log("Checking if user is registered...");
        const registered = await contractInstance.isUserRegistered(signerAddress);
        console.log("User registered:", registered);
        setIsRegistered(registered);

        if (registered) {
          console.log("Loading user info...");
          const userInfo = await contractInstance.getUserInfo(signerAddress) as UserInfo;
          console.log("User info:", userInfo);
          setUserInfo(userInfo);
        }

        // Load posts and stats
        await loadPosts(contractInstance);
        await loadStats(contractInstance);

      } catch (err: unknown) {
        console.error("Error during contract init:", err);
        if (err instanceof Error) {
          alert(`Failed to connect to the contract: ${err.message}`);
        } else {
          alert('Failed to connect to the contract: Unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    init();

    // Add MetaMask event listeners
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = async (accounts: string[]) => {
        console.log("Account changed:", accounts);
        if (accounts.length === 0) {
          // User disconnected their wallet
          setAccount("");
          setProvider(null);
          setSigner(null);
          setContract(null);
          setIsRegistered(false);
          setUserInfo({ username: "", postCount: 0 });
          setPosts([]);
          setStats({ usersCount: 0, postsCount: 0 });
        } else {
          // User switched accounts
          await reconnectWallet();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      // Cleanup listeners
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => {
          window.location.reload();
        });
      };
    }
  }, []);

  // Load all posts
  const loadPosts = async (contractInstance = contract) => {
    if (!contractInstance) {
      console.log("Contract not available for loading posts");
      return;
    }
    
    try {
      setPostsLoading(true);
      console.log("Loading all posts...");
      
      const result = await contractInstance.getAllPosts();
      console.log("Raw posts result:", result);
      
      if (!result || result.length < 4) {
        console.error("Invalid posts result structure:", result);
        setPosts([]);
        return;
      }
      
      // Fetch usernames for all authors
      const authorAddresses = result[1];
      const usernames = await Promise.all(
        authorAddresses.map(async (address: string) => {
          try {
            const isRegistered = await contractInstance.isUserRegistered(address);
            if (isRegistered) {
              const userInfo = await contractInstance.getUserInfo(address) as UserInfo;
              return userInfo.username;
            }
            return formatAddress(address);
          } catch (err) {
            console.error("Error fetching username for address:", address, err);
            return formatAddress(address);
          }
        })
      );
      
      const formattedPosts: Post[] = result[0].map((id: BigNumberish, index: number) => ({
        id: id.toString(),
        author: usernames[index],
        authorAddress: result[1][index],
        content: result[2][index],
        timestamp: new Date(Number(result[3][index]) * 1000).toLocaleString(),
        isOwner: result[1][index].toLowerCase() === account.toLowerCase()
      }));
      
      console.log("Formatted posts:", formattedPosts);
      setPosts(formattedPosts);
    } catch (err: unknown) {
      console.error("Error loading posts:", err);
      if (err instanceof Error) {
        alert(`Failed to load posts: ${err.message}`);
      } else {
        alert('Failed to load posts: Unknown error occurred');
      }
    } finally {
      setPostsLoading(false);
    }
  };

  // Load platform statistics
  const loadStats = async (contractInstance = contract) => {
    if (!contractInstance) {
      console.log("Contract not available for loading stats");
      return;
    }
    
    try {
      console.log("Loading platform stats...");
      const platformStats = await contractInstance.getPlatformStats();
      console.log("Raw platform stats:", platformStats);
      
      if (!platformStats || platformStats.length < 2) {
        console.error("Invalid stats result structure:", platformStats);
        return;
      }
      
      const newStats = {
        usersCount: platformStats[0].toString(),
        postsCount: platformStats[1].toString()
      };
      
      console.log("New stats:", newStats);
      setStats(newStats);
    } catch (err: unknown) {
      console.error("Error loading stats:", err);
      if (err instanceof Error) {
        alert(`Failed to load stats: ${err.message}`);
      } else {
        alert('Failed to load stats: Unknown error occurred');
      }
    }
  };

  // Register user
  const registerUser = async () => {
    if (!contract || !signer) {
      alert("Contract or signer not ready.");
      return;
    }
    
    if (!username.trim()) {
      alert("Username cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      console.log("Registering user:", username);

      // Estimate gas first
      const estimatedGas = await contract.registerUser.estimateGas(username);
      console.log("Estimated gas:", estimatedGas.toString());

      const tx = await contract.registerUser(username, { 
        gasLimit: Math.floor(Number(estimatedGas) * 1.2) // Add 20% buffer
      });
      
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      // Update states
      setIsRegistered(true);
      setUserInfo({ username, postCount: 0 });
      setUsername(""); // Clear form
      
      // Reload data
      await loadStats();
      
      alert("User registered successfully!");
    } catch (err: unknown) {
      console.error("Error registering user:", err);
      if (err instanceof Error) {
        alert(`Failed to register user: ${err.message}`);
      } else {
        alert('Failed to register user: Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create new post
  const createPost = async () => {
    if (!contract || !signer) {
      alert("Contract or signer not ready.");
      return;
    }
    
    if (!newPost.trim()) {
      alert("Post content cannot be empty.");
      return;
    }
    
    if (newPost.length > 1000) {
      alert("Post content too long (max 1000 characters).");
      return;
    }

    try {
      setLoading(true);
      console.log("Creating post:", newPost);

      // Estimate gas first
      const estimatedGas = await contract.createPost.estimateGas(newPost);
      console.log("Estimated gas:", estimatedGas.toString());

      const tx = await contract.createPost(newPost, { 
        gasLimit: Math.floor(Number(estimatedGas) * 1.2) // Add 20% buffer
      });
      
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      // Clear form and reload data
      setNewPost("");
      await Promise.all([
        loadPosts(),
        loadStats()
      ]);
      
      // Update user info post count
      if (isRegistered) {
        const updatedUserInfo = await contract.getUserInfo(account) as UserInfo;
        setUserInfo({
          username: updatedUserInfo.username,
          postCount: updatedUserInfo.postCount
        });
      }
      
      alert("Post created successfully!");
    } catch (err: unknown) {
      console.error("Error creating post:", err);
      if (err instanceof Error) {
        alert(`Failed to create post: ${err.message}`);
      } else {
        alert('Failed to create post: Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Edit post
  const editPost = async (postId) => {
    if (!contract) {
      alert("Contract not ready.");
      return;
    }
    
    if (!editContent.trim()) {
      alert("Post content cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      console.log("Editing post:", postId, editContent);

      // Estimate gas first
      const estimatedGas = await contract.editPost.estimateGas(postId, editContent);
      console.log("Estimated gas:", estimatedGas.toString());

      const tx = await contract.editPost(postId, editContent, { 
        gasLimit: Math.floor(Number(estimatedGas) * 1.2) // Add 20% buffer
      });
      
      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      // Clear editing state and reload posts
      setEditingPost(null);
      setEditContent("");
      await loadPosts();
      
      alert("Post updated successfully!");
    } catch (err: unknown) {
      console.error("Error editing post:", err);
      if (err instanceof Error) {
        alert(`Failed to edit post: ${err.message}`);
      } else {
        alert('Failed to edit post: Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Start editing a post
  const startEdit = (post) => {
    setEditingPost(post.id);
    setEditContent(post.content);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingPost(null);
    setEditContent("");
  };

  // Format address for display
  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Reconnect wallet with better error handling
  const reconnectWallet = async () => {
    try {
      setLoading(true);
      console.log("Reconnecting wallet...");
      
      if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed.");
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts",
        params: [] 
      });

      if (accounts.length === 0) {
        alert("No account found. Please connect to MetaMask.");
        return;
      }

      const newAddress = accounts[0];
      console.log("New account address:", newAddress);

      const provider = await getEthers();
      const signer = await provider.getSigner();
      const currentAddress = await signer.getAddress();
      
      if (currentAddress.toLowerCase() !== newAddress.toLowerCase()) {
        console.log("Address mismatch, reloading page...");
        window.location.reload();
        return;
      }

      console.log("Reconnected to account:", currentAddress);
      
      const abi = SocialDApp.abi;
      const contractInstance = new Contract(CONTRACT_ADDRESS, abi, signer);

      setProvider(provider);
      setSigner(signer);
      setContract(contractInstance);
      setAccount(currentAddress);

      // Check if user is registered
      const registered = await contractInstance.isUserRegistered(currentAddress);
      setIsRegistered(registered);

      if (registered) {
        const userInfo = await contractInstance.getUserInfo(currentAddress) as UserInfo;
        setUserInfo(userInfo);
      } else {
        setUserInfo({ username: "", postCount: 0 });
      }

      await Promise.all([
        loadPosts(contractInstance),
        loadStats(contractInstance)
      ]);
      
      alert("Wallet reconnected successfully.");
    } catch (err: unknown) {
      console.error("Error reconnecting wallet:", err);
      if (err instanceof Error) {
        alert(`Failed to reconnect wallet: ${err.message}`);
      } else {
        alert('Failed to reconnect wallet: Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };



  if (loading && !contract) {
    return (
      <div className="app-container">
        <div className="container">
          <div className="loading-container">
            <div className="modern-spinner"></div>
            <h2 style={{ color: 'white', marginTop: '2rem', fontSize: '1.5rem' }}>
              🚀 Connecting to SocialChain...
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '1rem' }}>
              Preparing your decentralized social experience
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="container">
        {/* Header */}
        <div className="app-header fade-in-up">
          <h1 className="app-title">SocialChain</h1>
          <p className="app-subtitle">Decentralized Social Media on Blockchain</p>
          <div className="stats-container">
            <div className="stat-badge">
              🙋‍♀️ {stats.usersCount} Users
            </div>
            <div className="stat-badge">
              📝 {stats.postsCount} Posts
            </div>
          </div>
          <div className="connected-address">
            🔗 {formatAddress(account)}
          </div>
          <button
            className="btn-modern btn-outline-modern btn-small"
            onClick={reconnectWallet}
            style={{ marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? "🔄 Connecting..." : "🔄 Reconnect Wallet"}
          </button>
        </div>

        {/* User Registration */}
        {!isRegistered ? (
          <div className="modern-card fade-in-up">
            <div className="card-header-modern">
              <h3>🚀 Join the Community</h3>
            </div>
            <div className="card-body-modern">
              <p style={{ marginBottom: '1.5rem', color: '#666' }}>
                Create your username to start sharing your thoughts on the blockchain!
              </p>
              <input
                type="text"
                className="modern-input"
                placeholder="Choose your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
              <button 
                className="btn-modern btn-primary-modern" 
                onClick={registerUser}
                disabled={loading || !contract || !username.trim()}
                style={{ width: '100%' }}
              >
                {loading ? "🔄 Registering..." : "✨ Join Now"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* User Info */}
            <div className="modern-card welcome-section fade-in-up">
              <h5>🎉 Welcome back, {userInfo.username}!</h5>
              <p>You've shared your thoughts {userInfo.postCount} times</p>
            </div>

            {/* Create Post */}
            <div className="modern-card fade-in-up">
              <div className="card-header-modern">
                <h3>💭 Share Your Thoughts</h3>
              </div>
              <div className="card-body-modern">
                <textarea
                  className="modern-textarea"
                  placeholder="What's inspiring you today? Share it with the world..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  disabled={loading}
                />
                <div className={`char-counter ${newPost.length > 800 ? 'warning' : ''}`}>
                  {newPost.length}/1000 characters
                </div>
                <button 
                  className="btn-modern btn-success-modern" 
                  onClick={createPost}
                  disabled={loading || !contract || !newPost.trim()}
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  {loading ? "📤 Publishing..." : "🚀 Share Post"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Posts Feed */}
        <div className="modern-card fade-in-up">
          <div className="card-header-modern" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>🌍 Community Feed</h3>
            <button 
              className="btn-modern btn-outline-modern btn-small"
              onClick={() => loadPosts()}
              disabled={postsLoading || loading}
            >
              {postsLoading ? "🔄" : "🔄 Refresh"}
            </button>
          </div>
          <div className="card-body-modern">
            {postsLoading ? (
              <div className="loading-container">
                <div className="modern-spinner"></div>
                <p style={{ marginTop: '1rem', color: '#666' }}>Loading amazing posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                <p>No posts yet. Be the pioneer and share the first post!</p>
              </div>
            ) : (
              <div>
                {posts.map((post, index) => (
                  <div key={post.id} className="post-card" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="post-header">
                      <div className="post-author">
                        <div className="author-avatar">
                          {post.isOwner ? "👤" : post.author.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="author-info">
                          <h6>
                            {post.isOwner ? "You" : post.author}
                            {post.isOwner && " 🔥"}
                          </h6>
                          <small>{post.timestamp}</small>
                        </div>
                      </div>
                      {post.isOwner && (
                        <button
                          className="btn-modern btn-outline-modern btn-small"
                          onClick={() => startEdit(post)}
                          disabled={loading}
                        >
                          ✏️ Edit
                        </button>
                      )}
                    </div>
                    <div className="post-content">
                      {editingPost === post.id ? (
                        <div>
                          <textarea
                            className="modern-textarea"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            disabled={loading}
                            style={{ marginBottom: '1rem' }}
                          />
                          <div className="edit-actions">
                            <button
                              className="btn-modern btn-success-modern btn-small"
                              onClick={() => editPost(post.id)}
                              disabled={loading || !editContent.trim()}
                            >
                              {loading ? "💾 Saving..." : "💾 Save Changes"}
                            </button>
                            <button
                              className="btn-modern btn-outline-modern btn-small"
                              onClick={cancelEdit}
                              disabled={loading}
                            >
                              ❌ Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        post.content
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

