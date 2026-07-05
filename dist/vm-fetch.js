(function () {
    'use strict';

    const targetWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    if (targetWindow.VMFetch) {
        return;
    }

    class VMFetchInterceptor {
        constructor() {
            this.listeners = [];
            this.originalFetch = targetWindow.fetch;
            this.isPatched = false;
        }

        patch() {
            if (this.isPatched) {
                return this;
            }

            const self = this;

            targetWindow.fetch = async function (...args) {
                const context = await self.createRequestContext(args);

                for (const listener of self.matchingListeners(context.url)) {
                    if (listener.onRequest) {
                        await listener.onRequest(context);
                    }
                }

                const response = await self.originalFetch.apply(this, args);

                for (const listener of self.matchingListeners(context.url)) {
                    if (listener.onResponse) {
                        const responseContext = await self.createResponseContext(context, response);
                        await listener.onResponse(responseContext);
                    }
                }

                return response;
            };

            this.isPatched = true;
            return this;
        }

        intercept(pathOrMatcher, onRequest, onResponse) {
            this.listeners.push({
                matcher: pathOrMatcher,
                onRequest,
                onResponse,
            });

            return this;
        }

        matchingListeners(url) {
            return this.listeners.filter(listener => {
                const matcher = listener.matcher;

                if (typeof matcher === 'string') {
                    return url.includes(matcher);
                }

                if (matcher instanceof RegExp) {
                    return matcher.test(url);
                }

                if (typeof matcher === 'function') {
                    return matcher(url);
                }

                return false;
            });
        }

        async createRequestContext(args) {
            const [input, init = {}] = args;

            const request = input instanceof Request ? input : null;
            const url = request ? request.url : String(input);
            const method = init.method ?? request?.method ?? 'GET';

            let body = init.body;

            if (!body && request) {
                try {
                    body = await request.clone().text();
                } catch {
                    body = null;
                }
            }

            return {
                url,
                method,
                input,
                init,
                body,
                bodyJson: tryParseJson(body),
                args,
            };
        }

        async createResponseContext(requestContext, response) {
            let body = null;

            try {
                body = await response.clone().text();
            } catch {
                body = null;
            }

            return {
                request: requestContext,
                response,
                headers: Object.fromEntries(response.headers.entries()),
                body,
                bodyJson: tryParseJson(body),
            };
        }
    }

    function tryParseJson(value) {
        if (typeof value !== 'string') {
            return null;
        }

        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }

    targetWindow.VMFetch = new VMFetchInterceptor();
})();