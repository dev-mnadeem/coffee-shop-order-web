# Build, test and bundle figures

Captured on 2026-09-25 on Node v22.22.3 / npm 10.9.8. Every block is literal
terminal output.

## Test suite

```console
$ npm run test:ci

PASS src/api/collection.test.js
PASS src/hooks/useAsync.test.jsx
PASS src/api/client.test.js
PASS src/components/ItemThumbnail.test.jsx
PASS src/api/orders.test.js
PASS src/domain/pricing.test.js
PASS src/domain/money.test.js
PASS src/screens/Customers.test.jsx
PASS src/screens/Items.test.jsx
PASS src/App.test.jsx
PASS src/screens/NewItem.test.jsx
PASS src/screens/Order.test.jsx

Test Suites: 12 passed, 12 total
Tests:       70 passed, 70 total
Snapshots:   0 total
Time:        3.095 s
Ran all test suites.
```

Before this pass there was one test file -- Create React App's default, asserting
the page contains "learn react" -- and it did not run at all (see
[bug-reproductions.md](bug-reproductions.md), sections 1 and 2).

Every test runs against an `msw` mock of the Rails API configured with
`onUnhandledRequest: 'error'`, so nothing in the suite can reach a real server.

## Coverage

```console
$ npx react-scripts test --watchAll=false --coverage

--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   95.69 |    84.03 |    94.3 |   97.56 |
 src/api            |   91.66 |    91.93 |   95.45 |      96 |
 src/components     |     100 |    81.33 |     100 |     100 |
 src/context        |   95.23 |    64.28 |     100 |     100 |
 src/domain         |   98.21 |       80 |     100 |     100 |
 src/hooks          |   97.05 |    78.94 |     100 |     100 |
 src/screens        |   93.25 |    94.11 |   83.78 |   94.18 |
--------------------|---------|----------|---------|---------|
```

(Abridged to the directory rows; the per-file rows are in the full output.)

## Lint and formatting

```console
$ npm run lint
$ echo $?
0

$ npx prettier --check src
Checking formatting...
All matched files use Prettier code style!
```

## Production build

```console
$ npm run build

Creating an optimized production build...
Compiled successfully.

File sizes after gzip:

  109.08 kB  build/static/js/main.a4252f9e.js
  29.16 kB   build/static/css/main.98c8f402.css
```

### Bundle: before and after

The "before" figure was taken the moment the repository first compiled -- with
the directory layout corrected and nothing else changed -- so it measures the
original code, not a broken tree:

```console
File sizes after gzip:

  135.19 kB  build/static/js/main.de8fe523.js
  28.39 kB   build/static/css/main.4d577064.css
  1.78 kB    build/static/js/787.9dba455a.chunk.js
```

|        | JS (gzip)              | CSS (gzip) | extra chunk |
| ------ | ---------------------- | ---------- | ----------- |
| Before | 135.19 kB              | 28.39 kB   | 1.78 kB     |
| After  | 109.08 kB              | 29.16 kB   | —           |
| Change | **−26.11 kB (−19.3%)** | +0.77 kB   | −1.78 kB    |

Where the JavaScript went:

- `src/index.js` imported `bootstrap/dist/js/bootstrap.bundle.min` — Bootstrap's
  own component runtime plus Popper. `react-bootstrap` implements those
  behaviours in React and does not use it; nothing else referenced it.
- `reportWebVitals` and the `web-vitals` package were Create React App
  scaffolding that never reported anywhere. Removing them also removed the
  1.78 kB lazily-loaded chunk.
- `cors` — Express middleware — was in `dependencies`. It was never imported, so
  it cost nothing at runtime, but it was removed as well.

The CSS grew by 0.77 kB: that is `src/styles/theme.css`, which replaced Create
React App's unused `App.css`.

## Repository weight

Deleting `public/fonts/` — FontAwesome files belonging to a different
application, referenced by nothing (see
[bug-reproductions.md](bug-reproductions.md), section 9) — removed 2.74 MB of
tracked binaries, measured against the commit that introduced them:

```console
$ git ls-tree -r -l 010c0ce public/fonts \
    | awk '{s+=$4; n+=1} END {printf "%d files, %.2f MB\n", n, s/1024/1024}'
16 files, 2.74 MB
```

(Fifteen font files plus the stray README.)
