"use client";

const NewMovieModal = () => {
  return (
    <>
      <input type="checkbox" id="new-movie-modal" className="modal-toggle" />
      <dialog className="modal modal-bottom sm:modal-middle">
        <div className="modal-box space-y-2 ">
          <div className="flex justify-center">
            <p className="">Create New Movie</p>
          </div>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Title</legend>
            <input type="text" placeholder="" className="w-full input" />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Description</legend>
            <textarea
              className="textarea w-full h-24 "
              placeholder=""
            ></textarea>
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Year Released</legend>
            <input
              type="number"
              placeholder=""
              className="w-full input input-md "
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Duration</legend>
            <input
              type="number"
              placeholder=""
              className="w-full input input-md "
            />
            <p className="label">In minutes</p>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Poster Url</legend>
            <input
              type="url"
              placeholder=""
              className="w-full input input-md "
            />
          </fieldset>

          <fieldset className="fieldset flex">
            <legend className="fieldset-legend">Director</legend>
            <div>
              <input
                type="text"
                placeholder=""
                className="w-full input input-md "
              />
              <p className="label">First Name</p>
            </div>
            <div>
              <input
                type="text"
                placeholder=""
                className="w-full input input-md "
              />
              <p className="label">Last Name</p>
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Genre/s</legend>
            <input type="text" placeholder="" className="w-full input" />
            <p className="label">Separated by a comma</p>
          </fieldset>

          <div className="modal-action">
            <button className="btn btn-soft">Submit</button>
            <label htmlFor="new-movie-modal" className="btn btn-outline">
              Close
            </label>
          </div>
        </div>
      </dialog>
    </>
  );
};

export default NewMovieModal;
