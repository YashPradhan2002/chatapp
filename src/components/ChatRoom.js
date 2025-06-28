import React, { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';
import { SOCKET_EVENTS } from '../config/constants';
import API_CONFIG from '../config/api';

const ChatRoom = ({ socket, currentUser, currentRoom, onLogout, onLeaveRoom, isConnected, onActivity }) => {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    // Socket event listeners for room-based chat
    socket.on(SOCKET_EVENTS.ROOM_JOINED, (data) => {
      setMessages(data.messages);
    });

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on(SOCKET_EVENTS.ONLINE_USERS, (users) => {
      setOnlineUsers(users);
    });

    socket.on(SOCKET_EVENTS.USER_TYPING, ({ user, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping) {
          return prev.includes(user.id) ? prev : [...prev, user.id];
        } else {
          return prev.filter(id => id !== user.id);
        }
      });
    });

    socket.on(SOCKET_EVENTS.USER_JOINED, (user) => {
      // Add system message for user joining
      const systemMessage = {
        id: `system-${Date.now()}`,
        text: `${user.name} joined the room`,
        user: { name: 'System', color: '#6c757d' },
        timestamp: new Date().toISOString(),
        messageType: 'system'
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    socket.on(SOCKET_EVENTS.USER_LEFT, (user) => {
      // Add system message for user leaving
      const systemMessage = {
        id: `system-${Date.now()}`,
        text: `${user.name} left the room`,
        user: { name: 'System', color: '#6c757d' },
        timestamp: new Date().toISOString(),
        messageType: 'system'
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_JOINED);
      socket.off(SOCKET_EVENTS.NEW_MESSAGE);
      socket.off(SOCKET_EVENTS.ONLINE_USERS);
      socket.off(SOCKET_EVENTS.USER_TYPING);
      socket.off(SOCKET_EVENTS.USER_JOINED);
      socket.off(SOCKET_EVENTS.USER_LEFT);
    };
  }, [socket]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive, but only if user is near bottom
    if (isNearBottom) {
      scrollToBottom();
    } else {
      setShowScrollButton(true);
    }
  }, [messages, isNearBottom]);

  // Check scroll position to determine if user is near bottom
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNear = scrollHeight - scrollTop - clientHeight < 100; // Within 100px of bottom
      setIsNearBottom(isNear);
      setShowScrollButton(!isNear && messages.length > 0);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
    setIsNearBottom(true);
  };

  const scrollToBottomInstant = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    setShowScrollButton(false);
    setIsNearBottom(true);
  };

  const handleSendMessage = (text) => {
    if (text.trim()) {
      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, { text });
      // Auto-scroll when user sends a message
      setTimeout(scrollToBottomInstant, 100);
    }
  };

  const handleTyping = (isTyping) => {
    socket.emit(SOCKET_EVENTS.TYPING, isTyping);
  };

  const getOtherUsers = () => {
    return onlineUsers.filter(user => user.id !== currentUser.id);
  };

  const handleInviteUser = async () => {
    if (!inviteUsername.trim()) {
      alert('Please enter a username');
      return;
    }

    try {
      const token = localStorage.getItem('uchat_token');
      const url = API_CONFIG.ENDPOINTS.INVITE_USER.replace(':roomId', currentRoom.id);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: inviteUsername.trim() })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Invitation sent to ${inviteUsername}!\nInvite code: ${data.inviteCode}`);
        setInviteUsername('');
        setShowInviteModal(false);
      } else {
        alert(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Invite error:', error);
      alert('Failed to send invitation');
    }
  };

  return (
    <div className="container-fluid vh-100 p-0">
      <div className="row g-0 h-100">
        {/* Chat Header */}
        <div className="col-12">
          <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
            <div className="container-fluid">
              <div className="navbar-brand d-flex align-items-center">
                <button 
                  className="btn btn-outline-light me-2"
                  onClick={onLeaveRoom}
                  title="Back to Dashboard"
                >
                  <i className="bi bi-arrow-left"></i>
                </button>
                <i className="bi bi-house-door-fill me-2"></i>
                <div>
                  <span className="fw-bold">{currentRoom.name}</span>
                  {currentRoom.description && (
                    <div className="small text-light opacity-75">{currentRoom.description}</div>
                  )}
                </div>
              </div>
              
              <div className="d-flex align-items-center">
                {/* Connection Status */}
                <span className={`badge me-3 ${isConnected ? 'bg-success' : 'bg-danger'}`}>
                  <i className={`bi ${isConnected ? 'bi-wifi' : 'bi-wifi-off'} me-1`}></i>
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
                
                {/* Invite Button */}
                <button 
                  className="btn btn-outline-light me-2"
                  onClick={() => setShowInviteModal(true)}
                  title="Invite User"
                >
                  <i className="bi bi-person-plus-fill"></i>
                </button>
                
                {/* Online Users Button */}
                <button 
                  className="btn btn-outline-light me-3"
                  onClick={() => setShowUserList(!showUserList)}
                >
                  <i className="bi bi-people-fill me-1"></i>
                  Online ({onlineUsers.length})
                </button>
                
                {/* Current User */}
                <div className="dropdown">
                  <button 
                    className="btn btn-outline-light dropdown-toggle d-flex align-items-center" 
                    type="button" 
                    data-bs-toggle="dropdown"
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="rounded-circle me-2"
                      style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                    />
                    {currentUser.name}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <div className="dropdown-header">
                        <i className="bi bi-info-circle me-1"></i>
                        Session Info
                      </div>
                    </li>
                    <li>
                      <span className="dropdown-item-text small">
                        <i className="bi bi-clock me-1"></i>
                        Auto-logout in 20min of inactivity
                      </span>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={onLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* Chat Content */}
        <div className="col-12" style={{ height: 'calc(100vh - 76px)' }}>
          <div className="row g-0 h-100">
            {/* User List Sidebar */}
            {showUserList && (
              <div className="col-md-3 border-end bg-light">
                <UserList 
                  users={onlineUsers} 
                  currentUser={currentUser}
                  onClose={() => setShowUserList(false)}
                />
              </div>
            )}
            
            {/* Chat Area */}
            <div className={`${showUserList ? 'col-md-9' : 'col-12'} d-flex flex-column position-relative`}>
              {/* Messages Area */}
              <div 
                ref={messagesContainerRef}
                className="flex-grow-1 overflow-auto p-3 messages-container" 
                style={{ backgroundColor: '#f8f9fa' }}
                onScroll={handleScroll}
              >
                {messages.length === 0 ? (
                  <div className="text-center text-muted mt-5">
                    <i className="bi bi-chat-text display-1 opacity-25"></i>
                    <p className="mt-3">No messages yet. Start the conversation!</p>
                    <p className="small">Messages in this room are end-to-end encrypted 🔒</p>
                  </div>
                ) : (
                  <MessageList 
                    messages={messages} 
                    currentUser={currentUser}
                    typingUsers={typingUsers}
                    onlineUsers={onlineUsers}
                  />
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to Bottom Button */}
              {showScrollButton && (
                <div className="position-absolute" style={{ bottom: '90px', right: '20px', zIndex: 1000 }}>
                  <button
                    className="btn btn-primary rounded-circle shadow-lg scroll-to-bottom-btn d-flex align-items-center justify-content-center"
                    style={{ width: '50px', height: '50px' }}
                    onClick={scrollToBottom}
                    title="Go to bottom"
                  >
                    <i className="bi bi-arrow-down fs-5"></i>
                  </button>
                  <div className="position-absolute top-0 start-100 translate-middle">
                    <span className="badge bg-danger rounded-pill pulse">
                      <i className="bi bi-chevron-down small"></i>
                    </span>
                  </div>
                </div>
              )}
              
              {/* Message Input */}
              <div className="border-top bg-white p-3">
                <MessageInput 
                  onSendMessage={handleSendMessage}
                  onTyping={handleTyping}
                  disabled={!isConnected}
                  otherUsers={getOtherUsers()}
                  onActivity={onActivity}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2"></i>
                  Invite User to {currentRoom.name}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowInviteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  Enter the username of the person you want to invite to this room.
                </p>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    placeholder="Enter username"
                    onKeyPress={(e) => e.key === 'Enter' && handleInviteUser()}
                    autoFocus
                  />
                </div>
                <div className="alert alert-info small">
                  <i className="bi bi-info-circle me-1"></i>
                  The invited user will receive an invite code to join this room.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleInviteUser}
                  disabled={!inviteUsername.trim()}
                >
                  <i className="bi bi-send me-1"></i>
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
