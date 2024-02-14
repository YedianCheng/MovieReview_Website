import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import pkg from "@prisma/client";
import morgan from "morgan";
import cors from "cors";
import axios from "axios";
import { auth } from "express-oauth2-jwt-bearer";

// this is a middleware that will validate the access token sent by the client
const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  tokenSigningAlg: "RS256",
});

const fetchMovieData = async (movieId) => {
  try {
    const options = {
      method: "GET",
      url: "https://imdb188.p.rapidapi.com/api/v1/searchIMDB",
      params: {
        query: movieId,
      },
      headers: {
        "X-RapidAPI-Key": "78900685bdmsh2766c3b1a467c7ap16d250jsn1c0b4d88ed95",
        "X-RapidAPI-Host": "imdb188.p.rapidapi.com",
      },
    };
    const response = await axios.request(options);
    const data = response.data.data[0];

    const movieData = {
      title: data.title,
      year: data.year,
      stars: data.stars,
      type: data.type,
      image: data.image,
    };

    return movieData;
  } catch (error) {
    console.error("Error fetching movie data:", error);
  }
};

const addMovieToDatabase = async (movieId) => {
  const existingMovie = await prisma.movie.findFirst({
    where: {
      externalId: movieId,
    },
  });

  let movie;

  if (!existingMovie) {
    const movieData = await fetchMovieData(movieId);

    movie = await prisma.movie.create({
      data: {
        externalId: movieId,
        title: movieData.title,
        year: movieData.year,
        stars: movieData.stars,
        image: movieData.image,
      },
    });
  } else {
    movie = existingMovie;
  }

  return movie;
};

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// this is a public endpoint because it doesn't have the requireAuth middleware
app.get("/ping", (req, res) => {
  res.send("pong");
});

app.get("/", (req, res) => {
  res.send("Welcome to the homepage!");
});

