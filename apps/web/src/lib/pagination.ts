import { NextRequest } from 'next/server';

export interface PaginationParams {
  skip: number;
  take: number;
}

export function getPaginationParams(req: Request | NextRequest, defaultLimit = 25, maxLimit = 100): PaginationParams {
  const url = req instanceof NextRequest ? req.nextUrl : new URL(req.url);
  
  let page = 1;
  let limit = defaultLimit;

  // Prefer page/limit if provided
  if (url.searchParams.has('page')) {
    const p = parseInt(url.searchParams.get('page') || '1', 10);
    if (!isNaN(p) && p > 0) page = p;
  }
  
  if (url.searchParams.has('limit')) {
    const l = parseInt(url.searchParams.get('limit') || `${defaultLimit}`, 10);
    if (!isNaN(l) && l > 0) {
      limit = l > maxLimit ? maxLimit : l;
    }
  }

  // Support skip/take as fallbacks
  let skip = (page - 1) * limit;
  let take = limit;

  if (url.searchParams.has('skip')) {
    const s = parseInt(url.searchParams.get('skip') || '0', 10);
    if (!isNaN(s) && s >= 0) skip = s;
  }
  if (url.searchParams.has('take')) {
    const t = parseInt(url.searchParams.get('take') || `${defaultLimit}`, 10);
    if (!isNaN(t) && t > 0) {
      take = t > maxLimit ? maxLimit : t;
    }
  }

  return { skip, take };
}
