function BookingPage() {
  return (
    <section className="section page-section">
      <div className="container booking-layout">
        <div className="booking-card">
          <span className="eyebrow">Book your trip</span>
          <h2>Maldives Escape</h2>

          <div className="booking-summary">
            <div>
              <label>Travel dates</label>
              <p>12 Aug - 20 Aug</p>
            </div>
            <div>
              <label>Guests</label>
              <p>2 Adults</p>
            </div>
            <div>
              <label>Hotel</label>
              <p>Ocean View Resort</p>
            </div>
          </div>

          <form className="booking-form">
            <label>
              Full name
              <input type="text" placeholder="Your full name" />
            </label>
            <label>
              Contact email
              <input type="email" placeholder="you@example.com" />
            </label>
            <label>
              Notes
              <textarea rows="4" placeholder="Special requests or travel preferences" />
            </label>
            <button type="submit" className="btn btn-primary full-width">Confirm booking</button>
          </form>
        </div>

        <aside className="price-card">
          <h3>Price summary</h3>
          <div className="price-row">
            <span>Trip package</span>
            <strong>$1899</strong>
          </div>
          <div className="price-row">
            <span>Taxes & fees</span>
            <strong>$220</strong>
          </div>
          <div className="price-row total">
            <span>Total</span>
            <strong>$2119</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default BookingPage;
