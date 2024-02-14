import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; 
import '../style/reviewDetails.css'; 
import formatDate from '../utils/utils';

const ReviewDetails = () => {
  const { reviewId } = useParams(); 
  const [review, setReview] = useState(null);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/details/reviewdetails/${reviewId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setReview(data);
      } catch (error) {
        console.error('Error fetching review:', error);
      }
    };

    fetchReview();
  }, [reviewId]);

  if (!review) {
    return <p>Loading...</p>;
  }

  return (
    <div className="review-details">
      <div className="movie-image">
        <img src={review.movieImage} alt="movie poster" />
      </div>
    <div className="movie-info-card">
        <h1>{review.title}</h1>
        <div className="user-info">
          <p>Reviewd by: {review.userName}</p>
          <p>Created At: {formatDate(review.userCreatedAt)}</p>
        </div>
        <p>{review.content}</p>
        </div>   
    </div>
  );
};

export default ReviewDetails;
