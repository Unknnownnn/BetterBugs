type CaptureConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

type CaptureEventType = 'console' | 'network' | 'error';

type PageCaptureEnvelope = {
  source: 'BUGCATCHER_PAGE_CAPTURE_CHANNEL_V1';
  kind: 'event' | 'environment';
  payload: unknown;
};

type ConsoleEventPayload = {
  level: CaptureConsoleLevel;
  message: string;
  args?: unknown[];
  stack?: string;
};

type ErrorEventPayload = {
  message: string;
  stack?: string;
  type?: string;
  severity?: 'error' | 'unhandledrejection';
  source?: string;
  line?: number;
  column?: number;
};

type NetworkEventPayload = {
  method: string;
  url: string;
  status: number;
  request: {
    headers: Record<string, string>;
    body?: string;
    truncated?: boolean;
  };
  response: {
    headers: Record<string, string>;
    body?: string;
    size: number;
    truncated?: boolean;
  };
  timing: {
    start: number;
    end: number;
    duration: number;
  };
};

declare global {
  interface Window {
    __BUGCATCHER_PAGE_CAPTURE_INSTALLED__?: boolean;
  }
}

const CHANNEL_SOURCE = 'BUGCATCHER_PAGE_CAPTURE_CHANNEL_V1';
const MAX_BODY_SIZE = 1_048_576;

function postEnvelope(kind: PageCaptureEnvelope['kind'], payload: unknown): void {
  const envelope: PageCaptureEnvelope = {
    source: CHANNEL_SOURCE,
    kind,
    payload,
  };
  window.postMessage(envelope, '*');
}

function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (typeof value === 'object') {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function toConsoleMessage(args: unknown[]): string {
  return args
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry;
      }
      try {
        return JSON.stringify(serializeValue(entry));
      } catch {
        return String(entry);
      }
    })
    .join(' ')
    .slice(0, 2000);
}

function toTextPayload(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value.slice(0, MAX_BODY_SIZE);
  }

  if (value instanceof URLSearchParams) {
    return value.toString().slice(0, MAX_BODY_SIZE);
  }

  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    const output: Record<string, string> = {};
    value.forEach((entry, key) => {
      output[key] = typeof entry === 'string' ? entry : `[file:${entry.name}]`;
    });
    return JSON.stringify(output).slice(0, MAX_BODY_SIZE);
  }

  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return `[blob:${value.size}]`;
  }

  try {
    return JSON.stringify(serializeValue(value)).slice(0, MAX_BODY_SIZE);
  } catch {
    return String(value).slice(0, MAX_BODY_SIZE);
  }
}

function headersToRecord(headers: Headers): Record<string, string> {
  const output: Record<string, string> = {};
  headers.forEach((value, key) => {
    output[key] = value;
  });
  return output;
}

function parseXhrHeaders(rawHeaders: string): Record<string, string> {
  const output: Record<string, string> = {};
  const lines = rawHeaders.split(/\r?\n/);
  for (const line of lines) {
    if (!line) {
      continue;
    }
    const separator = line.indexOf(':');
    if (separator < 0) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!key) {
      continue;
    }
    output[key] = value;
  }
  return output;
}

function emitEvent(type: CaptureEventType, timestamp: number, payload: unknown): void {
  postEnvelope('event', {
    type,
    timestamp,
    payload,
  });
}

function detectEnvironment() {
  const ua = navigator.userAgent;
  const browser = ua.includes('Edg/')
    ? 'Edge'
    : ua.includes('Firefox/')
      ? 'Firefox'
      : ua.includes('Chrome/')
        ? 'Chrome'
        : 'Unknown';

  const browserVersionMatch = ua.match(/(Edg|Firefox|Chrome)\/([\d.]+)/);
  const browserVersion = browserVersionMatch?.[2] ?? 'Unknown';

  const os = ua.includes('Windows')
    ? 'Windows'
    : ua.includes('Mac OS X')
      ? 'macOS'
      : ua.includes('Linux')
        ? 'Linux'
        : 'Unknown';

  return {
    browser,
    browserVersion,
    os,
    osVersion: 'Unknown',
    language: navigator.language,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
  };
}

function captureConsole(): void {
  const levels: CaptureConsoleLevel[] = ['log', 'info', 'warn', 'error', 'debug'];

  for (const level of levels) {
    const original = console[level];
    console[level] = (...args: unknown[]) => {
      const payload: ConsoleEventPayload = {
        level,
        message: toConsoleMessage(args),
        args: args.map((entry) => serializeValue(entry)),
        stack: level === 'error' ? new Error().stack : undefined,
      };

      emitEvent('console', Date.now(), payload);
      original.apply(console, args as []);
    };
  }
}

