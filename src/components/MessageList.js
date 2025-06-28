import React from 'react';

const MessageList = ({ messages, currentUser, typingUsers, onlineUsers }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isCurrentUser = (message) => {
    return message.user.id === currentUser.id;
  };

  const getTypingUsersNames = () => {
    return onlineUsers
      .filter(user => typingUsers.includes(user.id) && user.id !== currentUser.id)
      .map(user => user.name);
  };

  return (
    <div>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`d-flex mb-3 ${isCurrentUser(message) ? 'justify-content-end' : 'justify-content-start'}`}
        >
          <div className={`d-flex ${isCurrentUser(message) ? 'flex-row-reverse' : 'flex-row'} align-items-end`}>
            {/* Avatar */}
            <img
              src={message.user.avatar}
              alt={message.user.name}
              className="rounded-circle me-2 ms-2"
              style={{ 
                width: '40px', 
                height: '40px', 
                objectFit: 'cover',
                border: `2px solid ${message.user.color}` 
              }}
            />
            
            {/* Message Bubble */}
            <div
              className={`card border-0 shadow-sm ${isCurrentUser(message) ? 'bg-primary text-white' : 'bg-white'}`}
              style={{ 
                maxWidth: '70%',
                borderRadius: isCurrentUser(message) ? '20px 20px 5px 20px' : '20px 20px 20px 5px'
              }}
            >
              <div className="card-body p-3">
                {!isCurrentUser(message) && (
                  <div className="small fw-bold mb-1" style={{ color: message.user.color }}>
                    {message.user.name}
                  </div>
                )}
                <div className="mb-1">{message.text}</div>
                <div className={`small ${isCurrentUser(message) ? 'text-white-50' : 'text-muted'}`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Typing Indicator */}
      {getTypingUsersNames().length > 0 && (
        <div className="d-flex justify-content-start mb-3">
          <div className="d-flex align-items-center">
            <div className="bg-light rounded-pill px-3 py-2 shadow-sm">
              <div className="d-flex align-items-center text-muted">
                <div className="typing-indicator me-2">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <small>
                  {getTypingUsersNames().join(', ')} {getTypingUsersNames().length === 1 ? 'is' : 'are'} typing...
                </small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
