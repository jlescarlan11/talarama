// app/diaries/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import Image from "next/image";

export default function NewDiaryPage() {
  const router = useRouter();
  const [rating, setRating] = useState(3);
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-black/60 backdrop-blur flex items-center justify-center px-4">
      <div className="bg-white rounded-xl p-8 max-w-4xl w-full shadow-xl relative">
        {/* Back Link */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 text-purple-700 font-semibold"
        >
          ✕
        </button>

        {/* Header */}
        <h1 className="text-2xl font-semibold text-purple-800 mb-6">
          Add to your films...
        </h1>

        {/* Form grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Inputs */}
          <div className="md:col-span-2 space-y-4">
           {/* Row with Movie Title and Date */}
<div className="flex gap-4">
  {/* Movie Title Input */}
  <div className="relative flex-1">
    <input
      type="text"
      placeholder="Enter Movie Name..."
      className="w-full border rounded-md py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500"
    />
    <FiSearch className="absolute right-3 top-2.5 text-purple-700" />
  </div>

  {/* Date Picker */}
  <div className="w-48">
    <select className="w-full border rounded-md py-2 px-4 text-gray-700">
      <option>24 May 2025</option>
    </select>
  </div>
</div>


            {/* Review Text Area */}
            <textarea
              placeholder="Add a Review..."
              className="w-full border rounded-md p-4 h-64 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {/* Star Rating */}
            <div className="space-y-1">
              <label className="text-gray-700 font-semibold">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`cursor-pointer w-6 h-6 ${
                      (hover || rating) >= star ? "text-orange-400" : "text-gray-300"
                    }`}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Poster Preview */}
          <div className="border border-dashed border-purple-300 flex items-center justify-center aspect-[2/3] rounded-md text-purple-500 text-center">
            <p>(Movie Poster)</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button className="bg-purple-700 text-white px-6 py-2 rounded-md hover:bg-purple-800 transition">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
