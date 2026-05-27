'use client';

import { useEffect } from 'react';

function isAbortError(reason: unknown) {
  if (!reason) return false;

  // 1. Check if it is a string
  if (typeof reason === 'string') {
    return /aborterror|aborted/i.test(reason);
  }

  // 2. Check if it's an object (handles DOMException, Error, and cross-context frame errors)
  if (typeof reason === 'object') {
    const obj = reason as Record<string, unknown>;

    // Check constructor name
    const constructorName = obj.constructor?.name;
    if (constructorName === 'DOMException' || constructorName === 'AbortError') {
      if (obj.name === 'AbortError') return true;
    }

    // Check name property
    if (obj.name === 'AbortError' || obj.name === 'AbortException') {
      return true;
    }

    // Check message property
    if (typeof obj.message === 'string' && /aborterror|aborted a request|user aborted/i.test(obj.message)) {
      return true;
    }

    // Check standard string representation
    const str = Object.prototype.toString.call(reason);
    if (str === '[object DOMException]' && obj.name === 'AbortError') {
      return true;
    }
  }

  return false;
}

export default function AbortErrorSilencer() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isAbortError(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (isAbortError(event.error)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    // Use { capture: true } to intercept events during the capture phase,
    // ensuring we process and stop them BEFORE Next.js's default listeners execute.
    window.addEventListener('unhandledrejection', handleUnhandledRejection, { capture: true });
    window.addEventListener('error', handleError, { capture: true });

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, { capture: true });
      window.removeEventListener('error', handleError, { capture: true });
    };
  }, []);

  return null;
}