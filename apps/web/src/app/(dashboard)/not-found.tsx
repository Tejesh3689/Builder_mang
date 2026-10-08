import { StatusPage } from '@/components/StatusPage';

export default function DashboardNotFound() {
  return (
    <StatusPage
      code="404"
      title="We couldn't find that"
      message="The page or record you're looking for doesn't exist, or you don't have access to it."
    />
  );
}