// this endpoint is used by the client to verify the user status and to make sure the user is registered in our database once they signup with Auth0
// if not registered in our database we will create it.
// if the user is already registered we will return the user information
app.post("/verify-user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const email = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/email`];
  const name = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/name`];

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  if (user) {
    res.json(user);
  } else {
    const newUser = await prisma.user.create({
      data: {
        email,
        auth0Id,
        name,
      },
    });

    res.json(newUser);
  }
});

// this endpoint is used to create a new movie review
app.post("/submit-review/:movieId", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const reviewTitle = req.body.title;
  const reviewContent = req.body.content;
  const movieId = req.params.movieId;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Check if the movie is already in the database
  const movieToReview = await addMovieToDatabase(movieId);

  if (!reviewTitle || !reviewContent) {
    return res.status(400).json({ error: "Title, Content are required" });
  }

  try {
    const newReview = await prisma.movieReview.create({
      data: {
        title: reviewTitle,
        content: reviewContent,
        userId: user.id,
        movieId: movieToReview.id,
      },
    });
    res.json(newReview);
  } catch (error) {
    res
      .status(500)
      .json({ error: `Failed to create movie review: ${error.message}` });
  }
});

// this endpoint is used to update a movie review
app.delete("/delete-review/:reviewId", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const reviewId = req.params.reviewId;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  try {
    const reviewToDelete = await prisma.movieReview.findUnique({
      where: {
        id: parseInt(reviewId),
      },
    });

    if (!reviewToDelete) {
      return res.status(404).json({ message: "Review not found" });
    }

    await prisma.movieReview.delete({
      where: {
        id: reviewToDelete.id,
      },
    });

    res.json(reviewToDelete);
  } catch (error) {
    res
      .status(500)
      .json({ error: `Failed to delete review: ${error.message}` });
  }
} );

// this endpoint is used to update a movie review
app.put("/update-review/:reviewId", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const reviewId = req.params.reviewId;
  const reviewTitle = req.body.title;
  const reviewContent = req.body.content;
  
  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  try {
    const reviewToUpdate = await prisma.movieReview.findUnique({
      where: {
        id: parseInt(reviewId),
      },
    });

    if (!reviewToUpdate) {
      return res.status(404).json({ message: "Review not found" });
    }

    const updatedReview = await prisma.movieReview.update({
      where: {
        id: reviewToUpdate.id,
      },
      data: {
        title: reviewTitle,
        content: reviewContent,
      },
    });

    res.json(updatedReview);
  } catch (error) {
    res
      .status(500)
      .json({ error: `Failed to update review: ${error.message}` });
  }
} );

// this endpoint is used to fetch a specific review from the database
app.get("/details/reviewdetails/:reviewId", async (req, res) => {
  const reviewId = parseInt(req.params.reviewId);

  try {
    const review = await prisma.movieReview.findUnique({
      where: {
        id: reviewId,
      },
      include: {
        user: true,
        movie: true,
      },
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const formattedReview = {
      id: review.id,
      title: review.title,
      content: review.content,
      movieName: review.movie.title,
      movieImage: review.movie.image,
      userName: review.user.name || review.user.email,
      userCreatedAt:review.createdAt,
    };

    res.json(formattedReview);
  } catch (error) {
    res.status(500).json({ message: "Error fetching review" });
  }
} );

// this endpoint is used to fetch all the reviews from the database
app.get("/reviews", async (req, res) => {
  const limit = parseInt(req.query.limit) || 4;

  try {
    const reviews = await prisma.movieReview.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        movie: true,
      },
    });

    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      title: review.title,
      content: review.content,
      movieName: review.movie.title,
      movieImage: review.movie.image,
      userName: review.user.name || review.user.email,
      movieExternalId: review.movie.externalId, 
    }));

    res.json(formattedReviews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reviews" });
  }
});


// this endpoint is used to post a new favorite movie to the database
app.post("/favorite-movie/:movieId", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const movieId = req.params.movieId;
  try {
    const user = await prisma.user.findUnique({
      where: {
        auth0Id,
      },
      include: {
        favoriteMovies: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Check if the movie is already in the database
    const movieToAdd = await addMovieToDatabase(movieId);

    // Check if the movie is already in the user's favorites
    const movieExistsInFavorites = user.favoriteMovies.some(
      (movie) => movie.id === movieToAdd.id
    );

    if (movieExistsInFavorites) {
      return res.status(400).json({ message: "Movie already in favorites" });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        favoriteMovies: {
          connect: {
            id: movieToAdd.id,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Movie added to favorites successfully",
      data: {
        movie: {
          id: movieToAdd.id,
          title: movieToAdd.title,
          year: movieToAdd.year,
          stars: movieToAdd.stars,
          image: movieToAdd.image,
        },
        user: {
          id: updatedUser.id,
          favoriteMovies: updatedUser.favoriteMovies,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to add movie to favorites. Please try again later.",
    });
  }
});

// this endpoint is used to fetch all the user's favorite movies from the database
app.get("/favorite-movies", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
    include: {
      favoriteMovies: true,
    },
  });

  if (!user || !user.favoriteMovies) {
    return res
      .status(404)
      .json({ message: "User or favorite movies not found" });
  }

  try {
    const formattedFavorites = user.favoriteMovies.map((movie) => ({
      movieId: movie.id,
      movieExternalId: movie.externalId,
      title: movie.title,
      image: movie.image,
    }));

    res.json(formattedFavorites);
  } catch (error) {
    res.status(500).json({ message: "Error fetching favorites" });
  }
});

// this endpoint is used to delete a favorite movie from the database
app.delete("/favorite-movie/:movieId", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const movieId = req.params.movieId;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
    include: {
      favoriteMovies: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  try {
    const movieToDelete = user.favoriteMovies.find(
      (movie) => movie.externalId === movieId
    );

    if (!movieToDelete) {
      return res
        .status(404)
        .json({ message: "Movie not found in user's favorites" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        favoriteMovies: {
          disconnect: [{ id: movieToDelete.id }],
        },
      },
    });

    res.json(movieToDelete);
  } catch (error) {
    res
      .status(500)
      .json({ error: `Failed to delete favorite: ${error.message}` });
  }
});

// this endpoint is used to fetch all reviews for a specific movie
app.get("/movie-reviews/:movieId", async (req, res) => {
  const movieExternalId = req.params.movieId;

  try {
    // check if the movie is already in the database
    const existingMovie = await prisma.movie.findFirst({
      where: {
        externalId: movieExternalId,
      },
    });

    if (existingMovie) {
      const movieId = existingMovie.id;

      const movieReviews = await prisma.movieReview.findMany({
        where: {
          movieId,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: true,
          movie: true,
        },
      });

      const formattedReviews = movieReviews.map((review) => ({
        id: review.id,
        title: review.title,
        content: review.content,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        movieName: review.movie.title,
        movieImage: review.movie.image,
        userName: review.user.name || review.user.email,
      }));

      res.json(formattedReviews);
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

// this endpoint is used to fetch all reviews for a specific user
app.get("/user-reviews", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
    include: {
      movieReviews: {
        include: {
          movie: true,
        },
      },
    },
  });

  console.log(user);

  if (!user || !user.movieReviews) {
    return res.status(404).json({ message: "User or reviews not found" });
  }

  try {
    const formattedReviews = user.movieReviews.map((review) => ({
      id: review.id,
      title: review.title,
      content: review.content,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      movieName: review.movie.title,
      movieImage: review.movie.image,
      userName: user.name || user.email,
    }));

    res.json(formattedReviews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

// this endpoint is used to get user profile
app.get("/user-profile", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  try {
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user" });
  }
});

// this endpoint is used to update user profile
app.patch("/user-profile", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const { name } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating user" });
  }
});

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
 console.log(`Server running on http://localhost:${PORT} 🎉 🚀`);
});
