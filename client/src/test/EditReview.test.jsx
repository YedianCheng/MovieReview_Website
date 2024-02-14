import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import EditReview from "../components/EditReview";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthToken } from "../AuthTokenContext";

jest.mock("@auth0/auth0-react", () => ({
  useAuth0: jest.fn(),
}));
jest.mock("react-router-dom", () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));
jest.mock("../AuthTokenContext", () => ({
  useAuthToken: jest.fn(),
}));

const mockLoginWithRedirect = jest.fn();
const mockNavigate = jest.fn();
window.alert = jest.fn();

describe("EditReview", () => {
  beforeEach(() => {
    // Mock the Auth0 hook and make it return a logged in state
    useAuth0.mockReturnValue({
      isAuthenticated: true,
      user: { name: "test user" },
      loginWithRedirect: mockLoginWithRedirect,
    });
    // Mock the AuthTokenContext hook and make it return a valid access token
    useAuthToken.mockReturnValue({
      accessToken: "mock_access_token",
    });
    // Mock the useParams and useNavigate hooks
    useParams.mockReturnValue({ reviewId: "123" });
    useNavigate.mockReturnValue(mockNavigate);
    // Mock the fetch API
    global.fetch = jest.fn().mockImplementation((url, options) => {
      if (url.endsWith("reviewdetails/123")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              title: "Original Title",
              content: "Original content",
            }),
          ok: true,
        });
      } else if (
        url.endsWith(`update-review/123`) &&
        options.method === "PUT"
      ) {
        return Promise.resolve({ ok: true });
      }
      return Promise.reject(new Error("unknown url"));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders EditReview component", async () => {
    render(<EditReview />);
    await screen.findByText("Edit Review");
  });

  test("renders EditReview component with fetched data", async () => {
    render(<EditReview />);
    await Promise.all([
      waitFor(() => {
        expect(screen.getByText("Edit Review")).toBeInTheDocument();
      }),

      waitFor(() => {
        expect(screen.getByDisplayValue("Original Title")).toBeInTheDocument();
      }),

      waitFor(() => {
        expect(
          screen.getByDisplayValue("Original content")
        ).toBeInTheDocument();
      }),
    ]);
  });

  test("allows editing and submitting a review", async () => {
    render(<EditReview />);

    const titleTextarea = screen.getByLabelText("Title:");
    fireEvent.change(titleTextarea, { target: { value: "New Title" } });

    const contentTextarea = screen.getByLabelText("Content:");
    fireEvent.change(contentTextarea, { target: { value: "New content" } });

    const submitButton = screen.getByRole("button", { name: /submit review/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ title: "New Title", content: "New content" }),
        })
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/profile");
    });
  });
});