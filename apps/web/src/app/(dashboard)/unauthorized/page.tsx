import React from 'react';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold text-red-600 mb-4">403 Forbidden</h1>
      <p className="text-zinc-600 max-w-md">
        You do not have the required permissions to view this section of the application. 
        If you believe this is an error, please contact your system administrator.
      </p>
    </div>
  );
}
