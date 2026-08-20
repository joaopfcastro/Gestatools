import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeWheelDelta,
  isExcludedTarget,
  isTargetInsideResultsPanel,
  canScrollPanel,
  getActiveResultsPanel,
} from '../src/hooks/useGlobalResultsScroll';

interface MockElementOptions {
  className?: string;
  attributes?: Record<string, string>;
  scrollHeight?: number;
  clientHeight?: number;
  scrollTop?: number;
  offsetParent?: any;
  parent?: any;
}

function createMockElement(options: MockElementOptions = {}) {
  const element: any = {
    className: options.className || '',
    attributes: options.attributes || {},
    scrollHeight: options.scrollHeight ?? 0,
    clientHeight: options.clientHeight ?? 0,
    scrollTop: options.scrollTop ?? 0,
    offsetParent: options.offsetParent !== undefined ? options.offsetParent : {},
    parentNode: options.parent || null,
    children: [] as any[],
    getAttribute(name: string) {
      return this.attributes[name] || null;
    },
    setAttribute(name: string, value: string) {
      this.attributes[name] = value;
    },
    getClientRects() {
      return [{ width: 300, height: 400 }];
    },
    closest(selector: string) {
      let current: any = this;
      const selectors = selector.split(',').map((s) => s.trim());

      while (current) {
        for (const sel of selectors) {
          if (sel.startsWith('.')) {
            const cls = sel.slice(1);
            if (current.className && current.className.split(/\s+/).includes(cls)) {
              return current;
            }
          } else if (sel.startsWith('[') && sel.endsWith(']')) {
            const attrMatch = sel.slice(1, -1).match(/([a-zA-Z0-9_-]+)(?:="([^"]+)")?/);
            if (attrMatch) {
              const [, attrName, attrVal] = attrMatch;
              if (attrVal !== undefined) {
                if (current.getAttribute && current.getAttribute(attrName) === attrVal) {
                  return current;
                }
              } else if (current.getAttribute && current.getAttribute(attrName) !== null) {
                return current;
              }
            }
          } else if (current.tagName && current.tagName.toLowerCase() === sel.toLowerCase()) {
            return current;
          }
        }
        current = current.parentNode;
      }
      return null;
    },
  };

  return element;
}

