import { Link } from 'react-router-dom';

function LoginPage() {
  return (
    <section className="auth-section">
      <div className="auth-card">
        <h2>Welcome back</h2>
        <p>Sign in to manage your trips and bookings.</p>

        <form className="auth-form">
          <label>
            Email
            <input type="email" placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="Enter your password" />
          </label>
          <button type="submit" className="btn btn-primary full-width">
            Login
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </section>
  );
}

export default LoginPage;
