import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../style/searchResults.css";

export default function SearchResults() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    // Parse the query parameters
    const params = new URLSearchParams(window.location.search);
    const searchResults = params.get("results");

    // Check if searchResults is present and not empty
    if (searchResults) {
      const parsedResults = JSON.parse(decodeURIComponent(searchResults));
      setMovies(parsedResults);
    }
  }, []);

  return (
    <div>
      <h1>Search Results</h1>
      <div className="search-results">
        {movies &&
          movies.map((movie) => (
            <div key={movie.id} className="movie-item">
              <img
                src={movie.image}
                alt={movie.title}
                className="movie-image"
              />
              <Link to={`/details/moviedetails/${movie.id}`} target="_blank">
                {movie.title}
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
}