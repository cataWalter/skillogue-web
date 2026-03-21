import '@testing-library/jest-dom'

// Add TextEncoder/TextDecoder polyfills for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Add Request polyfill
if (typeof global.Request === 'undefined') {
  global.Request = class Request {};
}

// Add Response polyfill
if (typeof global.Response === 'undefined') {
  global.Response = class Response {};
}

// Add Headers polyfill
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {};
}

// Add AbortController polyfill
if (typeof global.AbortController === 'undefined') {
  global.AbortController = class AbortController {
    constructor() {
      this.signal = {};
      this.abort = () => {};
    }
  };
}

// Add fetch polyfill
if (typeof global.fetch === 'undefined') {
  global.fetch = () => Promise.resolve(new Response());
}
