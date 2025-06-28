import React, { useState } from 'react';
import { register } from '../config/apiUtils';
import { ERROR_MESSAGES } from '../config/constants';

const RegisterForm = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    color: '#007bff'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const avatarOptions = [
    { url: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face', label: 'Woman 1' },
    { url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', label: 'Man 1' },
    { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', label: 'Man 2' },
    { url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', label: 'Woman 2' },
    { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', label: 'Man 3' },
    { url: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face', label: 'Woman 3' }
  ];

  const colorOptions = [
    '#007bff', '#28a745', '#dc3545', '#ffc107', 
    '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await register(registrationData);
      
      // Store token in localStorage
      localStorage.setItem('uchat_token', response.token);
      
      // Call onRegister with user data
      onRegister(response.user, response.token);
      
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-lg border-0">
      <div className="card-body p-5">
        <div className="text-center mb-4">
          <i className="bi bi-person-plus-fill text-primary display-3"></i>
          <h2 className="h3 mb-3 fw-bold text-primary">Create Account</h2>
          <p className="text-muted">Join Uchat and start chatting</p>
        </div>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="name" className="form-label">
                <i className="bi bi-person me-1"></i>
                Full Name
              </label>
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>
            
            <div className="col-md-6 mb-3">
              <label htmlFor="username" className="form-label">
                <i className="bi bi-at me-1"></i>
                Username
              </label>
              <input
                type="text"
                className="form-control"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              <i className="bi bi-envelope me-1"></i>
              Email Address
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="password" className="form-label">
                <i className="bi bi-lock me-1"></i>
                Password
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                disabled={loading}
              />
            </div>
            
            <div className="col-md-6 mb-3">
              <label htmlFor="confirmPassword" className="form-label">
                <i className="bi bi-lock-fill me-1"></i>
                Confirm Password
              </label>
              <input
                type="password"
                className="form-control"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          {/* Avatar Selection */}
          <div className="mb-3">
            <label className="form-label">
              <i className="bi bi-image me-1"></i>
              Choose Avatar
            </label>
            <div className="row g-2">
              {avatarOptions.map((avatar, index) => (
                <div key={index} className="col-4 col-md-2">
                  <button
                    type="button"
                    className={`btn btn-outline-primary w-100 p-1 ${formData.avatar === avatar.url ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, avatar: avatar.url }))}
                    disabled={loading}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.label}
                      className="img-fluid rounded-circle"
                      style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Color Selection */}
          <div className="mb-4">
            <label className="form-label">
              <i className="bi bi-palette me-1"></i>
              Choose Color Theme
            </label>
            <div className="d-flex gap-2 flex-wrap">
              {colorOptions.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  className={`btn border ${formData.color === color ? 'border-dark border-3' : 'border-light'}`}
                  style={{ 
                    backgroundColor: color, 
                    width: '40px', 
                    height: '40px',
                    borderRadius: '50%'
                  }}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  disabled={loading}
                />
              ))}
            </div>
          </div>
          
          <div className="d-grid mb-3">
            <button 
              type="submit" 
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus me-2"></i>
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <p className="text-muted mb-2">Already have an account?</p>
          <button 
            className="btn btn-outline-primary"
            onClick={onSwitchToLogin}
            disabled={loading}
          >
            <i className="bi bi-box-arrow-in-right me-1"></i>
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
