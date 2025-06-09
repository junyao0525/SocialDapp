// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SocialDApp {
    struct Post {
        uint256 id;
        address author;
        string content;
        uint256 timestamp;
        bool exists;
        uint256 totalTipping;
    }
    
    struct User {
        address userAddress;
        string username;
        bool isRegistered;
        uint256[] userPosts;
        uint256 totalTipping;
        uint256 withdrawnTipping;
    }
    
    mapping(address => User) public users;
    mapping(uint256 => Post) public posts;
    mapping(uint256 => mapping(address => uint256)) public postTipping; // Separated from Post struct
    mapping(address => bool) public registeredUsers;
    
    uint256 public totalPosts;
    uint256 public totalUsers;
    
    event UserRegistered(address indexed user, string username);
    event PostCreated(uint256 indexed postId, address indexed author, string content);
    event PostEdited(uint256 indexed postId, address indexed author, string newContent);
    event TippingGiven(uint256 indexed postId, address indexed giver, address indexed receiver, uint256 amount);
    event TippingWithdrawn(address indexed user, uint256 amount);
    
    modifier onlyRegistered() {
        require(registeredUsers[msg.sender], "User not registered");
        _;
    }
    
    modifier onlyPostAuthor(uint256 _postId) {
        require(posts[_postId].exists, "Post does not exist");
        require(posts[_postId].author == msg.sender, "Not the author of this post");
        _;
    }

    // Give Tipping to a post
    function giveTipping(uint256 _postId) external payable onlyRegistered {
        require(msg.value > 0, "Tipping amount must be greater than 0");
        require(posts[_postId].exists, "Post does not exist");
        require(posts[_postId].author != msg.sender, "Cannot Tipping your own post");

        Post storage post = posts[_postId];
        post.totalTipping += msg.value;
        postTipping[_postId][msg.sender] += msg.value;
        
        User storage author = users[post.author];
        author.totalTipping += msg.value;

        emit TippingGiven(_postId, msg.sender, post.author, msg.value);
    }

    // Get post Tipping
    function getPostTipping(uint256 _postId) external view returns (
        uint256 totalTipping,
        uint256 userTipping
    ) {
        require(posts[_postId].exists, "Post does not exist");
        Post storage post = posts[_postId];
        return (post.totalTipping, postTipping[_postId][msg.sender]);
    }

    // Get user Tipping
    function getUserTipping(address _user) external view returns (
        uint256 totalTipping,
        uint256 withdrawnTipping,
        uint256 availableTipping
    ) {
        User storage user = users[_user];
        return (
            user.totalTipping,
            user.withdrawnTipping,
            user.totalTipping - user.withdrawnTipping
        );
    }

    // Withdraw Tipping
    function withdrawTipping() external onlyRegistered {
        User storage user = users[msg.sender];
        uint256 availableTipping = user.totalTipping - user.withdrawnTipping;
        require(availableTipping > 0, "No Tipping to withdraw");

        user.withdrawnTipping = user.totalTipping;
        (bool success, ) = payable(msg.sender).call{value: availableTipping}("");
        require(success, "Transfer failed");

        emit TippingWithdrawn(msg.sender, availableTipping);
    }
    
    // Register user (called after MetaMask connection)
    function registerUser(string memory _username) external {
        require(!registeredUsers[msg.sender], "User already registered");
        require(bytes(_username).length > 0, "Username cannot be empty");
        
        users[msg.sender] = User({
            userAddress: msg.sender,
            username: _username,
            isRegistered: true,
            userPosts: new uint256[](0),
            totalTipping: 0,
            withdrawnTipping: 0
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
            exists: true,
            totalTipping: 0
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
        uint256 postCount,
        uint256 totalTipping,
        uint256 withdrawnTipping
    ) {
        User memory user = users[_user];
        return (
            user.userAddress,
            user.username,
            user.isRegistered,
            user.userPosts.length,
            user.totalTipping,
            user.withdrawnTipping
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
        uint256 timestamp,
        uint256 totalTipping
    ) {
        require(posts[_postId].exists, "Post does not exist");
        Post storage post = posts[_postId];
        return (post.id, post.author, post.content, post.timestamp, post.totalTipping);
    }
    
    // Get all posts (for feed) - Fixed to handle edge cases
    function getAllPosts() external view returns (
        uint256[] memory ids,
        address[] memory authors,
        string[] memory contents,
        uint256[] memory timestamps,
        uint256[] memory totalTippingArray
    ) {
        if (totalPosts == 0) {
            return (new uint256[](0), new address[](0), new string[](0), new uint256[](0), new uint256[](0));
        }
        
        uint256 validPostCount = 0;
        
        // Count valid posts
        for (uint256 i = 1; i <= totalPosts; i++) {
            if (posts[i].exists) {
                validPostCount++;
            }
        }
        
        if (validPostCount == 0) {
            return (new uint256[](0), new address[](0), new string[](0), new uint256[](0), new uint256[](0));
        }
        
        // Initialize arrays
        ids = new uint256[](validPostCount);
        authors = new address[](validPostCount);
        contents = new string[](validPostCount);
        timestamps = new uint256[](validPostCount);
        totalTippingArray = new uint256[](validPostCount);
        
        // Fill arrays with valid posts (reverse order for newest first)
        uint256 index = 0;
        for (uint256 i = totalPosts; i >= 1 && index < validPostCount; i--) {
            if (posts[i].exists) {
                ids[index] = posts[i].id;
                authors[index] = posts[i].author;
                contents[index] = posts[i].content;
                timestamps[index] = posts[i].timestamp;
                totalTippingArray[index] = posts[i].totalTipping;
                index++;
            }
        }
    }
    
    // Check if user is registered
    function isUserRegistered(address _user) external view returns (bool) {
        return registeredUsers[_user];
    }
    
    // Get platform stats
    function getPlatformStats() external view returns (uint256 usersCount, uint256 postsCount) {
        return (totalUsers, totalPosts);
    }

    // Function to receive ETH
    receive() external payable {}
}