import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const LoginScreen = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);

  const handleLogin = (user, token) => {
    onLogin({ ...user, token });
  };

  const handleRegister = (user, token) => {
    onLogin({ ...user, token });
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row w-100 justify-content-center">
        <div className="col-md-8 col-lg-6 col-xl-5">
          <div className="text-center mb-4">
            <i className="bi bi-chat-dots-fill text-primary display-1"></i>
            <h1 className="display-4 fw-bold text-white mb-2">Uchat</h1>
            <p className="lead text-white-50">Real-time messaging made simple</p>
          </div>
          
          {isLogin ? (
            <LoginForm 
              onLogin={handleLogin}
              onSwitchToRegister={() => setIsLogin(false)}
            />
          ) : (
            <RegisterForm 
              onRegister={handleRegister}
              onSwitchToLogin={() => setIsLogin(true)}
            />
          )}
          
          <div className="text-center mt-4">
            <small className="text-white-50">
              <i className="bi bi-shield-check me-1"></i>
              Secure • Real-time • Modern
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
