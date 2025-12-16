# Dependency Audit Report

**Generated:** December 16, 2025
**Project:** ICT Platform (WordPress Plugin)

---

## Summary

| Category | Count | Action Required |
|----------|-------|-----------------|
| Critical Security Issues | 2 | Immediate |
| Deprecated Packages | 2 | Replace/Remove |
| Outdated Packages | 15+ | Update |
| Unused Bloat | 7 | Remove |
| Missing Dependencies | 1 | Add |

---

## Critical Security Vulnerabilities

### 1. Axios (Current: `^1.5.1`)

Multiple CVEs affect the installed version:

| CVE | Severity | Impact | Fixed In |
|-----|----------|--------|----------|
| CVE-2025-58754 | High (7.5) | DoS via Data URL memory exhaustion | 1.11.0+ |
| CVE-2025-27152 | Moderate | SSRF & Credential Leakage | 1.8.2+ |
| CVE-2024-39338 | High (7.5) | Server-Side Request Forgery | 1.7.3+ |

**Action:** Upgrade to `axios@^1.13.2`

### 2. ESLint 8 (Current: `^8.52.0`)

ESLint v8.x reached End of Life on October 5, 2024. No further security patches will be released.

**Action:** Migrate to ESLint 9.x (requires flat config migration)

---

## Deprecated Packages

### 1. react-beautiful-dnd (`^13.1.1`)

Officially deprecated by Atlassian. Does not support React 19.

**Status:** NOT USED in codebase - safe to remove entirely

**Alternatives (if needed in future):**
- `@hello-pangea/dnd` - Drop-in replacement fork
- `dnd-kit` - Modern, flexible alternative
- `@atlaskit/pragmatic-drag-and-drop` - Atlassian's successor

### 2. @types/chart.js (`^2.9.41`)

Stub package - Chart.js 4.x includes its own TypeScript definitions.

**Action:** Remove entirely

---

## Outdated Packages

### Major Version Upgrades Available

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| `@reduxjs/toolkit` | ^1.9.7 | 2.11.2 | Major rewrite with improved APIs |
| `date-fns` | ^2.30.0 | 4.1.0 | Major v4 release |
| `framer-motion` | ^10.16.4 | 12.23.26 | Major v11/v12 releases |
| `react-router-dom` | ^6.17.0 | 7.10.1 | React Router v7 released |
| `react-toastify` | ^9.1.3 | 11.0.5 | v10/v11 available |
| `react-redux` | ^8.1.3 | 9.2.0 | v9 for Redux Toolkit 2.x |
| `@typescript-eslint/*` | ^6.9.0 | 8.32.1 | v8 for ESLint 9 |
| `@wordpress/scripts` | ^26.17.0 | 31.1.0 | Multiple major versions behind |

### Minor/Patch Updates

| Package | Current | Latest |
|---------|---------|--------|
| `@fullcalendar/*` | ^6.1.9 | 6.1.19 |
| `chart.js` | ^4.4.0 | 4.5.1 |
| `axios` | ^1.5.1 | 1.13.2 |
| `@testing-library/jest-dom` | ^6.1.4 | 6.9.1 |
| `@babel/core` | ^7.23.0 | 7.28.5 |
| `typescript` | ^5.2.2 | 5.8.3 |
| `webpack` | ^5.89.0 | 5.99.9 |

---

## Unused Dependencies (Bloat)

These packages are installed but **never imported** in the source code:

| Package | Approx Size | Recommendation |
|---------|-------------|----------------|
| `react-beautiful-dnd` | ~50KB | Remove (deprecated) |
| `framer-motion` | ~150KB | Remove |
| `date-fns` | ~30KB | Remove |
| `chart.js` | ~200KB | Remove (using native SVG) |
| `react-chartjs-2` | ~15KB | Remove |
| `react-toastify` | ~20KB | Remove |
| `@types/chart.js` | Dev only | Remove (stub) |

**Estimated bundle reduction:** ~465KB (unminified)

---

## Missing Dependencies

### @fullcalendar/resource-timeline

The file `src/components/resources/ResourceCalendar.tsx` imports this package, but it's not in package.json:

```typescript
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
```

**Action:** Add `"@fullcalendar/resource-timeline": "^6.1.9"` to dependencies

---

## Recommended package.json Changes

### Dependencies to Update

```json
{
  "dependencies": {
    "@fullcalendar/core": "^6.1.19",
    "@fullcalendar/daygrid": "^6.1.19",
    "@fullcalendar/interaction": "^6.1.19",
    "@fullcalendar/react": "^6.1.19",
    "@fullcalendar/resource-timeline": "^6.1.19",
    "@fullcalendar/timegrid": "^6.1.19",
    "@reduxjs/toolkit": "^2.11.2",
    "axios": "^1.13.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-redux": "^9.2.0",
    "react-router-dom": "^6.30.2"
  }
}
```

### Dependencies to Remove

```json
{
  "dependencies": {
    "react-beautiful-dnd": "REMOVE",
    "framer-motion": "REMOVE",
    "date-fns": "REMOVE",
    "chart.js": "REMOVE",
    "react-chartjs-2": "REMOVE",
    "react-toastify": "REMOVE",
    "@types/chart.js": "REMOVE"
  }
}
```

### DevDependencies to Update

```json
{
  "devDependencies": {
    "@babel/core": "^7.28.5",
    "@babel/preset-env": "^7.28.0",
    "@babel/preset-react": "^7.28.0",
    "@babel/preset-typescript": "^7.28.0",
    "@testing-library/jest-dom": "^6.9.1",
    "@typescript-eslint/eslint-plugin": "^8.32.1",
    "@typescript-eslint/parser": "^8.32.1",
    "@wordpress/scripts": "^31.1.0",
    "eslint": "^9.39.2",
    "typescript": "^5.8.3",
    "webpack": "^5.99.9"
  }
}
```

---

## Composer Dependencies

The PHP dependencies are well-maintained:

| Package | Version | Status |
|---------|---------|--------|
| `phpunit/phpunit` | ^10.0 | Correct for PHP 8.1 |
| `wp-coding-standards/wpcs` | ^3.0 | Current |
| `phpcompatibility/php-compatibility` | ^9.3 | Current |
| `dealerdirect/phpcodesniffer-composer-installer` | ^1.0 | Current |

No changes recommended.

---

## Priority Actions

### Immediate (Security)
1. Upgrade `axios` to `^1.13.2`
2. Add missing `@fullcalendar/resource-timeline`

### Short-term (Cleanup)
3. Remove 7 unused packages
4. Update minor versions of all packages

### Medium-term (Maintenance)
5. Migrate ESLint 8 to ESLint 9 with flat config
6. Consider Redux Toolkit 2.x upgrade (breaking changes)

### Optional (Major Upgrades)
7. Evaluate React Router v7 migration
8. Evaluate React 19 compatibility

---

## References

- [ESLint v8 EOL Announcement](https://eslint.org/blog/2024/09/eslint-v8-eol-version-support/)
- [react-beautiful-dnd Deprecation](https://github.com/atlassian/react-beautiful-dnd/issues/2672)
- [Axios Security Advisories](https://security.snyk.io/package/npm/axios)
- [PHPUnit Supported Versions](https://phpunit.de/supported-versions.html)
