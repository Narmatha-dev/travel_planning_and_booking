import { destinations } from '../services/travelData';

function DestinationsPage() {
  return (
    <section className="section page-section">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">Explore destinations</span>
          <h2>Choose your dream location</h2>
        </div>

        <div className="card-grid">
          {destinations.map((place) => (
            <article key={place.id} className="destination-card large-card">
              <img src={place.image} alt={place.name} />
              <div className="card-body">
                <div className="card-topline">
                  <h3>{place.name}</h3>
                  <span>{place.rating} ★</span>
                </div>
                <p>{place.description}</p>
                <div className="card-meta">
                  <span>{place.country}</span>
                  <strong>{place.price}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default DestinationsPage;
