'use client';

import { useEffect } from 'react';

function isAbortError(reason: unknown) {
  if (!reason) return false;

  if (reason instanceof DOMException && reason.name === 'AbortError') {
    return true;
  }

  if (reason instanceof Error && reason.name === 'AbortError') {
    return true;
  }

  if (typeof reason === 'object' && reason !== null) {
    const name = 'name' in reason ? (reason as { name?: unknown }).name : undefined;
    if (name === 'AbortError') {
      return true;
    }
  }

  const message = typeof reason === 'string'
    ? reason
    : typeof reason === 'object' && reason !== null && 'message' in reason
      ? (reason as { message?: unknown }).message
      : undefined;

  return typeof message === 'string' && /aborterror|aborted a request/i.test(message);
}

export default function AbortErrorSilencer() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isAbortError(event.reason)) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  return null;
}