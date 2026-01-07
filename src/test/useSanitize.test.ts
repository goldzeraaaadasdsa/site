import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSanitize } from '@/hooks/useSanitize';

describe('useSanitize Hook', () => {
  describe('sanitize', () => {
    it('should allow safe HTML tags', () => {
      const { result } = renderHook(() => useSanitize());
      const input = '<b>Bold text</b> and <i>italic</i>';
      const output = result.current.sanitize(input);
      
      expect(output).toContain('Bold');
      expect(output).toContain('italic');
    });

    it('should remove script tags', () => {
      const { result } = renderHook(() => useSanitize());
      const input = '<script>alert("XSS")</script>Hello';
      const output = result.current.sanitize(input);
      
      expect(output).not.toContain('script');
      expect(output).toContain('Hello');
    });

    it('should remove onclick handlers', () => {
      const { result } = renderHook(() => useSanitize());
      const input = '<p onclick="malicious()">Click me</p>';
      const output = result.current.sanitize(input);
      
      expect(output).not.toContain('onclick');
      expect(output).toContain('Click me');
    });

    it('should allow safe links', () => {
      const { result } = renderHook(() => useSanitize());
      const input = '<a href="https://example.com">Link</a>';
      const output = result.current.sanitize(input);
      
      expect(output).toContain('Link');
    });
  });

  describe('sanitizeStrict', () => {
    it('should remove all HTML tags', () => {
      const { result } = renderHook(() => useSanitize());
      const input = '<p>Hello <b>World</b></p>';
      const output = result.current.sanitizeStrict(input);
      
      expect(output).not.toContain('<');
      expect(output).not.toContain('>');
      expect(output).toContain('Hello');
      expect(output).toContain('World');
    });

    it('should handle multiple tags', () => {
      const { result } = renderHook(() => useSanitize());
      const input = '<h1>Title</h1><p>Content</p><a href="#">Link</a>';
      const output = result.current.sanitizeStrict(input);
      
      expect(output).not.toContain('<h1>');
      expect(output).not.toContain('<p>');
      expect(output).not.toContain('<a');
      expect(output).toContain('Title');
      expect(output).toContain('Content');
      expect(output).toContain('Link');
    });

    it('should preserve text content', () => {
      const { result } = renderHook(() => useSanitize());
      const input = 'Plain text with no HTML';
      const output = result.current.sanitizeStrict(input);
      
      expect(output).toBe('Plain text with no HTML');
    });
  });
});
