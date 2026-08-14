function TripPlannerPage() {
  return (
    <section className="section page-section">
      <div className="container planner-layout">
        <div className="planner-box">
          <span className="eyebrow">Trip planner</span>
          <h2>Build a custom itinerary</h2>

          <form className="planner-form">
            <label>
              Destination
              <input type="text" placeholder="e.g. Bali" />
            </label>
            <label>
              Budget
              <input type="text" placeholder="$1500" />
            </label>
            <label>
              Travel dates
              <input type="text" placeholder="12 Aug - 20 Aug" />
            </label>
            <label>
              Interests
              <textarea placeholder="Beach, food, hiking, culture..." rows="4" />
            </label>
            <button type="submit" className="btn btn-primary">Create itinerary</button>
          </form>
        </div>

        <div className="planner-summary">
          <h3>Sample itinerary</h3>
          <ul>
            <li><strong>Day 1:</strong> Arrival and city welcome dinner</li>
            <li><strong>Day 2:</strong> Beach club and sunset cruise</li>
            <li><strong>Day 3:</strong> Guided cultural tour</li>
            <li><strong>Day 4:</strong> Spa and free leisure time</li>
            <li><strong>Day 5:</strong> Adventure excursion</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default TripPlannerPage;
