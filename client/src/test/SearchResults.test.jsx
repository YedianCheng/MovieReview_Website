import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import SearchResults from "../components/SearchResults";

describe("SearchResults", () => {
  test("renders search results correctly", () => {
    // Mock movies data
    const movies = [
      {
        id: "tt1234567",
        title: "Movie 1",
        image: "movie1.jpg",
      },
      {
        id: "tt7654321",
        title: "Movie 2",
        image: "movie2.jpg",
      },
    ];

    // Mock URLSearchParams
    jest
      .spyOn(URLSearchParams.prototype, "get")
      .mockReturnValueOnce(JSON.stringify(movies));

    render(
      <MemoryRouter initialEntries={["/search?results=test"]}>
        <SearchResults />
      </MemoryRouter>
    );

    // Check if the movie titles are rendered
    movies.forEach((movie) => {
      const movieTitle = screen.getByText(movie.title);
      expect(movieTitle).toBeInTheDocument();

      // Check if the movie images are rendered
      const movieImage = screen.getByAltText(movie.title);
      expect(movieImage).toHaveAttribute("src", movie.image);
    });
  });
});