import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Home from "./components/Home";
import AuthDebugger from "./components/AuthDebugger";
import NotFound from "./components/NotFound";
import Profile from "./components/Profile";
import Search from "./components/Search";
import SearchResults from "./components/SearchResults";
import MovieDetails from "./components/MovieDetails";
import ReviewDetails from "./components/ReviewDetails";
import VerifyUser from "./components/VerifyUser";
import EditReview from "./components/EditReview";
import { Auth0Provider } from "@auth0/auth0-react";
import { AuthTokenProvider } from "./AuthTokenContext";
import "./style/index.css";

const container = document.getElementById("root");

const requestedScopes = ["profile", "email"];
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/verify-user`,
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: requestedScopes.join(" "),
      }}
    >
      <AuthTokenProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Home />} />
              <Route path="profile" element={<Profile />} />
              <Route path="search" element={<Search />} />
              <Route path="search/:criteria" element={<SearchResults />} />
              <Route path="debugger" element={<AuthDebugger />} />
              <Route
                path="details/moviedetails/:movieId"
                element={<MovieDetails />}
              />
              <Route
                path="details/reviewdetails/:reviewId"
                element={<ReviewDetails />}
              />
              <Route path="update-review/:reviewId" element={<EditReview />} />
            </Route>
            <Route path="/verify-user" element={<VerifyUser />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthTokenProvider>
    </Auth0Provider>
  </React.StrictMode>
);