describe('useGlobalResultsScroll Logic and Helpers', () => {
  describe('normalizeWheelDelta', () => {
    it('preserves deltaY when deltaMode is pixel (0)', () => {
      const event = { deltaMode: 0, deltaY: 45 };
      expect(normalizeWheelDelta(event, 500)).toBe(45);

      const negativeEvent = { deltaMode: 0, deltaY: -120 };
      expect(normalizeWheelDelta(negativeEvent, 500)).toBe(-120);
    });

    it('multiplies deltaY by 16 when deltaMode is line (1)', () => {
      const event = { deltaMode: 1, deltaY: 3 };
      expect(normalizeWheelDelta(event, 500)).toBe(48);

      const negativeEvent = { deltaMode: 1, deltaY: -2 };
      expect(normalizeWheelDelta(negativeEvent, 500)).toBe(-32);
    });

    it('scales deltaY by panel clientHeight when deltaMode is page (2)', () => {
      const event = { deltaMode: 2, deltaY: 1 };
      expect(normalizeWheelDelta(event, 600)).toBe(600);

      const negativeEvent = { deltaMode: 2, deltaY: -0.5 };
      expect(normalizeWheelDelta(negativeEvent, 600)).toBe(-300);
    });
  });

  describe('isExcludedTarget', () => {
    it('returns false for null target', () => {
      expect(isExcludedTarget(null)).toBe(false);
    });

    it('returns true when target is inside [role="dialog"]', () => {
      const dialog = createMockElement({ attributes: { role: 'dialog' } });
      const innerButton = createMockElement({ parent: dialog });
      expect(isExcludedTarget(innerButton as any)).toBe(true);
    });

    it('returns true when target is inside [aria-modal="true"]', () => {
      const modal = createMockElement({ attributes: { 'aria-modal': 'true' } });
      const innerText = createMockElement({ parent: modal });
      expect(isExcludedTarget(innerText as any)).toBe(true);
    });

    it('returns true when target is inside .drawer-content', () => {
      const drawer = createMockElement({ className: 'drawer-content' });
      const innerChild = createMockElement({ parent: drawer });
      expect(isExcludedTarget(innerChild as any)).toBe(true);
    });

    it('returns false for standard form or static elements (e.g. form inputs, sidebar, header)', () => {
      const form = createMockElement({ className: 'calculator-form-panel' });
      const input = createMockElement({ parent: form });
      const sidebar = createMockElement({ className: 'app-sidebar' });
      const header = createMockElement({ className: 'glass-nav-top' });

      expect(isExcludedTarget(input as any)).toBe(false);
      expect(isExcludedTarget(form as any)).toBe(false);
      expect(isExcludedTarget(sidebar as any)).toBe(false);
      expect(isExcludedTarget(header as any)).toBe(false);
    });
  });

  describe('isTargetInsideResultsPanel', () => {
    it('returns false for null target', () => {
      expect(isTargetInsideResultsPanel(null)).toBe(false);
    });

    it('returns true when target is inside .results-scroll-panel', () => {
      const panel = createMockElement({ className: 'glass-panel widget-gradient results-scroll-panel' });
      const child = createMockElement({ parent: panel });

      expect(isTargetInsideResultsPanel(child as any)).toBe(true);
      expect(isTargetInsideResultsPanel(panel as any)).toBe(true);
    });

    it('returns false when target is outside .results-scroll-panel', () => {
      const outside = createMockElement({ className: 'calculator-form-panel' });
      expect(isTargetInsideResultsPanel(outside as any)).toBe(false);
    });
  });

  describe('canScrollPanel and getActiveResultsPanel', () => {
    it('returns true when scrollHeight > clientHeight', () => {
      const panel = createMockElement({ scrollHeight: 800, clientHeight: 400 });
      expect(canScrollPanel(panel as any)).toBe(true);
    });

    it('returns false when scrollHeight <= clientHeight or panel is null', () => {
      const panel = createMockElement({ scrollHeight: 400, clientHeight: 400 });
      expect(canScrollPanel(panel as any)).toBe(false);
      expect(canScrollPanel(null)).toBe(false);
    });

    it('finds active results panel from document when querySelectorAll is available', () => {
      const visiblePanel = createMockElement({ className: 'results-scroll-panel', offsetParent: {} });
      const hiddenPanel = createMockElement({ className: 'results-scroll-panel', offsetParent: null });
      hiddenPanel.getClientRects = () => [];

      const originalDocument = (globalThis as any).document;
      (globalThis as any).document = {
        querySelectorAll: (sel: string) => (sel === '.results-scroll-panel' ? [hiddenPanel, visiblePanel] : []),
      };

      const result = getActiveResultsPanel();
      expect(result).toBe(visiblePanel);

      (globalThis as any).document = originalDocument;
    });
  });

  describe('Decision Matrix for Wheel Forwarding', () => {
    let activePanel: any;
    let outsideElement: any;
    let insideElement: any;
    let modalElement: any;

    const evaluateWheel = (params: {
      windowWidth: number;
      target: any;
      deltaX: number;
      deltaY: number;
      panel: any;
    }): { shouldForward: boolean; delta: number } => {
      if (params.windowWidth < 768) {
        return { shouldForward: false, delta: 0 };
      }
      if (isTargetInsideResultsPanel(params.target)) {
        return { shouldForward: false, delta: 0 };
      }
      if (isExcludedTarget(params.target)) {
        return { shouldForward: false, delta: 0 };
      }
      if (Math.abs(params.deltaX) > Math.abs(params.deltaY)) {
        return { shouldForward: false, delta: 0 };
      }
      if (!params.panel || !canScrollPanel(params.panel)) {
        return { shouldForward: false, delta: 0 };
      }
      const delta = normalizeWheelDelta({ deltaMode: 0, deltaY: params.deltaY }, params.panel.clientHeight);
      if (delta === 0) {
        return { shouldForward: false, delta: 0 };
      }
      return { shouldForward: true, delta };
    };

    beforeEach(() => {
      activePanel = createMockElement({
        className: 'results-scroll-panel',
        scrollHeight: 1200,
        clientHeight: 600,
        scrollTop: 0,
      });
      insideElement = createMockElement({ parent: activePanel });
      outsideElement = createMockElement({ className: 'calculator-form-panel' });
      const modal = createMockElement({ attributes: { role: 'dialog' } });
      modalElement = createMockElement({ parent: modal });
    });

    it('forwards wheel when pointer is outside results panel on desktop (>=768px)', () => {
      const res = evaluateWheel({
        windowWidth: 1024,
        target: outsideElement,
        deltaX: 0,
        deltaY: 50,
        panel: activePanel,
      });
      expect(res.shouldForward).toBe(true);
      expect(res.delta).toBe(50);
    });

    it('does NOT forward when pointer is inside results panel (native scroll takes over)', () => {
      const res = evaluateWheel({
        windowWidth: 1024,
        target: insideElement,
        deltaX: 0,
        deltaY: 50,
        panel: activePanel,
      });
      expect(res.shouldForward).toBe(false);
      expect(res.delta).toBe(0);
    });

    it('does NOT forward on mobile (<768px)', () => {
      const res = evaluateWheel({
        windowWidth: 600,
        target: outsideElement,
        deltaX: 0,
        deltaY: 50,
        panel: activePanel,
      });
      expect(res.shouldForward).toBe(false);
    });

    it('does NOT forward when inside a modal/dialog', () => {
      const res = evaluateWheel({
        windowWidth: 1024,
        target: modalElement,
        deltaX: 0,
        deltaY: 50,
        panel: activePanel,
      });
      expect(res.shouldForward).toBe(false);
    });

    it('does NOT forward for predominantly horizontal gestures', () => {
      const res = evaluateWheel({
        windowWidth: 1024,
        target: outsideElement,
        deltaX: 120,
        deltaY: 20,
        panel: activePanel,
      });
      expect(res.shouldForward).toBe(false);
    });

    it('does NOT forward if panel has no overflow (scrollHeight <= clientHeight)', () => {
      const shortPanel = createMockElement({
        className: 'results-scroll-panel',
        scrollHeight: 500,
        clientHeight: 500,
      });
      const res = evaluateWheel({
        windowWidth: 1024,
        target: outsideElement,
        deltaX: 0,
        deltaY: 50,
        panel: shortPanel,
      });
      expect(res.shouldForward).toBe(false);
    });
  });
});
