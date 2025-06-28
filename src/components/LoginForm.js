import React, { useState } from 'react';
import { login } from '../config/apiUtils';
import { ERROR_MESSAGES } from '../config/constants';

const LoginForm = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(formData);
      
      // Store token in localStorage
      localStorage.setItem('uchat_token', response.token);
      
      // Call onLogin with user data
      onLogin(response.user, response.token);
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || ERROR_MESSAGES.LOGIN_FAILED);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-lg border-0">
      <div className="card-body p-5">
        <div className="text-center mb-4">
          <h2 className="h3 mb-3 fw-bold text-primary">Welcome Back</h2>
        </div>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="identifier" className="form-label">
              Username or Email
            </label>
            <input
              type="text"
              className="form-control form-control-lg"
              id="identifier"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Enter username or email"
              required
              disabled={loading}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              className="form-control form-control-lg"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>
          
          <div className="d-grid mb-3">
            <button 
              type="submit" 
              className="btn btn-primary btn-lg"
              disabled={loading || !formData.identifier || !formData.password}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Logging in...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Login
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <button 
            className="btn btn-outline-primary"
            onClick={onSwitchToRegister}
            disabled={loading}
          >
            <i className="bi bi-person-plus me-1"></i>
            Create Account
          </button>
        </div>
        
        <hr className="my-4" />
        
        <div className="text-center">
          <h6 className="text-muted mb-3">Quick Demo</h6>
          <div className="row g-2">
            <div className="col-6">
              <button
                type="button"
                className="btn btn-sm btn-outline-info w-100"
                onClick={() => setFormData({ identifier: 'alice', password: 'password123' })}
                disabled={loading}
              >
                Alice
              </button>
            </div>
            <div className="col-6">
              <button
                type="button"
                className="btn btn-sm btn-outline-success w-100"
                onClick={() => setFormData({ identifier: 'bob', password: 'password123' })}
                disabled={loading}
              >
                Bob
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
