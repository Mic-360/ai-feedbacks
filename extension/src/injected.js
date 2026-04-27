(function () {
  const consoleLogs = [];
  const unhandledRejections = [];
  const networkSummary = [];
  const MAX_NETWORK = 50;
  const MAX_LOG_LEN = 2000;

  function safeStringify(value) {
    try {
      if (value instanceof Error) return value.stack || value.message || String(value);
      if (typeof value === "string") return value;
      return JSON.stringify(value);
    } catch (_e) {
      try {
        return String(value);
      } catch (_e2) {
        return "[unserializable]";
      }
    }
  }

  function pushLog(level, args) {
    try {
      const parts = [];
      for (let i = 0; i < args.length; i++) parts.push(safeStringify(args[i]));
      let line = "[" + level + "] " + parts.join(" ");
      if (line.length > MAX_LOG_LEN) line = line.slice(0, MAX_LOG_LEN) + "...[truncated]";
      consoleLogs.push(line);
    } catch (_e) {}
  }

  try {
    const originalError = console.error;
    console.error = function () {
      pushLog("error", arguments);
      try { originalError.apply(console, arguments); } catch (_e) {}
    };
  } catch (_e) {}

  try {
    const originalWarn = console.warn;
    console.warn = function () {
      pushLog("warn", arguments);
      try { originalWarn.apply(console, arguments); } catch (_e) {}
    };
  } catch (_e) {}

  try {
    window.addEventListener("unhandledrejection", function (event) {
      try {
        const reason = event && event.reason;
        const text = reason instanceof Error
          ? (reason.stack || reason.message || String(reason))
          : safeStringify(reason);
        unhandledRejections.push(text.length > MAX_LOG_LEN ? text.slice(0, MAX_LOG_LEN) + "...[truncated]" : text);
      } catch (_e) {}
    });
  } catch (_e) {}

  function pushNetwork(entry) {
    try {
      networkSummary.push(entry);
      if (networkSummary.length > MAX_NETWORK) networkSummary.shift();
    } catch (_e) {}
  }

  try {
    const originalFetch = window.fetch;
    if (typeof originalFetch === "function") {
      window.fetch = function (input, init) {
        const startedAt = Date.now();
        let method = "GET";
        let url = "";
        try {
          if (typeof input === "string") {
            url = input;
            if (init && init.method) method = String(init.method).toUpperCase();
          } else if (input && typeof input === "object") {
            url = input.url || "";
            method = (input.method || (init && init.method) || "GET").toUpperCase();
          }
        } catch (_e) {}
        const promise = originalFetch.apply(this, arguments);
        try {
          promise.then(
            function (response) {
              try {
                pushNetwork({
                  method: method,
                  url: url,
                  status: response && typeof response.status === "number" ? response.status : 0,
                  durationMs: Date.now() - startedAt,
                  timestamp: new Date(startedAt).toISOString(),
                });
              } catch (_e) {}
            },
            function (_err) {
              try {
                pushNetwork({
                  method: method,
                  url: url,
                  status: 0,
                  durationMs: Date.now() - startedAt,
                  timestamp: new Date(startedAt).toISOString(),
                });
              } catch (_e) {}
            }
          );
        } catch (_e) {}
        return promise;
      };
    }
  } catch (_e) {}

  try {
    const XHR = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
    if (XHR) {
      const originalOpen = XHR.open;
      const originalSend = XHR.send;
      XHR.open = function (method, url) {
        try {
          this.__aif_method = String(method || "GET").toUpperCase();
          this.__aif_url = String(url || "");
        } catch (_e) {}
        return originalOpen.apply(this, arguments);
      };
      XHR.send = function () {
        const xhr = this;
        const startedAt = Date.now();
        try {
          xhr.addEventListener("loadend", function () {
            try {
              pushNetwork({
                method: xhr.__aif_method || "GET",
                url: xhr.__aif_url || "",
                status: typeof xhr.status === "number" ? xhr.status : 0,
                durationMs: Date.now() - startedAt,
                timestamp: new Date(startedAt).toISOString(),
              });
            } catch (_e) {}
          });
        } catch (_e) {}
        return originalSend.apply(this, arguments);
      };
    }
  } catch (_e) {}

  function snapshotDom() {
    try {
      const html = document.documentElement ? document.documentElement.outerHTML : "";
      return {
        domLength: html.length,
        domExcerpt: html.slice(0, 4096),
      };
    } catch (_e) {
      return { domLength: 0, domExcerpt: "" };
    }
  }

  window.addEventListener("message", function (event) {
    try {
      if (!event || !event.data || event.data.type !== "GET_METADATA") return;
      const dom = snapshotDom();
      window.postMessage({
        type: "SEND_METADATA",
        payload: {
          console: consoleLogs.slice(),
          unhandledRejections: unhandledRejections.slice(),
          domLength: dom.domLength,
          domExcerpt: dom.domExcerpt,
          networkSummary: networkSummary.slice(),
        },
      }, "*");
    } catch (_e) {}
  });
})();
