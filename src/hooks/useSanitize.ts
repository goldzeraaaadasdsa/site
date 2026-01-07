/**
 * Custom hook for sanitizing user-generated content
 * Prevents XSS attacks and HTML injection
 */

import { useCallback } from 'react';
import DOMPurify from 'dompurify';

export const useSanitize = () => {
  const sanitize = useCallback((dirty: string) => {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'u', 'em', 'strong', 'p', 'br', 'a', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
  }, []);

  const sanitizeStrict = useCallback((dirty: string) => {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }, []);

  return { sanitize, sanitizeStrict };
};
