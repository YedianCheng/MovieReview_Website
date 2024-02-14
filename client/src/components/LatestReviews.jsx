import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../style/latestReviews.css';

const LatestReviews = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/reviews?limit=4`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const reviewsWithExpandedState = data.map(review => ({ ...review, isExpanded: false }));
        setReviews(reviewsWithExpandedState);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchReviews();
  }, []);
  const toggleReviewContent = id => {
    setReviews(reviews.map(review => {
      if (review.id === id) {
        return { ...review, isExpanded: !review.isExpanded };
      }
      return review;
    }));
  };

  return (
    <div className="reviews-container">
      <h2>Latest Movie Reviews</h2>
      <div className="cards">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <div className="card" key={review.id}>
              <Link to={`/details/moviedetails/${review.movieExternalId}`}>
                <img src={review.movieImage} alt={review.movieName} />
              </Link>
              <div className="card-content">
                <Link to={`/details/reviewdetails/${review.id}`}>
                  <h3>{review.title}</h3>
                </Link>
                <p>Movie: <Link to={`/details/moviedetails/${review.movieExternalId}`}>
                  {review.movieName}</Link></p>
                <p>Reviewed by: {review.userName}</p>
                <p>
                  {review.isExpanded ? review.content : `${review.content.substring(0, 100)}...`}
                  <button onClick={() => toggleReviewContent(review.id)}>
                    {review.isExpanded ? 'Less' : 'More'}
                  </button>
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>No reviews available.</p>
        )}
      </div>
    </div>
  );
};

export default LatestReviews;
