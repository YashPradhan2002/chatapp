import React from 'react';

const MessageList = ({ messages, currentUser, typingUsers, onlineUsers }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isCurrentUser = (message) => {
    // Both currentUser and message.user should now have consistent 'id' fields
    return message.user.id === (currentUser.id || currentUser._id);
  };

  const getTypingUsersNames = () => {
    return onlineUsers
      .filter(user => typingUsers.includes(user.id) && user.id !== currentUser.id)
      .map(user => user.name);
  };

  return (
    <div>
      {messages.map((message) => {
        // Handle system messages differently
        if (message.messageType === 'system') {
          return (
            <div key={message.id} className="text-center my-3 system-message">
              <div className="badge bg-secondary rounded-pill px-3 py-2 shadow-sm">
                <i className="bi bi-info-circle me-1"></i>
                {message.text}
              </div>
            </div>
          );
        }

        return (
          <div
            key={message.id}
            className={`d-flex mb-3 message-container ${isCurrentUser(message) ? 'justify-content-end' : 'justify-content-start'}`}
          >
            <div 
              className={`d-flex align-items-end ${isCurrentUser(message) ? 'flex-row-reverse' : 'flex-row'}`}
              style={{ maxWidth: '75%' }}
            >
              {/* Avatar - Show for others, hide for current user on mobile */}
              {!isCurrentUser(message) && (
                <img
                  src={message.user.avatar}
                  alt={message.user.name}
                  className="rounded-circle flex-shrink-0"
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    objectFit: 'cover',
                    border: `2px solid ${message.user.color}`,
                    marginRight: '8px'
                  }}
                />
              )}
              
              {/* Current user avatar - smaller and on the right */}
              {isCurrentUser(message) && (
                <img
                  src={message.user.avatar}
                  alt={message.user.name}
                  className="rounded-circle flex-shrink-0"
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    objectFit: 'cover',
                    border: `2px solid ${message.user.color}`,
                    marginLeft: '8px'
                  }}
                />
              )}
              
              {/* Message Bubble */}
              <div
                className={`card border-0 shadow-sm message-bubble ${
                  isCurrentUser(message) 
                    ? 'bg-primary text-white' 
                    : 'bg-white border'
                }`}
                style={{ 
                  borderRadius: isCurrentUser(message) 
                    ? '18px 18px 4px 18px' 
                    : '18px 18px 18px 4px',
                  minWidth: '60px',
                  maxWidth: '100%'
                }}
              >
                <div className="card-body py-2 px-3">
                  {/* Show sender name for others only */}
                  {!isCurrentUser(message) && (
                    <div 
                      className="small fw-bold mb-1" 
                      style={{ color: message.user.color }}
                    >
                      {message.user.name}
                    </div>
                  )}
                  
                  {/* Message text */}
                  <div className="mb-1 message-text">
                    {message.text}
                  </div>
                  
                  {/* Timestamp */}
                  <div 
                    className={`small text-end ${
                      isCurrentUser(message) ? 'text-white-50' : 'text-muted'
                    }`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
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
