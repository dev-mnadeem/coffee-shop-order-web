# Build and test figures

Captured on 2026-11-09 in a `node:22-bookworm` container (Node v22.23.4, npm 10.9.9). Tests and the build ran with `--network none`.

## Tests

```console
$ npm test

 Test Files  13 passed (13)
      Tests  79 passed (79)
```

Every request in the suite goes to an `msw` mock of the Rails API (`src/test/handlers.js`) with `onUnhandledRequest: 'error'`, so no test can reach a real server.

| Area                                | File                                                     |
| ----------------------------------- | -------------------------------------------------------- |
| Pricing pipeline and rounding       | `src/domain/pricing.test.js`, `src/domain/money.test.js` |
| Stock check per item across lines   | `src/domain/stock.test.js`                               |
| Pagination, error mapping, payloads | `src/api/*.test.js`                                      |
| Loading/success/error, superseding  | `src/hooks/useAsync.test.jsx`                            |
| Screens through the mocked API      | `src/screens/*.test.jsx`, `src/App.test.jsx`             |
| Item tiles                          | `src/components/ItemThumbnail.test.jsx`                  |

## Coverage

```console
$ npm run coverage

Statements   : 95.62% ( 328/343 )
Branches     : 88.37% ( 228/258 )
Functions    : 94.73% ( 126/133 )
Lines        : 97.65% ( 291/298 )
```

## Lint and formatting

```console
$ npm run lint          # exit 0, no warnings (--max-warnings=0)
$ npm run format:check
All matched files use Prettier code style!
```

## Production build

```console
$ npm run build

dist/index.html                    1.27 kB │ gzip:   0.63 kB
dist/assets/coffee-Beit5jJN.jpg   54.36 kB
dist/assets/index-B6zvn0Py.css   235.52 kB │ gzip:  32.41 kB
dist/assets/index-CbpHVAxm.js    384.71 kB │ gzip: 126.27 kB
```

Only Bootstrap's CSS is imported. `react-bootstrap` implements the component behaviour itself, so Bootstrap's JavaScript bundle and Popper are not shipped.

## Dependencies

```console
$ npm audit
found 0 vulnerabilities
```

## Container

`docker compose up --build` builds the image, the health check reports `healthy`, and nginx runs as the `nginx` user. `/`, `/order` and `/config.js` all return 200 with `X-Content-Type-Options`, `X-Frame-Options` and `Referrer-Policy`. Files under `/assets/` are sent with `Cache-Control: public, immutable`.
