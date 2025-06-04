import React from 'react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  retry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  title = 'Something went wrong', 
  message, 
  retry 
}) => {
  return (
    <div 
      className="flex flex-col items-center justify-center p-8 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="text-red-500 mb-4">
        <svg 
          className="w-12 h-12 mx-auto" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600 mb-4">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="btn btn-primary"
          aria-label="Retry operation"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
