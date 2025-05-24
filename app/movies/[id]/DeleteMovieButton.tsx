"use client";
import { Spinner } from "@/app/components";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const DeleteMovieButton = ({ movieId }: { movieId: string }) => {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const deleteMovie = async () => {
    try {
      setIsDeleting(true);
      await axios.delete("/api/movies/" + movieId);
      router.push("/movies");
    } catch (error) {
      console.error("Unexpected error occurred:", error);
      setError(true);
    } finally {
      setIsDeleting(false);
      setIsConfirmModalOpen(false);
    }
  };

  return (
    <>
      {/* Delete Movie Trigger Button */}
      <button
        onClick={() => setIsConfirmModalOpen(true)}
        className="btn btn-warning"
      >
        Delete Movie
      </button>

      {/* Confirm Deletion Modal */}
      {isConfirmModalOpen && (
        <div className="modal modal-open" role="dialog">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Confirm Deletion</h3>
            <p className="py-4">
              Are you sure you want to delete this movie? This action cannot be
              undone.
            </p>
            <div className="modal-action flex justify-end gap-2">
              <button
                className="btn"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancel
              </button>
              <button
                onClick={deleteMovie}
                disabled={isDeleting}
                className="btn btn-warning"
              >
                {isDeleting ? (
                  <>
                    Deleting <Spinner />
                  </>
                ) : (
                  "Delete Movie"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {error && (
        <div className="modal modal-open" role="dialog">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Error</h3>
            <p className="py-4">This movie could not be deleted.</p>
            <div className="modal-action">
              <button className="btn" onClick={() => setError(false)}>
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteMovieButton;
