import React, { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';
import { SOCKET_EVENTS } from '../config/constants';

const ChatRoom = ({ socket, currentUser, onLogout, isConnected, onActivity }) => {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const [sessionInfo, setSessionInfo] = useState({ loginTime: Date.now() });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Socket event listeners
    socket.on(SOCKET_EVENTS.JOINED, (data) => {
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
      // You could add a system message here if desired
    });

    socket.on(SOCKET_EVENTS.USER_LEFT, (user) => {
      // You could add a system message here if desired
    });

    return () => {
      socket.off(SOCKET_EVENTS.JOINED);
      socket.off(SOCKET_EVENTS.NEW_MESSAGE);
      socket.off(SOCKET_EVENTS.ONLINE_USERS);
      socket.off(SOCKET_EVENTS.USER_TYPING);
      socket.off(SOCKET_EVENTS.USER_JOINED);
      socket.off(SOCKET_EVENTS.USER_LEFT);
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (text) => {
    if (text.trim()) {
      socket.emit(SOCKET_EVENTS.SEND_MESSAGE, { text });
    }
  };

  const handleTyping = (isTyping) => {
    socket.emit(SOCKET_EVENTS.TYPING, isTyping);
  };

  const getOtherUsers = () => {
    return onlineUsers.filter(user => user.id !== currentUser.id);
  };

  return (
    <div className="container-fluid vh-100 p-0">
      <div className="row g-0 h-100">
        {/* Chat Header */}
        <div className="col-12">
          <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
            <div className="container-fluid">
              <div className="navbar-brand d-flex align-items-center">
                <i className="bi bi-chat-dots-fill me-2"></i>
                <span className="fw-bold">Uchat</span>
              </div>
              
              <div className="d-flex align-items-center">
                {/* Connection Status */}
                <span className={`badge me-3 ${isConnected ? 'bg-success' : 'bg-danger'}`}>
                  <i className={`bi ${isConnected ? 'bi-wifi' : 'bi-wifi-off'} me-1`}></i>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
                
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
            <div className={`${showUserList ? 'col-md-9' : 'col-12'} d-flex flex-column`}>
              {/* Messages Area */}
              <div className="flex-grow-1 overflow-auto p-3" style={{ backgroundColor: '#f8f9fa' }}>
                {messages.length === 0 ? (
                  <div className="text-center text-muted mt-5">
                    <i className="bi bi-chat-text display-1 opacity-25"></i>
                    <p className="mt-3">No messages yet. Start the conversation!</p>
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
    </div>
  );
};

export default ChatRoom;
