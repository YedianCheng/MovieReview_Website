import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuthToken } from "../AuthTokenContext";
import { useAuth0 } from "@auth0/auth0-react";
import formatDate from "../utils/utils";
import "../style/movieDetails.css";

export default function MovieDetails() {
  const { movieId } = useParams();
  const { isAuthenticated } = useAuth0();
  const { accessToken } = useAuthToken();
  const [movieDetails, setMovieDetails] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [review, setReview] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [userReviews, setUserReviews] = useState([]);

  useEffect(() => {
    const fetchIsMovieFavorite = async () => {
      if (isAuthenticated) {
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
            const isMovieFavorite = data.some(
              (movie) => movie.movieExternalId === movieId
            );
            setIsFavorite(isMovieFavorite);
          } else {
            console.error(
              "Error fetching favorite movies:",
              response.statusText
            );
          }
        } catch (error) {
          console.error("Error fetching favorite movies:", error);
        }
      }
    };
    if (accessToken) {
      fetchIsMovieFavorite();
    }
  }, [movieId, isAuthenticated, accessToken]);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const options = {
          method: "GET",
          url: "https://imdb188.p.rapidapi.com/api/v1/searchIMDB",
          params: {
            query: movieId,
          },
          headers: {
            "X-RapidAPI-Key":
              "78900685bdmsh2766c3b1a467c7ap16d250jsn1c0b4d88ed95",
            "X-RapidAPI-Host": "imdb188.p.rapidapi.com",
          },
        };
        const response = await axios.request(options);
        setMovieDetails(response.data.data[0]);
      } catch (error) {
        console.error("Error fetching movie details:", error);
      }
    };
    fetchMovieDetails();
  }, [movieId]);

  const handleFavoriteToggle = async () => {
    // Check if the user is authenticated before updating the state
    if (isAuthenticated) {
      try {
        const method = isFavorite ? "DELETE" : "POST";

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/favorite-movie/${movieId}`,
          {
            method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(
            `Failed to ${
              isFavorite ? "remove" : "add"
            } movie to favorites: ${errorMessage}`
          );
        }

        setIsFavorite(!isFavorite);
      } catch (error) {
        console.error("Error toggling favorite:", error);
      }
    } else {
      // Handle case when the user is not authenticated, e.g., show a login modal
      alert("Please login to add to favorites");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    // Check if the user is authenticated before updating the state
    if (isAuthenticated) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/submit-review/${movieId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`, // Include your authentication token if needed
            },
            body: JSON.stringify({
              title: reviewTitle,
              content: review,
            }),
          }
        );
        if (!response.ok) {
          throw new Error("Error submitting review");
        }

        // Assuming the server returns the newly added review in the response
        const newReview = await response.json();
        console.log("newReview", newReview);

        // Update the local state immediately with the new review
        setUserReviews([...userReviews, newReview]);

        // Reset review form
        setReviewTitle("");
        setReview("");

        alert("Review submitted successfully");
      } catch (error) {
        console.error("Error submitting review:", error);
      }
    } else {
      alert("Please login to add a review");
    }
  };

  useEffect(() => {
    const fetchUserReviews = async () => {
      try {
        // Assuming your backend provides an endpoint to fetch other user reviews
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/movie-reviews/${movieId}`
        );

        if (response.status === 404) {
          // Movie has no reviews yet
          setUserReviews([]);
        } else if (!response.ok) {
          throw new Error(
            `Failed to fetch other user reviews: ${response.statusText}`
          );
        } else {
          const data = await response.json();
          setUserReviews(data);
        }
      } catch (error) {
        console.error("Error fetching other user reviews:", error);
      }
    };
    fetchUserReviews();
  }, [movieId, userReviews]);

  if (!movieDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Movie Details</h1>
      <div>
        < img src={movieDetails.image} alt={movieDetails.title} width="300" />
      </div>
      <div>
        <p>🎬 Name: {movieDetails.title}</p >
      </div>
      <div>
        <p>🗓️ Year: {movieDetails.year}</p >
      </div>
      <div>
        <p>✨ Stars: {movieDetails.stars}</p >
      </div>
      <div>
        {isFavorite && <p>💕 My Favorite</p >}
        <button onClick={handleFavoriteToggle}>
          {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        </button>
      </div>
      <br />
      <div>
        <form className="review-form" onSubmit={handleReviewSubmit}>
          <label>
            <h3>Write your review</h3>
            <div>Title :</div>
            <textarea
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              style={{
                width: "500px",
                height: "20px",
                padding: "3px",
                resize: "none",
                textAlign: "left",
              }}
              required
            />
            <br />
            <br />
            <div>Content :</div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              style={{
                width: "500px",
                height: "100px",
                padding: "10px",
                resize: "none",
                textAlign: "left",
              }}
              required
            />
          </label>
          <br />
          <button type="submit">Submit Review</button>
        </form>
      </div>
      <div>
        <h3>User Reviews:</h3>
        <ul>
          {userReviews.map((userReview, index) => (
            <li key={index} className="review-container">
              <Link to={`/details/reviewdetails/${userReview.id}`}>
                Title: {userReview.title}
              </Link>
              <br />
              Content: {userReview.content}
              <p>Created At: {formatDate(userReview.createdAt)}</p >
              <p>Updated At: {formatDate(userReview.updatedAt)}</p >
              <p>User Name: {userReview.userName}</p >
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}