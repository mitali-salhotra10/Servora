import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`rounded-md bg-red-50 border border-red-200 p-4 flex items-start justify-between ${className}`}
    >
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="text-sm text-red-800">{message}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700 ml-3 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 touch-target flex items-center justify-center"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
