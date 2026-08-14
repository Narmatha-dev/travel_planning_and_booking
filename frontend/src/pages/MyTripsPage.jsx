import { useAppContext } from '../context/AppContext';

function MyTripsPage() {
  const { trips } = useAppContext();

  return (
    <section className="section page-section">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">My trips</span>
          <h2>Your upcoming adventures</h2>
        </div>

        <div className="trip-list">
          {trips.map((trip) => (
            <div key={trip.id} className="trip-item">
              <div>
                <h3>{trip.destination}</h3>
                <p>{trip.date}</p>
              </div>
              <span className="trip-status">{trip.status}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MyTripsPage;
