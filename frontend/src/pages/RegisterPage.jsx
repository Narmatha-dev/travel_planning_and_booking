import { Link } from 'react-router-dom';

function RegisterPage() {
  return (
    <section className="auth-section">
      <div className="auth-card">
        <h2>Create account</h2>
        <p>Start planning your next adventure today.</p>

        <form className="auth-form">
          <label>
            Full name
            <input type="text" placeholder="Your name" />
          </label>
          <label>
            Email
            <input type="email" placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="Create a password" />
          </label>
          <button type="submit" className="btn btn-primary full-width">
            Register
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </section>
  );
}

export default RegisterPage;
