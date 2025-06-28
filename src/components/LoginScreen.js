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
        <div className="col-md-6 col-lg-5 col-xl-4">
          <div className="text-center mb-4">
            <i className="bi bi-chat-dots-fill text-white display-1 mb-3"></i>
            <h1 className="display-4 fw-bold text-white mb-1">Uchat</h1>
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
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
