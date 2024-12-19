const chat = document.getElementById('chat');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');

let socket;
let token = '';
let currentUser = null;
let currentChatUser = null;

function register(event) {
    event.preventDefault();
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    
    fetch('http://localhost:4000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        if (data.message === 'User registered successfully') {
            document.querySelector('[href="#login"]').click();
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        alert('Error during registration');
    });
}

function login(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            token = data.token;
            currentUser = username; 
            document.getElementById('auth-forms').style.display = 'none';
            document.getElementById('chat-interface').style.display = 'block';
            fetchUsers();
            connectSocket();
        } else {
            alert('Login failed: ' + (data.message || 'Invalid credentials'));
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        alert('Error during login');
    });
}

function fetchUsers() {
    fetch('http://localhost:4000/users', {
        headers: { 
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        return response.json();
    })
    .then(users => {
        const userList = document.getElementById('userList');
        userList.innerHTML = ''; 
        users.forEach(user => {
            userList.innerHTML += createUserListItem(user.username);
        });
    })
    .catch(error => {
        console.error('Error fetching users:', error);
        alert('Error loading users list');
    });
}

function createUserListItem(username) {
    return `
        <div class="user-list-item d-flex align-items-center" onclick="selectUser('${username}')">
            <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" 
                 style="width: 40px; height: 40px;">
                ${username.charAt(0).toUpperCase()}
            </div>
            <div class="flex-grow-1">
                <h6 class="mb-0">${username}</h6>
            </div>
        </div>
    `;
}

function selectUser(username) {
    currentChatUser = username;
    console.log('Selected user:', username);
    
    document.getElementById('chatHeader').innerHTML = `
        <div class="d-flex align-items-center">
            <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2" 
                 style="width: 40px; height: 40px;">
                ${username.charAt(0).toUpperCase()}
            </div>
            <h6 class="mb-0">${username}</h6>
        </div>
    `;
    
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';
    loadMessages(username);
}

function loadMessages(username) {
    console.log('Loading messages for:', username);
    fetch(`http://localhost:3001/messages/${username}`, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to load messages');
        return response.json();
    })
    .then(messages => {
        console.log('Loaded messages:', messages);
        const messagesDiv = document.getElementById('messages');
        messagesDiv.innerHTML = '';
        messages.forEach(msg => {
            appendMessage(msg.from === currentUser, msg.message);
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    })
    .catch(error => {
        console.error('Error loading messages:', error);
        alert('Failed to load messages');
    });
}

function appendMessage(isSent, message) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isSent ? 'message-sent' : 'message-received'}`;
    messageDiv.textContent = message;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (message && currentChatUser) {
        console.log('Sending message to:', currentChatUser, message);

        socket.emit('private message', {
            to: currentChatUser,
            message: message
        });

        appendMessage(true, message);
        messageInput.value = '';
    }
}

function connectSocket() {
    socket = io('http://localhost:3002', { 
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('Socket connected');
    });

    socket.on('private message', data => {
        console.log('Received private message:', data);
        if (data.from === currentChatUser) {
            appendMessage(false, data.message);
        } 
    });

    socket.on('message sent', data => {
        console.log('Message sent confirmation:', data);
    });

    socket.on('error', error => {
        console.error('Socket error:', error);
        alert(error.message);
    });
}

document.getElementById('register-form').addEventListener('submit', register);
document.getElementById('login-form').addEventListener('submit', login);
document.getElementById('messageForm').addEventListener('submit', function(e) {
    e.preventDefault();
    sendMessage();
});

var triggerTabList = [].slice.call(document.querySelectorAll('#authTabs a'))
triggerTabList.forEach(function (triggerEl) {
    new bootstrap.Tab(triggerEl)
});