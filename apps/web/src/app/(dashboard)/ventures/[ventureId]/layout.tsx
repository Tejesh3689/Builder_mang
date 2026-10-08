import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/authorization';
import { requireVentureInScope } from '@/lib/scope';

/**
 * Server-side existence + scope check for the (client-rendered) venture page, so a missing or
 * out-of-scope venture renders the 404 page with a real HTTP 404 instead of an empty shell.
 */
export default async function VentureLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ ventureId: string }>;
}) {
  const { ventureId } = await params;
  const user = await requireAuth();
  try {
    await requireVentureInScope(user, ventureId);
  } catch {
    notFound();
  }
  return <>{children}</>;
}
