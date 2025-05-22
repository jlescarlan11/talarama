"use client";
import { Spinner } from "@/app/components";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const DeleteMovieButton = ({ movieId }: { movieId: string }) => {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteMovie = async () => {
    try {
      setIsDeleting(true);
      await axios.delete("/api/movies/" + movieId);
      router.push("/movies");
    } catch (error) {
      setIsDeleting(false);
      setError(true);

      console.log("Unexpected error occur", error);
    }
  };

  return (
    <>
      {/* The button to open modal */}
      <label htmlFor="delete_modal" className="btn btn-warning ">
        Delete Movie
      </label>
      {/* Put this part before </body> tag */}
      <input type="checkbox" id="delete_modal" className="modal-toggle" />
      <div className="modal" role="dialog">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Confirm Deletion</h3>
          <p className="py-4">
            Are you sure you want to delete this movie? this action cannot be
            undone
          </p>
          <div className="modal-action">
            <label htmlFor="delete_modal" className="btn">
              Close
            </label>
          </div>
          <div className="modal-action">
            <label htmlFor="delete_modal" className="btn">
              <button
                onClick={deleteMovie}
                disabled={isDeleting}
                className="btn btn-warning"
              >
                Delete Movie {isDeleting && <Spinner />}
              </button>
            </label>
          </div>
        </div>

        <input
          type="checkbox"
          id="error_modal"
          className={`${error ? "modal-toggle" : ""}`}
        />
        <div className="modal-box">
          <h3 className="text-lg font-bold">Error</h3>
          <p className="py-4">This movie could not bedeleted.</p>
          <div className="modal-action">
            <label
              htmlFor="delete_modal"
              className="btn"
              onClick={() => setError(false)}
            >
              Okay
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteMovieButton;
