import { StatusPage } from '@/components/StatusPage';

export default function NotFound() {
  return (
    <main className="min-h-screen flex">
      <StatusPage
        code="404"
        title="Page not found"
        message="The address you opened doesn't match any page in the Builder Management Portal."
      />
    </main>
  );
}
