import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SearchForm() {
  const [title, setTitle] = useState("");
  const [movies, setMovies] = useState([]);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const navigate = useNavigate();

  const options = {
    method: "GET",
    url: "https://imdb188.p.rapidapi.com/api/v1/searchIMDB",
    params: {
      query: title.replace(/\s+/g, ""),
    },
    headers: {
      "X-RapidAPI-Key": "78900685bdmsh2766c3b1a467c7ap16d250jsn1c0b4d88ed95",
      "X-RapidAPI-Host": "imdb188.p.rapidapi.com",
    },
  };

  const getMovies = async () => {
    try {
      const response = await axios.request(options);

      if (response.data.data) {
        if (response.data.data.length === 0) {
          navigate("/search");
          setMovies([]);
        } else {
          const searchResults = encodeURIComponent(
            JSON.stringify(response.data.data)
          );
          navigate(`/search/${title}?results=${searchResults}`);
        }
        setMovies(response.data.data);
      } else {
        navigate("/search");
        setMovies([]);
      }
      setFormSubmitted(true);
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  };

  function handleSubmit(e) {
    e.preventDefault();
    getMovies();
  }
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <button type="submit">Search</button>
      </form>
      <br></br>
      {formSubmitted && movies.length === 0 && (
        <div>Sorry 😢 Movie Not Found</div>
      )}
    </div>
  );
}