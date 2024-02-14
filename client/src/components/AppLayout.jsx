import "../style/appLayout.css";

import { Outlet, Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function AppLayout() {
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();

  const signUp = () => loginWithRedirect({ screen_hint: "signup" });

  const logoutWithRedirect = () =>
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });

  return (
    <div className="app">
      <div className="title">
        <h1>Movie Review App</h1>
      </div>
      <div className="header">
        <nav className="menu">
          <ul className="menu-list">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/search">Search</Link>
            </li>
            {isAuthenticated && (
              <li>
                <Link to="/profile">Profile</Link>
              </li>
            )}
            {isAuthenticated && (
              <li>
                <Link to="/debugger">Auth Debugger</Link>
              </li>
            )}
            {!isAuthenticated && (
              <li>
                <button className="btn-primary" onClick={loginWithRedirect}>
                  Login
                </button>
              </li>
            )}
            {!isAuthenticated && (
              <li>
                <button className="btn-secondary" onClick={signUp}>
                  Create Account
                </button>
              </li>
            )}
            {isAuthenticated && (
              <li>
                <button className="exit-button" onClick={logoutWithRedirect}>
                  LogOut
                </button>
              </li>
            )}
          </ul>
        </nav>
        <div className="header-right">
          {isAuthenticated && (
            <div className="welcome-message">Welcome 👋 {user.email}</div>
          )}
        </div>
      </div>
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}