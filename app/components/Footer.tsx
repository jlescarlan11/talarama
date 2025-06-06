import React from "react";

const Footer = () => {
  return (
    <footer className="w-full py-6 sm:py-8 mt-auto bg-base-200 text-base-content border-t border-base-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm sm:text-base text-neutral-content">
              &copy; 2025 Talarama. A CMSC 127 Project.
            </p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-sm sm:text-base text-secondary-content">
              Built by Bisuela, Caringal, Dela Cruz, and Escarlan
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
