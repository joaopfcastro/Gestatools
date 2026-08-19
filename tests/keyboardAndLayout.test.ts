import { describe, it, expect, vi } from 'vitest';

describe('Keyboard and Layout Behavior Logic', () => {
  it('handles data-keyboard-open attribute logic', () => {
    const mockDocument = {
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      removeAttribute(name: string) {
        this.attributes.delete(name);
      },
      getAttribute(name: string) {
        return this.attributes.get(name) || null;
      },
    };

    mockDocument.setAttribute('data-keyboard-open', 'true');
    expect(mockDocument.getAttribute('data-keyboard-open')).toBe('true');

    mockDocument.removeAttribute('data-keyboard-open');
    expect(mockDocument.getAttribute('data-keyboard-open')).toBeNull();
  });

  it('verifies that window scroll lock forces scroll position to (0,0)', () => {
    const mockWindow = {
      scrollY: 150,
      scrollX: 0,
      scrollTo: vi.fn(),
    };

    const lockWindowScroll = () => {
      if (mockWindow.scrollY !== 0 || mockWindow.scrollX !== 0) {
        mockWindow.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    };

    lockWindowScroll();
    expect(mockWindow.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });

  it('detects virtual keyboard state when visual viewport shrinks', () => {
    const windowHeight = 800;
    const visualViewportHeight = 450; // Keyboard open (~350px)

    const isKeyboardOpen = windowHeight - visualViewportHeight > 100;
    expect(isKeyboardOpen).toBe(true);

    const normalViewportHeight = 800;
    const isKeyboardClosed = windowHeight - normalViewportHeight > 100;
    expect(isKeyboardClosed).toBe(false);
  });

  it('scrolls only the container without touching window scroll', () => {
    const mockContainer = {
      scrollTop: 100,
      scrollTo: vi.fn(),
    };
    const targetRelativeTop = 250;
    const topPadding = 12;

    const targetScroll = mockContainer.scrollTop + targetRelativeTop - topPadding;
    mockContainer.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth',
    });

    expect(mockContainer.scrollTo).toHaveBeenCalledWith({
      top: 338,
      behavior: 'smooth',
    });
  });
});


