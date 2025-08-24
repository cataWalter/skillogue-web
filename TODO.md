## Todo

Medium priority

* Blocked Users Management
* add report logic
* Privacy & Visibility Settings

Low priority

* privacy analysis
* law requirements analysis

* improve modal
* Accessibility (a11y): Add aria-label attributes to icons (like the X for disconnecting or the Send button in chat) and ensure all interactive elements are keyboard-navigable. Use semantic HTML where possible.
* Code Splitting: Implement route-based code splitting using React.lazy and Suspense in your App.js. This will   significantly reduce the initial bundle size by only loading the code for the current page.
* Memoization: Use React.memo for components that render frequently with the same props (e.g., the Connection item in   Connections.js or individual Message components) and useMemo/useCallback for expensive calculations or function   references in parent components to prevent unnecessary re-renders.



TESTS
CI/CD
