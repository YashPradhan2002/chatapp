import React, { useState, useRef } from 'react';
import { UI_CONSTANTS } from '../config/constants';

const MessageInput = ({ onSendMessage, onTyping, disabled, otherUsers, onActivity }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      handleStopTyping();
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Trigger activity tracking
    if (onActivity) {
      onActivity();
    }
    
    if (e.target.value.trim() && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, UI_CONSTANTS.TYPING_TIMEOUT);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      onTyping(false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <div>
      {/* Quick info about other users */}
      {otherUsers.length > 0 && (
        <div className="small text-muted mb-2">
          <i className="bi bi-info-circle me-1"></i>
          Chatting with: {otherUsers.map(user => user.name).join(', ')}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="text"
            className="form-control form-control-lg"
            placeholder={disabled ? "Connecting..." : "Type your message..."}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            style={{
              borderRadius: '25px 0 0 25px',
              border: '2px solid #e9ecef',
              paddingLeft: '20px'
            }}
          />
          <button 
            className="btn btn-primary"
            type="submit"
            disabled={!message.trim() || disabled}
            style={{
              borderRadius: '0 25px 25px 0',
              paddingLeft: '25px',
              paddingRight: '25px'
            }}
          >
            <i className="bi bi-send-fill"></i>
          </button>
        </div>
      </form>
      
      {/* Message tips */}
      <div className="small text-muted mt-2 text-center">
        <i className="bi bi-lightbulb me-1"></i>
        Press Enter to send • Shift+Enter for new line
      </div>
    </div>
  );
};

export default MessageInput;
