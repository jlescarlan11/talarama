'use client';

import React from 'react';
import ErrorBoundary from './ErrorBoundary';

interface ClientErrorBoundaryProps {
  children: React.ReactNode;
}

const ClientErrorBoundary: React.FC<ClientErrorBoundaryProps> = ({ children }) => {
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default ClientErrorBoundary; 