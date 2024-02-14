import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import { useAuthToken } from "../AuthTokenContext";
import '../style/editReview.css';

const EditReview = () => {
  const [reviewTitle, setReviewTitle] = useState('');
  const [review, setReview] = useState('');
  const { reviewId } = useParams(); 
  const { accessToken } = useAuthToken();
  const navigate = useNavigate();

   
  useEffect(() => {
    // Fetch review data from API
    const fetchReview = async (id) => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/details/reviewdetails/${reviewId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const review = await response.json();
        setReviewTitle(review.title);
        setReview(review.content);
      } catch (error) {
        console.error('Error fetching review:', error);
      }
    };

    if (reviewId) {
      fetchReview(reviewId);
    }
  }, [reviewId]);

  // Update review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    try {
      const reviewData = {
        title: reviewTitle,
        content: review,
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/update-review/${reviewId}`, { 
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`, 
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      alert('Review updated successfully');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  return (
    <div className="edit-review-container">
      <h2>Edit Review</h2>
      <form onSubmit={handleReviewSubmit} className="review-form">
        <div className="form-group">
          <label htmlFor="reviewTitle"><h3>Title:</h3></label>
          <textarea
            className="title-textarea" 
            id="reviewTitle"
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="reviewContent"><h3>Content:</h3></label>
          <textarea
            className="content-textarea" 
            id="reviewContent"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            required
          />
        </div>
        <button type="submit">Submit Review</button>
      </form>
    </div>
  );
}

export default EditReview;
