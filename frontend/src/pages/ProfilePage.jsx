import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

function ProfilePage() {
  const { user, logout, updateUserProfile } = useAppContext();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: user?.full_name || user?.name || '',
    phoneNumber: user?.phone_number || '',
    address: user?.address || '',
    bio: user?.bio || '',
  });
  const [saveStatus, setSaveStatus] = useState({ loading: false, error: '', success: false });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
    if (saveStatus.error || saveStatus.success) {
      setSaveStatus({ loading: false, error: '', success: false });
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveStatus({ loading: true, error: '', success: false });

    const res = await updateUserProfile(editData);
    if (res.success) {
      setSaveStatus({ loading: false, error: '', success: true });
      setIsEditing(false);
    } else {
      setSaveStatus({ loading: false, error: res.message || 'Failed to update', success: false });
    }
  };

  if (!user) {
    return (
      <section className="section page-section container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Session Not Found</h2>
        <p>Please log in to view your profile.</p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>Sign In</Link>
      </section>
    );
  }

  const initials = (user.full_name || user.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <section className="section page-section">
      <div className="container profile-layout">
        {/* Profile Card */}
        <div className="profile-card" style={{ position: 'relative' }}>
          <div className="profile-avatar" style={{ overflow: 'hidden' }}>
            {user.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt={user.full_name || user.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              initials
            )}
          </div>
          <h2>{user.full_name || user.name}</h2>
          <p style={{ color: '#64748b' }}>{user.email}</p>
          
          <div style={{ margin: '0.75rem 0' }}>
            <span style={{
              background: user.role === 'admin' ? '#fef3c7' : '#e0e7ff',
              color: user.role === 'admin' ? '#92400e' : '#3730a3',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {user.role || 'Traveler'}
            </span>
          </div>

          <small style={{ color: '#94a3b8' }}>
            Member since {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '2026'}
          </small>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
            <button
              className="btn btn-outline full-width"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel Edit' : '✏️ Edit Profile'}
            </button>
            <button
              className="btn full-width"
              style={{ background: '#fee2e2', color: '#991b1b', border: 'none' }}
              onClick={handleLogout}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>

        {/* Profile Details or Edit Form */}
        <div className="profile-details">
          {saveStatus.success && (
            <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
              ✔ Profile updated successfully!
            </div>
          )}

          {saveStatus.error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
              ⚠️ {saveStatus.error}
            </div>
          )}

          {isEditing ? (
            <div>
              <h3>Update Your Profile</h3>
              <form onSubmit={handleSaveProfile} style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label>
                    Full Name
                    <input
                      type="text"
                      name="fullName"
                      value={editData.fullName}
                      onChange={handleEditChange}
                      required
                    />
                  </label>

                  <label>
                    Phone Number
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={editData.phoneNumber}
                      onChange={handleEditChange}
                      placeholder="+1-555-0199"
                    />
                  </label>

                  <label>
                    Address
                    <input
                      type="text"
                      name="address"
                      value={editData.address}
                      onChange={handleEditChange}
                      placeholder="City, Country"
                    />
                  </label>

                  <label>
                    Bio / Travel Style
                    <textarea
                      name="bio"
                      value={editData.bio}
                      onChange={handleEditChange}
                      rows="3"
                      placeholder="Tell us about your travel passions..."
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </label>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={saveStatus.loading}>
                      {saveStatus.loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <h3>Account Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Phone Number</div>
                  <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{user.phone_number || 'Not provided'}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Location</div>
                  <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>{user.address || 'Not specified'}</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Account Status</div>
                  <div style={{ fontWeight: '600', color: '#16a34a', marginTop: '0.25rem' }}>Active Member</div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>About / Bio</h4>
                <p style={{ color: '#475569', fontStyle: user.bio ? 'normal' : 'italic' }}>
                  {user.bio || 'No bio added yet. Click "Edit Profile" to share your travel style!'}
                </p>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link to="/my-trips" className="btn btn-primary">
                  🧳 View My Trips
                </Link>
                <Link to="/trip-planner" className="btn btn-outline">
                  🗺️ Plan New Trip
                </Link>
                <Link to="/destinations" className="btn btn-outline">
                  🌴 Explore Destinations
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
