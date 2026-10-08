'use client';

import React, { useCallback, useState } from 'react';

export type FieldErrors = Record<string, string>;

/**
 * Pulls per-field messages out of an API error. Handles every shape the backend sends:
 *   { field, error }                         – lib/http/errors ApiError
 *   { details: { field } }                   – conflict(message, { field })
 *   { details: { issues: [{ field, message }] } } – central ZodError mapping
 *   { error: [{ path: [...], message }] }    – raw Zod issues from older routes
 */
export function fieldErrorsFrom(err: any): FieldErrors {
  const data = err?.data ?? err;
  const out: FieldErrors = {};
  const put = (field: unknown, message: unknown) => {
    if (typeof field !== 'string' || !field) return;
    const key = field.split('.')[0];
    if (!out[key]) out[key] = typeof message === 'string' && message ? message : 'Invalid value';
  };

  for (const issue of data?.details?.issues ?? []) put(issue?.field, issue?.message);
  if (Array.isArray(data?.error)) {
    for (const issue of data.error) put(Array.isArray(issue?.path) ? issue.path.join('.') : issue?.field, issue?.message);
  }
  const message = typeof data?.error === 'string' ? data.error : err?.message;
  put(data?.field, message);
  put(data?.details?.field, message);
  return out;
}

/**
 * Per-field server errors for a form. `aliases` maps API field names to input ids
 * (e.g. firstName -> fullName) when the form's inputs don't match the payload 1:1.
 */
export function useFieldErrors(aliases: Record<string, string> = {}) {
  const [errors, setErrors] = useState<FieldErrors>({});

  /** Records field errors from an API error; focuses the first invalid input. Returns true if any were found. */
  const setFromError = useCallback((err: any) => {
    const mapped: FieldErrors = {};
    for (const [field, message] of Object.entries(fieldErrorsFrom(err))) {
      const id = aliases[field] ?? field;
      if (!mapped[id]) mapped[id] = message;
    }
    setErrors(mapped);
    // Focus after the caller's state updates (e.g. clearing a loading/disabled state) have rendered.
    setTimeout(() => {
      const first = Object.keys(mapped).map((id) => document.getElementById(id)).find(Boolean);
      if (first) {
        first.scrollIntoView({ block: 'center', behavior: 'smooth' });
        (first as HTMLElement).focus({ preventScroll: true });
      }
    }, 0);
    return Object.keys(mapped).length > 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(aliases)]);

  const clear = useCallback((id?: string) => {
    setErrors((prev) => {
      if (!id) return {};
      if (!(id in prev)) return prev;
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  /** Spread onto an input/select/textarea: wires aria-invalid / aria-describedby and clears the error on edit. */
  const props = (id: string) => ({
    'aria-invalid': errors[id] ? (true as const) : undefined,
    'aria-describedby': errors[id] ? `${id}-error` : undefined,
    onInput: () => clear(id),
  });

  return { errors, setFromError, clear, props };
}

/** Inline message shown under an invalid field. */
export function FieldError({ id, errors }: { id: string; errors: FieldErrors }) {
  if (!errors[id]) return null;
  return (
    <p id={`${id}-error`} className="mt-1 text-[11px] font-medium text-red-600">
      {errors[id]}
    </p>
  );
}
