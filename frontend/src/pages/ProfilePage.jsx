import { useAppContext } from '../context/AppContext';

function ProfilePage() {
  const { user } = useAppContext();

  return (
    <section className="section page-section">
      <div className="container profile-layout">
        <div className="profile-card">
          <div className="profile-avatar">AC</div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <small>Member since {user.memberSince}</small>
        </div>

        <div className="profile-details">
          <h3>Traveler preferences</h3>
          <ul>
            <li>Favorite style: Beach + cultural tours</li>
            <li>Preferred budget: Mid-range luxury</li>
            <li>Typical trip length: 5-7 days</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
