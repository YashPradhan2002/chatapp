import React from 'react';

const UserList = ({ users, currentUser, onClose }) => {
  return (
    <div className="h-100 d-flex flex-column">
      {/* Header */}
      <div className="p-3 border-bottom bg-white">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">
            <i className="bi bi-people-fill me-2 text-primary"></i>
            Online Users ({users.length})
          </h6>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
      
      {/* User List */}
      <div className="flex-grow-1 overflow-auto">
        {users.map((user) => (
          <div 
            key={user.id} 
            className={`p-3 border-bottom ${user.id === currentUser.id ? 'bg-primary bg-opacity-10' : ''}`}
          >
            <div className="d-flex align-items-center">
              <div className="position-relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="rounded-circle"
                  style={{ 
                    width: '45px', 
                    height: '45px', 
                    objectFit: 'cover',
                    border: `2px solid ${user.color}` 
                  }}
                />
                {/* Online indicator */}
                <span 
                  className="position-absolute bottom-0 end-0 bg-success border border-2 border-white rounded-circle"
                  style={{ width: '12px', height: '12px' }}
                ></span>
              </div>
              
              <div className="ms-3 flex-grow-1">
                <div className="fw-bold text-dark">
                  {user.name}
                  {user.id === currentUser.id && (
                    <span className="badge bg-primary ms-2">You</span>
                  )}
                </div>
                <div className="small text-success">
                  <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i>
                  Online
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="text-center text-muted p-4">
            <i className="bi bi-people display-4 opacity-25"></i>
            <p className="mt-2">No users online</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-top bg-white">
        <div className="small text-muted text-center">
          <i className="bi bi-shield-check me-1"></i>
          All users are verified
        </div>
      </div>
    </div>
  );
};

export default UserList;
