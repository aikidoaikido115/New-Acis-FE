import "@testing-library/jest-dom";

// Set up DOM environment for bun test
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Make DOM available globally
Object.assign(global, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  Node: dom.window.Node,
  Element: dom.window.Element,
  DocumentFragment: dom.window.DocumentFragment,
});
