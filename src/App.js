import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import LoginScreen from './components/LoginScreen';
import ChatRoom from './components/ChatRoom';
import API_CONFIG, { getSocketUrl, getSessionTimeout, getMaxSessionDuration, getStorageKey } from './config/api';
import { SOCKET_EVENTS, ACTIVITY_EVENTS, ERROR_MESSAGES, UI_CONSTANTS } from './config/constants';
import './App.css';

const socket = io(getSocketUrl());

// Session timeout durations from config
const SESSION_TIMEOUT = getSessionTimeout(); // 5 minutes inactivity
const MAX_SESSION_DURATION = getMaxSessionDuration(); // 20 minutes total
const SESSION_KEY = getStorageKey('SESSION');
const LAST_ACTIVITY_KEY = getStorageKey('LAST_ACTIVITY');
const SESSION_START_KEY = getStorageKey('SESSION_START');

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const sessionTimeoutRef = useRef(null);
  const maxSessionTimeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  // Check for existing session on app load
  useEffect(() => {
    checkExistingSession();
  }, []);

  // ...existing socket connection code...
  useEffect(() => {
    socket.on(SOCKET_EVENTS.CONNECT, () => {
      setIsConnected(true);
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      setIsConnected(false);
    });

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT);
      socket.off(SOCKET_EVENTS.DISCONNECT);
    };
  }, []);

  // Set up activity listeners when user is logged in
  useEffect(() => {
    if (currentUser) {
      setupActivityListeners();
      setupVisibilityChangeListener();
      resetSessionTimeout();
      
      // Clean up on unmount or logout
      return () => {
        clearSessionTimeouts();
        removeActivityListeners();
        removeVisibilityChangeListener();
      };
    }
  }, [currentUser]);

  // Check for existing session
  const checkExistingSession = () => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    const savedToken = localStorage.getItem('uchat_token');
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    const sessionStart = localStorage.getItem(SESSION_START_KEY);
    
    if (savedSession && savedToken && lastActivity && sessionStart) {
      const sessionData = JSON.parse(savedSession);
      const lastActivityTime = parseInt(lastActivity);
      const sessionStartTime = parseInt(sessionStart);
      const currentTime = Date.now();
      
      // Check if session has expired due to inactivity OR maximum duration
      const inactivityExpired = currentTime - lastActivityTime > SESSION_TIMEOUT;
      const maxDurationExpired = currentTime - sessionStartTime > MAX_SESSION_DURATION;
      
      if (inactivityExpired || maxDurationExpired) {
        // Session expired, clear storage
        clearSession();
        const reason = inactivityExpired ? 'inactivity (5 min)' : 'maximum duration (20 min)';
        console.log(`Session expired due to ${reason}`);
      } else {
        // Session still valid, restore user
        setCurrentUser(sessionData);
        setAuthToken(savedToken);
        setSessionStartTime(sessionStartTime);
        
        // Update socket auth and join
        socket.auth = { token: savedToken };
        socket.connect();
        socket.emit(SOCKET_EVENTS.JOIN);
      }
    }
  };

  // Set up activity listeners
  const setupActivityListeners = () => {
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, updateLastActivity, true);
    });
  };

  // Remove activity listeners
  const removeActivityListeners = () => {
    ACTIVITY_EVENTS.forEach(event => {
      document.removeEventListener(event, updateLastActivity, true);
    });
  };

  // Set up visibility change listener
  const setupVisibilityChangeListener = () => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  };

  // Remove visibility change listener
  const removeVisibilityChangeListener = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  // Handle page visibility change
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Page is hidden, update last activity before leaving
      updateLastActivity();
    } else {
      // Page is visible again, check session validity
      checkSessionOnReturn();
    }
  };

  // Check session when user returns to tab
  const checkSessionOnReturn = () => {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    const sessionStart = localStorage.getItem(SESSION_START_KEY);
    
    if (lastActivity && sessionStart && currentUser) {
      const lastActivityTime = parseInt(lastActivity);
      const sessionStartTime = parseInt(sessionStart);
      const currentTime = Date.now();
      
      // Check both timeout conditions
      const inactivityExpired = currentTime - lastActivityTime > SESSION_TIMEOUT;
      const maxDurationExpired = currentTime - sessionStartTime > MAX_SESSION_DURATION;
      
      if (inactivityExpired || maxDurationExpired) {
        handleAutoLogout();
      } else {
        // Session still valid, reset timeout
        resetSessionTimeout();
      }
    }
  };

  // Update last activity timestamp
  const updateLastActivity = () => {
    const currentTime = Date.now();
    localStorage.setItem(LAST_ACTIVITY_KEY, currentTime.toString());
    
    // Reset timeout if user is active
    if (currentUser) {
      resetSessionTimeout();
    }
    
    // Hide warning if user becomes active
    if (showTimeoutWarning) {
      setShowTimeoutWarning(false);
    }
  };

  // Reset session timeout
  const resetSessionTimeout = () => {
    clearSessionTimeouts();
    
    const currentTime = Date.now();
    const sessionStart = sessionStartTime || currentTime;
    
    // Calculate remaining time for both conditions
    const inactivityTimeRemaining = SESSION_TIMEOUT;
    const maxDurationTimeRemaining = MAX_SESSION_DURATION - (currentTime - sessionStart);
    
    // Use the shorter of the two timeouts
    const timeUntilLogout = Math.min(inactivityTimeRemaining, maxDurationTimeRemaining);
    const timeUntilWarning = Math.max(0, timeUntilLogout - UI_CONSTANTS.SESSION_WARNING_TIME);
    
    // Only set timeouts if there's time remaining
    if (timeUntilLogout > 0) {
      // Set warning timeout
      if (timeUntilWarning > 0) {
        warningTimeoutRef.current = setTimeout(() => {
          setShowTimeoutWarning(true);
        }, timeUntilWarning);
      } else {
        // If less than warning time remaining, show warning immediately
        setShowTimeoutWarning(true);
      }
      
      // Set logout timeout
      sessionTimeoutRef.current = setTimeout(() => {
        handleAutoLogout();
      }, timeUntilLogout);
    } else {
      // Time already expired, logout immediately
      handleAutoLogout();
    }
  };

  // Clear all timeouts
  const clearSessionTimeouts = () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
    if (maxSessionTimeoutRef.current) {
      clearTimeout(maxSessionTimeoutRef.current);
      maxSessionTimeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  };

  // Handle auto logout
  const handleAutoLogout = () => {
    clearSession();
    setCurrentUser(null);
    setShowTimeoutWarning(false);
    socket.disconnect();
    socket.connect();
    
    // Show alert to user
    alert(ERROR_MESSAGES.SESSION_EXPIRED);
  };

  // Clear session data
  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(SESSION_START_KEY);
    localStorage.removeItem('uchat_token');
  };

  // Handle login
  const handleLogin = (userData) => {
    const { token, ...user } = userData;
    const currentTime = Date.now();
    
    setCurrentUser(user);
    setAuthToken(token);
    setSessionStartTime(currentTime);
    
    // Save session data
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.setItem('uchat_token', token);
    localStorage.setItem(LAST_ACTIVITY_KEY, currentTime.toString());
    localStorage.setItem(SESSION_START_KEY, currentTime.toString());
    
    // Update socket auth and join
    socket.auth = { token };
    socket.connect();
    socket.emit(SOCKET_EVENTS.JOIN);
  };

  // Handle logout
  // Handle logout
  const handleLogout = () => {
    clearSession();
    clearSessionTimeouts();
    removeActivityListeners();
    removeVisibilityChangeListener();
    setCurrentUser(null);
    setAuthToken(null);
    setSessionStartTime(null);
    setShowTimeoutWarning(false);
    socket.disconnect();
    socket.connect();
  };

  // Extend session when user chooses to stay
  const extendSession = () => {
    setShowTimeoutWarning(false);
    updateLastActivity();
    resetSessionTimeout();
  };

  return (
    <div className="App">
      {/* Timeout Warning Modal */}
      {showTimeoutWarning && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Session Timeout Warning
                </h5>
              </div>
              <div className="modal-body text-center">
                <i className="bi bi-clock display-1 text-warning mb-3"></i>
                <p className="mb-3">
                  Your session will expire in <strong>2 minutes</strong> due to inactivity.
                </p>
                <p className="text-muted">
                  Click "Stay Logged In" to continue your session.
                </p>
              </div>
              <div className="modal-footer justify-content-center">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary me-2"
                  onClick={handleAutoLogout}
                >
                  <i className="bi bi-box-arrow-right me-1"></i>
                  Logout Now
                </button>
                <button 
                  type="button" 
                  className="btn btn-warning"
                  onClick={extendSession}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Stay Logged In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!currentUser ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <ChatRoom 
          socket={socket} 
          currentUser={currentUser} 
          onLogout={handleLogout}
          isConnected={isConnected}
          onActivity={updateLastActivity}
        />
      )}
    </div>
  );
}

export default App;
