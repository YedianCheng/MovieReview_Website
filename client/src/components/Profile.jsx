import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuthToken } from "../AuthTokenContext";
import { Link, useNavigate } from "react-router-dom";
import formatDate from "../utils/utils";
import "../style/profile.css";

export default function Profile() {
  const { user, isAuthenticated } = useAuth0();
  const { accessToken } = useAuthToken();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || "");
  const [userFavorites, setUserFavorites] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setEditedName(user?.name || "");
  }, [user]);

  const updateReview = (reviewId) => {
    navigate(`/update-review/${reviewId}`);
  };

  const deleteReview = async (reviewId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/delete-review/${reviewId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      alert("Review deleted successfully");
      setUserReviews((currentReviews) =>
        currentReviews.filter((review) => review.id !== reviewId)
      );
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Error deleting review");
    }
  };

  useEffect(() => {
    setEditedName(user?.name || "");
  }, [user]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    try {
      if (!editedName.trim()) {
        alert("Name cannot be empty");
        return;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/user-profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ name: editedName }),
        }
      );

      if (response.ok) {
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
    }
    setIsEditing(false);
  };

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/user-profile`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setEditedName(data.name);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    if (accessToken) {
      fetchUserName();
    }
  }, [accessToken]);

  useEffect(() => {
    const fetchUserFavorites = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/favorite-movies`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setUserFavorites(data);
        }
      } catch (error) {
        console.error("Error fetching user favorites:", error);
      }
    };
    if (accessToken) {
      fetchUserFavorites();
    }
  }, [accessToken]);

  useEffect(() => {
    const fetchUserReviews = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/user-reviews`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          const sortedReviews = data.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          );
          setUserReviews(sortedReviews);
        }
      } catch (error) {
        console.error("Error fetching user reviews:", error);
      }
    };
    if (accessToken) {
      fetchUserReviews();
    }
  }, [accessToken]);

  // Check if user is not defined or not authenticated
  if (!isAuthenticated || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>
        {isEditing ? (
          <div>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              required
            />
            <button onClick={handleSaveClick}>Save</button>
          </div>
        ) : (
          <div>
            <p>Name: {editedName}</p >
            <button onClick={handleEditClick}>Edit name</button>
          </div>
        )}
      </div>
      <br />
      <div>
        < img src={user.picture} width="70" alt="profile avatar" />
      </div>
      <div>
        <p>📧 Email: {user.email}</p >
      </div>
      <div>
        <p>🔑 Auth0Id: {user.sub}</p >
      </div>
      <div>
        <p>✅ Email verified: {user.email_verified?.toString()}</p >
      </div>
      <br />
      <h3>My Favorite Movies:</h3>
      <ul>
        {userFavorites.map((movie) => {
          return (
            <li key={movie.movieId} className="favorite-movies-container">
              < img src={movie.image} alt={movie.title} width="100" />
              <Link
                to={`/details/moviedetails/${movie.movieExternalId}`}
                target="_blank"
              >
                {movie.title}
              </Link>
            </li>
          );
        })}
      </ul>
      <br />
      <h3>My Reviews:</h3>
      <ul>
        {userReviews.map((userReview, index) => (
          <li key={index} className="review-container">
            Title:{" "}
            <Link to={`/details/reviewdetails/${userReview.id}`}>
              {userReview.title}
            </Link>
            <br />
            Content: {userReview.content}
            <p>Created At: {formatDate(userReview.createdAt)}</p >
            <p>Updated At: {formatDate(userReview.updatedAt)}</p >
            <p>Movie Name: {userReview.movieName}</p >
            <p>User Name: {userReview.userName}</p >
            <button
              onClick={() => deleteReview(userReview.id)}
              style={{ marginRight: "10px" }}
            >
              Delete
            </button>
            <button onClick={() => updateReview(userReview.id)}>Edit</button>
          </li>
        ))}
      </ul>
    </div>
  );
}