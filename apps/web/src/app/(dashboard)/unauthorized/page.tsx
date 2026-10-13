import React from 'react';
import { StatusPage } from '@/components/StatusPage';

export default function UnauthorizedPage() {
  return (
    <StatusPage
      code="403 Forbidden"
      title="Access Denied"
      message="You don't have permission to view this section. If you believe this is an error, please contact your system administrator."
    />
  );
}
