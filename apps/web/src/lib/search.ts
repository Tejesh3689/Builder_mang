export function buildSearchConditions(
  searchQuery: string | null | undefined,
  fieldBuilders: ((term: string) => any)[]
) {
  if (!searchQuery) return [];
  
  const terms = searchQuery.trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return terms.map(term => ({
    OR: fieldBuilders.map(build => build(term))
  }));
}