function captureErrors(): void {
  window.addEventListener('error', (event) => {
    const payload: ErrorEventPayload = {
      message: event.message || 'Runtime error',
      stack: event.error instanceof Error ? event.error.stack : undefined,
      type: event.error instanceof Error ? event.error.name : 'RuntimeError',
      severity: 'error',
      source: event.filename,
      line: event.lineno,
      column: event.colno,
    };
    emitEvent('error', Date.now(), payload);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const payload: ErrorEventPayload = {
      message: reason instanceof Error ? reason.message : String(reason ?? 'Unhandled rejection'),
      stack: reason instanceof Error ? reason.stack : undefined,
      type: reason instanceof Error ? reason.name : 'NonErrorRejection',
      severity: 'unhandledrejection',
    };
    emitEvent('error', Date.now(), payload);
  });
}

function captureFetch(): void {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    const start = Date.now();
    const request = new Request(args[0], args[1]);

    try {
      const response = await originalFetch(...args);
      const end = Date.now();

      let responseBody: string | undefined;
      try {
        responseBody = (await response.clone().text()).slice(0, MAX_BODY_SIZE);
      } catch {
        responseBody = undefined;
      }

      const payload: NetworkEventPayload = {
        method: request.method,
        url: request.url,
        status: response.status,
        request: {
          headers: headersToRecord(request.headers),
          body: toTextPayload(args[1]?.body),
        },
        response: {
          headers: headersToRecord(response.headers),
          body: responseBody,
          size: Number(response.headers.get('content-length') ?? responseBody?.length ?? 0),
        },
        timing: {
          start,
          end,
          duration: end - start,
        },
      };

      emitEvent('network', end, payload);
      return response;
    } catch (error: unknown) {
      const end = Date.now();
      const payload: NetworkEventPayload = {
        method: request.method,
        url: request.url,
        status: 0,
        request: {
          headers: headersToRecord(request.headers),
          body: toTextPayload(args[1]?.body),
        },
        response: {
          headers: {},
          body: error instanceof Error ? error.message : 'Network request failed',
          size: 0,
        },
        timing: {
          start,
          end,
          duration: end - start,
        },
      };

      emitEvent('network', end, payload);
      throw error;
    }
  };
}

function captureXhr(): void {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  type XhrMeta = {
    method: string;
    url: string;
    start: number;
    requestHeaders: Record<string, string>;
    requestBody?: string;
  };

  const metaMap = new WeakMap<XMLHttpRequest, XhrMeta>();

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string,
    async?: boolean,
    username?: string | null,
    password?: string | null,
  ): void {
    metaMap.set(this, {
      method,
      url,
      start: 0,
      requestHeaders: {},
      requestBody: undefined,
    });

    originalOpen.call(this, method, url, async ?? true, username ?? null, password ?? null);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (header: string, value: string): void {
    const meta = metaMap.get(this);
    if (meta) {
      meta.requestHeaders[header] = value;
    }

    originalSetRequestHeader.call(this, header, value);
  };

  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null): void {
    const meta = metaMap.get(this) ?? {
      method: 'GET',
      url: window.location.href,
      start: 0,
      requestHeaders: {},
      requestBody: undefined,
    };

    meta.start = Date.now();
    meta.requestBody = toTextPayload(body);
    metaMap.set(this, meta);

    this.addEventListener(
      'loadend',
      () => {
        const end = Date.now();
        const responseText =
          this.responseType === '' || this.responseType === 'text'
            ? (this.responseText || '').slice(0, MAX_BODY_SIZE)
            : `[${this.responseType || 'unknown'}]`;

        const payload: NetworkEventPayload = {
          method: meta.method,
          url: new URL(meta.url, window.location.href).toString(),
          status: this.status,
          request: {
            headers: meta.requestHeaders,
            body: meta.requestBody,
          },
          response: {
            headers: parseXhrHeaders(this.getAllResponseHeaders()),
            body: responseText,
            size: responseText.length,
          },
          timing: {
            start: meta.start,
            end,
            duration: end - meta.start,
          },
        };

        emitEvent('network', end, payload);
      },
      { once: true },
    );

    originalSend.call(this, body);
  };
}

(() => {
  if (window.__BUGCATCHER_PAGE_CAPTURE_INSTALLED__) {
    return;
  }

  window.__BUGCATCHER_PAGE_CAPTURE_INSTALLED__ = true;

  postEnvelope('environment', detectEnvironment());
  captureConsole();
  captureErrors();
  captureFetch();
  captureXhr();
})();

export {};
