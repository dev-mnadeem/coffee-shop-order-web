# Bug reproductions

Literal output, captured before each fix against the code as it was committed
(`010c0ce`, the tip of `main`). Nothing here is reconstructed from memory.

## 1. The repository did not compile

`src/App.js` imported `./components/Navbar`, `./screens/Home` and `./api/Items`,
but `components/`, `screens/` and `api/` were committed at the repository root,
not under `src/`. Create React App only compiles what is inside `src/`, so the
build failed on the first import it tried to resolve.

```console
$ CI=true npx react-scripts build
Creating an optimized production build...
Failed to compile.

Module not found: Error: Can't resolve './screens/Home' in
'/Users/.../agnos-coffee-shop-fe/src'
```

The README's own project-structure table already described the intended layout
(`src/api`, `src/screens`, `src/components`, `src/utils`), so the fix was to put
the three directories where both the README and every import statement expected
them. No source file's contents had to change for this.

## 2. The only test failed with it

```console
$ CI=true npx react-scripts test --watchAll=false
FAIL src/App.test.js
  ● Test suite failed to run

    Cannot find module './components/Navbar' from 'src/App.js'

Test Suites: 1 failed, 1 total
Tests:       0 total
```

The test itself was Create React App's untouched default -- it asserted that the
page contains the text "learn react", which this application has never rendered.
It could not have passed even with the imports resolved.

## 3. Every API failure alerted and then crashed the page

`api/Axios.js` caught errors with `.catch((error) => alert(error.message))`,
which returns `undefined`. The resource modules then read `response.data.items`
off that `undefined`.

Reproduced by driving the app in a real browser (Playwright, the dev server on
port 8540) with the API stubbed to answer the way the Rails API answers an
unknown item -- `422 {"errors": ["Item 99 does not exist"]}`:

```console
=== submit an order that the API rejects with 422 ===
[console.error] Failed to load resource: the server responded with a status of 422 (Unprocessable Entity)
[dialog] Request failed with status code 422
[pageerror] TypeError: Cannot read properties of undefined (reading 'data')
```

The dialog is a browser `alert()` carrying axios's own wording rather than the
API's message, and the page dies immediately afterwards. The same two lines
appear with the API simply unreachable:

```console
=== /items when the API is down ===
[dialog] Network Error
[console.error] Failed to load resource: net::ERR_CONNECTION_REFUSED
[pageerror] TypeError: Cannot read properties of undefined (reading 'data')
body text: Home | Items | Order | Customers | Add Item | No Data Retrieved
```

Note the last line: a broken API and an empty shop rendered the identical
string, "No Data Retrieved".

## 4. Navigation reloaded the whole document

The navbar used `<Navbar.Brand href="items">` rather than a router link. Counting
main-frame navigations while clicking one nav item:

```console
=== navbar: does clicking "Order" do a full page reload? ===
main-frame navigations after clicking the Order nav link: 2
url: http://localhost:8540/order
```

Two navigations for one click: the SPA threw away its React tree and re-fetched
the bundle. The `href` values were also relative, so `href="items"` resolved
against whatever path you happened to be on.

## 5. `class` instead of `className`, in seven places

```console
[console.error] Warning: Invalid DOM property `%s`. Did you mean `%s`?%s class className
    at div
    at Items (http://localhost:8540/static/js/bundle.js:1293:76)
```

On plain elements this is only a warning. On `<Field class="form-control">` --
Formik's component, not a DOM node -- the attribute went nowhere, so the order
form's inputs rendered unstyled.

## 6. Validation messages used a removed Formik API and were never styled

```console
[console.warning] Warning: <Field render> has been deprecated and will be removed in
future versions of Formik. Please use a child callback function instead.
```

Four of these on every render of the order form. `components/ErrorMessage.jsx`
also set `class="text-danger"` on that same `<Field>`, so the error text came out
in the body colour rather than red.

## 7. The order summary dereferenced fields that may not exist

`screens/OrderDetail.jsx` read `orderDetail.customer.name` and
`orderDetail.total_amount.toFixed(2)` unconditionally -- see bug 3 for what
happened when the order had not in fact been created. It also left a
`console.log(orderDetail)` in the render path, and its "Close" button navigated
to `/items` instead of closing the modal.

## 8. The menu stopped at 25 items

The API paginates every collection and returns `meta.total_pages`; the client
sent no `page` or `per_page` and read only the array. A shop with a 26th item
simply never saw it, with nothing on screen to say so. Covered now by
`src/api/collection.test.js` ("follows meta.total_pages instead of stopping at
the first page").

## 9. FontAwesome fonts for a different application

Fifteen files under `public/fonts/` -- `fa-brands-400.*`, `fa-regular-400.*`,
`fa-solid-900.*` -- plus a `README.md` that opens:

> This directory contains custom fonts for the **Blockchain Explorer**
> application.

and goes on to require `BlockchainFont-Regular.woff2` and `TechMono-Regular.woff`,
neither of which is present. Nothing in the repository referenced any of it:

```console
$ grep -rniE "fa-|fontawesome|font-awesome|@font-face|fonts/" \
    --include="*.js" --include="*.jsx" --include="*.css" \
    --include="*.html" --include="*.json" src public components screens api package.json
$
```

No matches -- not in `public/index.html`, not in any stylesheet, and FontAwesome
is not a dependency. The directory was deleted.
