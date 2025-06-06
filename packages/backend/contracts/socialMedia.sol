// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract SocialDApp {
    struct Post {
        uint256 id;
        address author;
        string content;
        uint256 timestamp;
        bool exists;
    }
    
    struct User {
        address userAddress;
        string username;
        bool isRegistered;
        uint256[] userPosts;
    }
    
    mapping(address => User) public users;
    mapping(uint256 => Post) public posts;
    mapping(address => bool) public registeredUsers;
    
    uint256 public totalPosts;
    uint256 public totalUsers;
    
    event UserRegistered(address indexed user, string username);
    event PostCreated(uint256 indexed postId, address indexed author, string content);
    event PostEdited(uint256 indexed postId, address indexed author, string newContent);
    
    modifier onlyRegistered() {
        require(registeredUsers[msg.sender], "User not registered");
        _;
    }
    
    modifier onlyPostAuthor(uint256 _postId) {
        require(posts[_postId].exists, "Post does not exist");
        require(posts[_postId].author == msg.sender, "Not the author of this post");
        _;
    }
    
    // Register user (called after MetaMask connection)
    function registerUser(string memory _username) external {
        require(!registeredUsers[msg.sender], "User already registered");
        require(bytes(_username).length > 0, "Username cannot be empty");
        
        users[msg.sender] = User({
            userAddress: msg.sender,
            username: _username,
            isRegistered: true,
            userPosts: new uint256[](0)
        });
        
        registeredUsers[msg.sender] = true;
        totalUsers++;
        
        emit UserRegistered(msg.sender, _username);
    }
    
    // Create a new post
    function createPost(string memory _content) external onlyRegistered {
        require(bytes(_content).length > 0, "Post content cannot be empty");
        require(bytes(_content).length <= 1000, "Post content too long");
        
        totalPosts++;
        
        posts[totalPosts] = Post({
            id: totalPosts,
            author: msg.sender,
            content: _content,
            timestamp: block.timestamp,
            exists: true
        });
        
        users[msg.sender].userPosts.push(totalPosts);
        
        emit PostCreated(totalPosts, msg.sender, _content);
    }
    
    // Edit an existing post
    function editPost(uint256 _postId, string memory _newContent) external onlyRegistered onlyPostAuthor(_postId) {
        require(bytes(_newContent).length > 0, "Post content cannot be empty");
        require(bytes(_newContent).length <= 1000, "Post content too long");
        
        posts[_postId].content = _newContent;
        
        emit PostEdited(_postId, msg.sender, _newContent);
    }
    
    // Get user info
    function getUserInfo(address _user) external view returns (
        address userAddress,
        string memory username,
        bool isRegistered,
        uint256 postCount
    ) {
        User memory user = users[_user];
        return (
            user.userAddress,
            user.username,
            user.isRegistered,
            user.userPosts.length
        );
    }
    
    // Get user's posts
    function getUserPosts(address _user) external view returns (uint256[] memory) {
        return users[_user].userPosts;
    }
    
    // Get post details
    function getPost(uint256 _postId) external view returns (
        uint256 id,
        address author,
        string memory content,
        uint256 timestamp
    ) {
        require(posts[_postId].exists, "Post does not exist");
        Post memory post = posts[_postId];
        return (post.id, post.author, post.content, post.timestamp);
    }
    
    // Get all posts (for feed)
    function getAllPosts() external view returns (
        uint256[] memory ids,
        address[] memory authors,
        string[] memory contents,
        uint256[] memory timestamps
    ) {
        uint256 validPostCount = 0;
        
        // Count valid posts
        for (uint256 i = 1; i <= totalPosts; i++) {
            if (posts[i].exists) {
                validPostCount++;
            }
        }
        
        // Initialize arrays
        ids = new uint256[](validPostCount);
        authors = new address[](validPostCount);
        contents = new string[](validPostCount);
        timestamps = new uint256[](validPostCount);
        
        // Fill arrays with valid posts (reverse order for newest first)
        uint256 index = 0;
        for (uint256 i = totalPosts; i >= 1; i--) {
            if (posts[i].exists) {
                ids[index] = posts[i].id;
                authors[index] = posts[i].author;
                contents[index] = posts[i].content;
                timestamps[index] = posts[i].timestamp;
                index++;
                if (index >= validPostCount) break;
            }
        }
    }
    
    // Check if user is registered
    function isUserRegistered(address _user) external view returns (bool) {
        return registeredUsers[_user];
    }
    
    // Get platform stats
    function getPlatformStats() external view returns (uint256 usersCount, uint256 postsCount) {
        usersCount = totalUsers; // assuming you track user addresses
        postsCount = totalPosts;      // assuming you track posts globally
    }

}