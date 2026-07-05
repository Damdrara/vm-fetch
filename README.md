# VMFetch

A lightweight fetch interception library for userscripts.

VMFetch monkey-patches the page's `fetch()` function and lets you register callbacks for matching requests and responses. It is intended for debugging, reverse engineering, and building userscripts that need to observe or react to API traffic.

## Features

* Intercept any `fetch()` request made by the page.
* Listen for requests, responses, or both.
* Match requests by:

    * URL substring
    * Regular expression
    * Custom predicate
* Access parsed JSON bodies when available.
* Non-destructive response inspection using `Response.clone()`.
* Designed for Violentmonkey and other userscript managers.

## Installation

Include the library before your own userscript.

```javascript
// @require      https://cdn.jsdelivr.net/gh/damdrara/vm-fetch@main/dist/vm-fetch.js
// @grant        unsafeWindow
```

Then patch `fetch()` once during startup:

```javascript
VMFetch.patch();
```

It is recommended to execute your userscript at `document-start` so the patch is installed before the page begins making requests.

## Basic Usage

```javascript
VMFetch.patch();

VMFetch.intercept(
    "/api/items",

    request => {
        console.log("Request:", request);
    },

    response => {
        console.log("Response:", response);
    }
);
```

## Matching Requests

### URL substring

```javascript
VMFetch.intercept("/api/items", onRequest, onResponse);
```

### Regular expression

```javascript
VMFetch.intercept(/\/api\/items\/\d+/, onRequest, onResponse);
```

### Custom matcher

```javascript
VMFetch.intercept(
    url => url.startsWith("https://example.com/api/"),
    onRequest,
    onResponse
);
```

## Request Context

The request callback receives an object describing the outgoing request.

```javascript
{
    url,
    method,
    input,
    init,
    body,
    bodyJson,
    args
}
```

| Property   | Description                            |
| ---------- | -------------------------------------- |
| `url`      | Request URL                            |
| `method`   | HTTP method                            |
| `input`    | Original `fetch()` input               |
| `init`     | Original `RequestInit`                 |
| `body`     | Raw request body, if available         |
| `bodyJson` | Parsed JSON body, or `null`            |
| `args`     | Original arguments passed to `fetch()` |

## Response Context

The response callback receives:

```javascript
{
    request,
    response,
    url,
    status,
    ok,
    headers,
    body,
    bodyJson
}
```

| Property   | Description                     |
| ---------- | ------------------------------- |
| `request`  | Original request context        |
| `response` | Original `Response` object      |
| `headers`  | Response headers                |
| `body`     | Response body as text           |
| `bodyJson` | Parsed JSON response, or `null` |

## Notes

* VMFetch only intercepts requests made through the Fetch API.
* Requests made with `XMLHttpRequest` are not intercepted.
* Response bodies are read from a cloned response, so the page can still consume the original response normally.
* JSON parsing is attempted automatically. If parsing fails, `bodyJson` will be `null`.


## Requirements
- Violentmonkey or Tampermonkey
- `unsafeWindow`
