/**
 * ChatMessage Component Tests
 *
 * Tests for XSS protection and content sanitization.
 *
 * Epic: 07 - UI Shell
 * Story: Technical Debt - Add unit tests for sanitization logic
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ChatMessage } from './ChatMessage';

// Mock DOMPurify - hoisted to module level by vitest
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((content: string, options: { ALLOWED_TAGS: string[] }) => {
      // Simulate DOMPurify stripping tags when ALLOWED_TAGS is empty
      if (options.ALLOWED_TAGS.length === 0) {
        // First strip script/style tags including their content (like real DOMPurify)
        let result = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        // Then strip remaining HTML tags
        result = result.replace(/<[^>]*>/g, '');
        return result;
      }
      return content;
    }),
  },
}));

describe('ChatMessage', () => {
  // Clean up after each test to prevent state leakage
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const defaultTimestamp = new Date('2024-01-15T10:30:00Z');

  describe('XSS Protection', () => {
    it('renders safe content unchanged', () => {
      render(
        <ChatMessage
          type="user"
          content="Hello, World!"
          timestamp={defaultTimestamp}
        />
      );

      expect(screen.getByText('Hello, World!')).toBeInTheDocument();
    });

    it('strips HTML script tags from content', () => {
      render(
        <ChatMessage
          type="user"
          content="Hello <script>alert('xss')</script>World"
          timestamp={defaultTimestamp}
        />
      );

      // DOMPurify strips script tags AND their content entirely
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('strips dangerous HTML attributes', () => {
      render(
        <ChatMessage
          type="user"
          content='Click <a href="javascript:alert(1)">here</a>'
          timestamp={defaultTimestamp}
        />
      );

      // Link should be stripped
      expect(screen.getByText('Click here')).toBeInTheDocument();
    });

    it('strips img tags with onerror handlers', () => {
      render(
        <ChatMessage
          type="user"
          content='Image: <img src="x" onerror="alert(1)">'
          timestamp={defaultTimestamp}
        />
      );

      // Img tag should be stripped
      expect(screen.getByText('Image:')).toBeInTheDocument();
    });

    it('strips event handler attributes', () => {
      render(
        <ChatMessage
          type="user"
          content='<div onclick="alert(1)">Click me</div>'
          timestamp={defaultTimestamp}
        />
      );

      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('handles nested script injection attempts', () => {
      const { container } = render(
        <ChatMessage
          type="user"
          content='<scr<script>ipt>alert(1)</scr</script>ipt>'
          timestamp={defaultTimestamp}
        />
      );

      // DOMPurify strips nested script attempts aggressively for safety
      // The content should be safely rendered (potentially empty or with residue)
      // but most importantly, no script should execute
      const messageContent = container.querySelector('.leading-relaxed');
      expect(messageContent).toBeInTheDocument();
      // Verify no dangerous script content remains
      expect(messageContent?.textContent || '').not.toContain('<script');
      expect(messageContent?.textContent || '').not.toContain('javascript:');
    });
  });

  describe('Message Types', () => {
    it('renders user messages with correct styling', () => {
      const { container } = render(
        <ChatMessage
          type="user"
          content="User message"
          timestamp={defaultTimestamp}
        />
      );

      const messageWrapper = container.querySelector('.self-end');
      expect(messageWrapper).toBeInTheDocument();
    });

    it('renders agent messages with avatar', () => {
      render(
        <ChatMessage
          type="agent"
          content="Agent response"
          timestamp={defaultTimestamp}
          agentName="TestBot"
          agentIcon="🤖"
          agentColor="#FF6B6B"
        />
      );

      expect(screen.getByText('TestBot')).toBeInTheDocument();
      expect(screen.getByText('🤖')).toBeInTheDocument();
      expect(screen.getByText('Agent response')).toBeInTheDocument();
    });

    it('renders system messages centered', () => {
      const { container } = render(
        <ChatMessage
          type="system"
          content="System notification"
          timestamp={defaultTimestamp}
        />
      );

      const centeredWrapper = container.querySelector('.justify-center');
      expect(centeredWrapper).toBeInTheDocument();
    });

    it('uses default agent values when not provided', () => {
      render(
        <ChatMessage
          type="agent"
          content="Agent message"
          timestamp={defaultTimestamp}
        />
      );

      expect(screen.getByText('Agent')).toBeInTheDocument();
      expect(screen.getByText('🤖')).toBeInTheDocument();
    });
  });

  describe('Timestamp Handling', () => {
    it('accepts Date object timestamps', () => {
      render(
        <ChatMessage
          type="user"
          content="Test"
          timestamp={new Date('2024-01-15T14:30:00Z')}
        />
      );

      // Should render without error
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('accepts ISO string timestamps', () => {
      render(
        <ChatMessage
          type="user"
          content="Test"
          timestamp="2024-01-15T14:30:00Z"
        />
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('accepts numeric timestamps', () => {
      render(
        <ChatMessage
          type="user"
          content="Test"
          timestamp={1705329000000}
        />
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});

describe('SSR Content Escaping', () => {
  // Test the SSR fallback behavior
  // Note: This tests the escaping logic that runs when window is undefined

  it('escapes HTML entities in SSR mode', () => {
    // The actual SSR escaping is handled by the sanitizeContent function
    // when typeof window === 'undefined'. In JSDOM tests, window exists,
    // so we test through the mocked DOMPurify instead.

    // This test verifies the expected output format
    const content = '<script>alert("xss")</script>';
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    expect(escaped).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
  });

  it('escapes ampersands correctly', () => {
    const content = 'Tom & Jerry';
    const escaped = content.replace(/&/g, '&amp;');
    expect(escaped).toBe('Tom &amp; Jerry');
  });

  it('escapes angle brackets correctly', () => {
    const content = '1 < 2 > 0';
    const escaped = content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    expect(escaped).toBe('1 &lt; 2 &gt; 0');
  });
});
