import React, { useState, useEffect } from 'react';
import API_CONFIG from '../config/api';

function RoomDashboard({ currentUser, onJoinRoom, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    password: ''
  });
  const [joinForm, setJoinForm] = useState({
    roomId: '',
    password: ''
  });
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMyRooms();
    fetchInvitations();
  }, []);

  const fetchMyRooms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('uchat_token');
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MY_ROOMS}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setRooms(data.rooms);
      } else {
        setError('Failed to fetch rooms');
      }
    } catch (error) {
      console.error('Fetch rooms error:', error);
      setError('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('uchat_token');
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVITATIONS}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setInvitations(data.invitations);
      }
    } catch (error) {
      console.error('Fetch invitations error:', error);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.password.trim()) {
      setError('Room name and password are required');
      return;
    }

    try {
      const token = localStorage.getItem('uchat_token');
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREATE_ROOM}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Room created successfully!');
        setCreateForm({ name: '', description: '', password: '' });
        setShowCreateForm(false);
        fetchMyRooms();
      } else {
        setError(data.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Create room error:', error);
      setError('Failed to create room');
    }
  };

  const handleJoinRoom = async (roomId, requiresPassword = false) => {
    if (requiresPassword && !joinForm.password) {
      setJoinForm({ ...joinForm, roomId });
      setShowJoinModal(true);
      return;
    }

    try {
      const token = localStorage.getItem('uchat_token');
      const url = API_CONFIG.ENDPOINTS.JOIN_ROOM.replace(':roomId', roomId);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: joinForm.password })
      });

      const data = await response.json();
      if (data.success) {
        setShowJoinModal(false);
        setJoinForm({ roomId: '', password: '' });
        onJoinRoom(roomId);
      } else {
        setError(data.error || 'Failed to join room');
      }
    } catch (error) {
      console.error('Join room error:', error);
      setError('Failed to join room');
    }
  };

  const handleAcceptInvite = async (code = null) => {
    const codeToUse = code || inviteCode;
    if (!codeToUse.trim()) {
      setError('Please enter an invite code');
      return;
    }

    try {
      const token = localStorage.getItem('uchat_token');
      const url = API_CONFIG.ENDPOINTS.ACCEPT_INVITE.replace(':inviteCode', codeToUse.trim());
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Invitation accepted successfully!');
        setInviteCode('');
        fetchMyRooms();
        fetchInvitations();
      } else {
        setError(data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Accept invite error:', error);
      setError('Failed to accept invitation');
    }
  };

  return (
    <div className="container-fluid h-100">
      <div className="row h-100">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
            <div>
              <h3 className="mb-0">
                <i className="bi bi-chat-dots-fill me-2 text-primary"></i>
                Uchat - Room Dashboard
              </h3>
              <small className="text-muted">Welcome, {currentUser.name}</small>
            </div>
            <button className="btn btn-outline-danger" onClick={onLogout}>
              <i className="bi bi-box-arrow-right me-1"></i>
              Logout
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show mt-3" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}
          {success && (
            <div className="alert alert-success alert-dismissible fade show mt-3" role="alert">
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="row mt-4">
            <div className="col-md-4">
              <div className="card">
                <div className="card-body text-center">
                  <i className="bi bi-plus-circle display-4 text-primary mb-3"></i>
                  <h5>Create New Room</h5>
                  <p className="text-muted">Start a new encrypted chat room</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowCreateForm(true)}
                  >
                    Create Room
                  </button>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-body text-center">
                  <i className="bi bi-envelope-open display-4 text-success mb-3"></i>
                  <h5>Accept Invitation</h5>
                  <p className="text-muted">Join a room using invite code</p>
                  <div className="input-group mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter invite code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <button 
                    className="btn btn-success"
                    onClick={handleAcceptInvite}
                    disabled={!inviteCode.trim()}
                  >
                    Accept Invite
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="mt-5">
              <h4>
                <i className="bi bi-envelope me-2"></i>
                Pending Invitations
                <span className="badge bg-warning text-dark ms-2">{invitations.length}</span>
              </h4>
              <div className="row">
                {invitations.map(invitation => (
                  <div key={invitation.id} className="col-md-6 col-lg-4 mb-3">
                    <div className="card border-warning">
                      <div className="card-body">
                        <h6 className="card-title">{invitation.room.name}</h6>
                        {invitation.room.description && (
                          <p className="card-text text-muted small">{invitation.room.description}</p>
                        )}
                        <div className="mb-2">
                          <small className="text-muted">
                            <i className="bi bi-person me-1"></i>
                            Invited by: {invitation.invitedBy.name}
                          </small>
                        </div>
                        <div className="mb-3">
                          <small className="text-muted d-block">
                            <i className="bi bi-clock me-1"></i>
                            Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                          </small>
                        </div>
                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-warning"
                            onClick={() => handleAcceptInvite(invitation.inviteCode)}
                          >
                            <i className="bi bi-check-circle me-1"></i>
                            Accept Invitation
                          </button>
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(invitation.inviteCode);
                              setSuccess('Invite code copied to clipboard!');
                            }}
                          >
                            <i className="bi bi-clipboard me-1"></i>
                            Copy Code: {invitation.inviteCode}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Rooms */}
          <div className="mt-5">
            <h4>
              <i className="bi bi-house-door me-2"></i>
              My Rooms
            </h4>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-chat-square-dots display-1 text-muted mb-3"></i>
                <p className="text-muted">No rooms yet. Create your first room to get started!</p>
              </div>
            ) : (
              <div className="row">
                {rooms.map(room => (
                  <div key={room.id} className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="card-title mb-0">{room.name}</h5>
                          {room.role === 'admin' && (
                            <span className="badge bg-primary">Admin</span>
                          )}
                        </div>
                        {room.description && (
                          <p className="card-text text-muted small">{room.description}</p>
                        )}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <small className="text-muted">
                            <i className="bi bi-people me-1"></i>
                            {room.memberCount} members
                          </small>
                          <small className="text-muted">
                            {new Date(room.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                        <button
                          className="btn btn-primary w-100"
                          onClick={() => handleJoinRoom(room.id, !room.hasAccess)}
                        >
                          <i className="bi bi-door-open me-1"></i>
                          {room.hasAccess ? 'Enter Room' : 'Join Room'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateForm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Room</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateForm(false)}></button>
              </div>
              <form onSubmit={handleCreateRoom}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Room Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                      placeholder="Enter room name"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={createForm.description}
                      onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                      placeholder="Optional room description"
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Room Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                      placeholder="Enter room password"
                      required
                    />
                    <div className="form-text">
                      This password will be required for new members to access the room.
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Room
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Enter Room Password</h5>
                <button type="button" className="btn-close" onClick={() => setShowJoinModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>This is your first time accessing this room. Please enter the room password.</p>
                <div className="mb-3">
                  <label className="form-label">Room Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={joinForm.password}
                    onChange={(e) => setJoinForm({...joinForm, password: e.target.value})}
                    placeholder="Enter room password"
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom(joinForm.roomId)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowJoinModal(false)}>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => handleJoinRoom(joinForm.roomId)}
                  disabled={!joinForm.password}
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomDashboard;
