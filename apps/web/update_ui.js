const fs = require('fs');
function updateVentures() {
  let code = fs.readFileSync('src/app/(dashboard)/ventures/page.tsx', 'utf8');
  code = code.replace(
    /const fetchVentures = async \(\) => \{[\s\S]*?\}, \[search, statusFilter, typeFilter\]\);/,
    `const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchVentures = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const query = new URLSearchParams({ page: String(page), limit: '20' });
        if (debouncedSearch) query.append('search', debouncedSearch);
        if (statusFilter !== 'ALL') query.append('status', statusFilter);
        if (typeFilter !== 'ALL') query.append('type', typeFilter);

        const res = await api.get<{success: boolean, data: any[], total?: number, error?: string}>(\`/api/ventures?\${query.toString()}\`, { signal: controller.signal });
        if (cancelled) return;

        if (res.success && Array.isArray(res.data)) {
          setVentures(res.data);
          setTotal(res.total ?? res.data.length);
        } else {
          setLoadError(res.error || 'The server returned an unexpected response.');
        }
      } catch (err: any) {
        if (cancelled || err.name === 'AbortError') return;
        console.error('Failed fetching ventures:', err);
        if (err?.status !== 401) setLoadError(err?.status ? err.message : 'Could not reach the server. Check your connection.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchVentures();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedSearch, statusFilter, typeFilter, page, reloadKey]);`
  );
  code = code.replace(
    /const handleVentureCreated = \(newVenture: any\) => \{[\s\S]*?fetchVentures\(\);\s*\};/,
    `const handleVentureCreated = (newVenture: any) => { setReloadKey(k => k + 1); };`
  );
  code = code.replace(
    /\{\/\* Empty State \*\/\}[\s\S]*?No ventures found<\/h3>\s*<p[^>]*>Try adjusting your filter search criteria or create a new venture\.<\/p>\s*<\/div>\s*\)\}/,
    `{/* Empty State */}
      {!loading && !loadError && ventures.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-zinc-200 border-dashed text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          {search ? (
            <>
              <h3 className="text-sm font-bold text-zinc-900 mb-1">No results for '{search}'</h3>
              <p className="text-xs text-zinc-500 mb-4">Try adjusting your filter search criteria or create a new venture.</p>
              <button 
                onClick={() => setSearch('')}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Clear Search
              </button>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold text-zinc-900 mb-1">No ventures found</h3>
              <p className="text-xs text-zinc-500 mb-4">Create your first venture to get started.</p>
            </>
          )}
        </div>
      )}`
  );
  fs.writeFileSync('src/app/(dashboard)/ventures/page.tsx', code);
}

function updateEmployees() {
  let code = fs.readFileSync('src/app/(dashboard)/employees/EmployeesClient.tsx', 'utf8');
  code = code.replace(
    /const json = await api.get<\{ success: boolean, data: any\[\], total\?: number \}>\(`\/api\/employees\?\$\{query\}`\);/,
    `const json = await api.get<{ success: boolean, data: any[], total?: number }>(\`/api/employees?\${query}\`, { signal: controller.signal });`
  );
  code = code.replace(
    /useEffect\(\(\) => \{[\s\S]*?let cancelled = false;/,
    `useEffect(() => {\n    let cancelled = false;\n    const controller = new AbortController();`
  );
  code = code.replace(
    /return \(\) => \{\s*cancelled = true;\s*\};/,
    `return () => {\n      cancelled = true;\n      controller.abort();\n    };`
  );
  code = code.replace(
    /\{\/\* Empty State \*\/\}[\s\S]*?No employees found<\/h3>\s*<p[^>]*>[\s\S]*?<\/p>\s*<\/div>\s*\)\}/,
    `{/* Empty State */}
          {!loading && !loadError && filteredEmployees.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-zinc-200 border-dashed text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
                <Users className="w-6 h-6" />
              </div>
              {searchTerm ? (
                <>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1">No results for '{searchTerm}'</h3>
                  <p className="text-xs text-zinc-500 mb-4">Try adjusting your search criteria or clear the filters.</p>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1">No employees found</h3>
                  <p className="text-xs text-zinc-500 mb-4">Add your first employee to start building your directory.</p>
                </>
              )}
            </div>
          )}`
  );
  fs.writeFileSync('src/app/(dashboard)/employees/EmployeesClient.tsx', code);
}

function updateMaterials() {
  let code = fs.readFileSync('src/app/(dashboard)/materials/list/MaterialsListClient.tsx', 'utf8');
  code = code.replace(
    /const \[searchQuery, setSearchQuery\] = useState\(''\);/,
    `const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);`
  );
  code = code.replace(
    /useEffect\(\(\) => \{\s*fetchMaterials\(\);\s*\}, \[\]\);/,
    `useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchMaterialsSearch = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({ page: String(page), limit: '20' });
        if (debouncedSearch) query.append('search', debouncedSearch);

        const res = await api.get<{success: boolean, data: any[], total?: number}>(\`/api/materials?\${query.toString()}\`, { signal: controller.signal });
        if (cancelled) return;
        
        if (res.success && res.data) {
          setMaterials(res.data);
          setTotal(res.total ?? res.data.length);
        }
      } catch (err: any) {
        if (cancelled || err.name === 'AbortError') return;
        console.error('Failed to fetch materials:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    fetchMaterialsSearch();
    
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedSearch, page, refreshKey]);`
  );
  code = code.replace(
    /const filtered = materials.filter\(\(item\) => \{[\s\S]*?\}\);/,
    `const filtered = materials; // Filtered via backend`
  );
  code = code.replace(
    /\{\/\* Empty State \*\/\}[\s\S]*?No materials found<\/h3>\s*<p[^>]*>Try adjusting your search or filters\.<\/p>\s*<\/div>\s*\)\}/,
    `{/* Empty State */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-zinc-200 border-dashed text-center">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
                <Search className="w-6 h-6" />
              </div>
              {searchQuery ? (
                <>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1">No results for '{searchQuery}'</h3>
                  <p className="text-xs text-zinc-500 mb-4">Try adjusting your search criteria.</p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-bold text-zinc-900 mb-1">No materials found</h3>
                  <p className="text-xs text-zinc-500 mb-4">Add materials to track inventory.</p>
                </>
              )}
            </div>
          )}`
  );
  fs.writeFileSync('src/app/(dashboard)/materials/list/MaterialsListClient.tsx', code);
}

try { updateVentures(); } catch (e) { console.error('Ventures failed:', e); }
try { updateEmployees(); } catch (e) { console.error('Employees failed:', e); }
try { updateMaterials(); } catch (e) { console.error('Materials failed:', e); }

