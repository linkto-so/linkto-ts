import {
  type FieldError,
  LinktoApiError,
  LinktoError,
  LinktoNetworkError,
  LinktoQuotaExceededError,
  LinktoRateLimitError,
} from "../errors.js";

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

export interface ClientOptions {
  apiKey?: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
}

function getEnvApiKey(): string | undefined {
  try {
    if (typeof process !== "undefined" && process?.env) {
      const key = process.env.LINKTO_API_KEY;
      return key && key !== "undefined" ? key : undefined;
    }
  } catch {
    // Ignore runtime environment lookup errors
  }
  return undefined;
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  const lower = name.toLowerCase();
  return Object.keys(headers).some((k) => k.toLowerCase() === lower);
}

function deleteHeader(headers: Record<string, string>, name: string): void {
  const lower = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) {
      delete headers[key];
    }
  }
}

export class HttpClient {
  readonly baseUrl: string;
  readonly maxRetries: number;
  private readonly apiKey?: string;
  private readonly customHeaders?: Record<string, string>;
  private readonly fetchFn: typeof fetch;
  private readonly sleepFn: (ms: number) => Promise<void>;

  constructor(options: ClientOptions = {}) {
    const defaultApiKey = getEnvApiKey();
    this.apiKey = options.apiKey ?? defaultApiKey;

    const rawBaseUrl = options.baseUrl ?? "https://linkto.so";
    this.baseUrl = rawBaseUrl.replace(/\/+$/, "");

    this.maxRetries = options.maxRetries ?? 2;
    this.customHeaders = options.headers;
    this.fetchFn = options.fetch ?? ((...args) => globalThis.fetch(...args));
    this.sleepFn =
      options.sleep ??
      ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  private buildUrl(path: string): string {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }

  private buildHeaders(
    requestHeaders?: HeadersInit,
    hasBody?: boolean,
    defaultAccept = "application/json",
  ): Record<string, string> {
    const merged: Record<string, string> = {
      Accept: defaultAccept,
      "X-Client": "linkto-ts/0.1.0",
    };

    if (this.apiKey) {
      merged.Authorization = `Bearer ${this.apiKey}`;
    }

    if (this.customHeaders) {
      Object.assign(merged, this.customHeaders);
    }

    if (requestHeaders) {
      if (
        (typeof Headers !== "undefined" && requestHeaders instanceof Headers) ||
        (typeof (requestHeaders as { forEach?: unknown }).forEach ===
          "function" &&
          typeof (requestHeaders as { get?: unknown }).get === "function")
      ) {
        (requestHeaders as Headers).forEach((value, key) => {
          deleteHeader(merged, key);
          merged[key] = value;
        });
      } else if (Array.isArray(requestHeaders)) {
        for (const [key, value] of requestHeaders) {
          deleteHeader(merged, key);
          merged[key] = value;
        }
      } else {
        for (const [key, value] of Object.entries(requestHeaders)) {
          deleteHeader(merged, key);
          merged[key] = value;
        }
      }
    }

    if (hasBody && !hasHeader(merged, "content-type")) {
      merged["Content-Type"] = "application/json";
    }

    return merged;
  }

  private serializeBody(body: unknown): BodyInit | null | undefined {
    if (body === undefined || body === null) {
      return undefined;
    }
    if (
      typeof body === "object" &&
      typeof (body as { append?: unknown }).append !== "function" &&
      !(body instanceof Blob) &&
      !(body instanceof ArrayBuffer) &&
      !ArrayBuffer.isView(body) &&
      !(typeof ReadableStream !== "undefined" && body instanceof ReadableStream)
    ) {
      return JSON.stringify(body);
    }
    return body as BodyInit;
  }

  private parseRetryAfter(header: string | null): number | null {
    if (!header) return null;
    const seconds = Number.parseInt(header, 10);
    if (!Number.isNaN(seconds) && seconds >= 0) {
      return seconds;
    }
    const dateMs = Date.parse(header);
    if (!Number.isNaN(dateMs)) {
      const diffSeconds = Math.ceil((dateMs - Date.now()) / 1000);
      return diffSeconds > 0 ? diffSeconds : 0;
    }
    return null;
  }

  private async parseResponseBody(
    res: Response,
  ): Promise<{ json?: unknown; text?: string }> {
    try {
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        return { json, text };
      } catch {
        return { text };
      }
    } catch {
      return {};
    }
  }

  private extractErrorInfo(
    res: Response,
    body: { json?: unknown; text?: string },
    defaultCode?: string,
    defaultMessage?: string,
  ): {
    code: string;
    message: string;
    fieldErrors?: FieldError[];
    docUrl?: string;
    resource?: string;
  } {
    const json = body.json as
      | {
          error?: {
            code?: string;
            message?: string;
            errors?: FieldError[];
            fieldErrors?: FieldError[];
            docUrl?: string;
            doc_url?: string;
            resource?: string;
          };
          code?: string;
          message?: string;
          errors?: FieldError[];
          fieldErrors?: FieldError[];
          docUrl?: string;
          doc_url?: string;
          resource?: string;
        }
      | undefined;

    if (json && typeof json === "object") {
      const errorObj =
        json.error && typeof json.error === "object" ? json.error : json;
      const code =
        typeof errorObj.code === "string"
          ? errorObj.code
          : (defaultCode ?? `http_${res.status}`);
      const message =
        typeof errorObj.message === "string"
          ? errorObj.message
          : (defaultMessage ?? res.statusText ?? `HTTP ${res.status}`);
      const fieldErrors = Array.isArray(errorObj.fieldErrors)
        ? errorObj.fieldErrors
        : Array.isArray(errorObj.errors)
          ? errorObj.errors
          : undefined;
      const docUrl =
        typeof errorObj.docUrl === "string"
          ? errorObj.docUrl
          : typeof errorObj.doc_url === "string"
            ? errorObj.doc_url
            : typeof json.docUrl === "string"
              ? json.docUrl
              : typeof json.doc_url === "string"
                ? json.doc_url
                : undefined;
      const resource =
        typeof errorObj.resource === "string"
          ? errorObj.resource
          : typeof json.resource === "string"
            ? json.resource
            : undefined;

      return { code, message, fieldErrors, docUrl, resource };
    }

    return {
      code: defaultCode ?? `http_${res.status}`,
      message: body.text || res.statusText || `HTTP ${res.status}`,
    };
  }

  private handleErrorResponse(
    res: Response,
    body: { json?: unknown; text?: string },
  ): never {
    const { code, message, fieldErrors, docUrl, resource } =
      this.extractErrorInfo(res, body);

    const isQuotaCode =
      code === "quota_exceeded" ||
      code === "quota_limit_exceeded" ||
      code.includes("quota") ||
      code.endsWith("_limit_exceeded");
    const isQuotaStatus =
      res.status === 401 || res.status === 402 || res.status === 403;

    if ((isQuotaStatus && isQuotaCode) || res.status === 402 || isQuotaCode) {
      const status: 401 | 402 | 403 = isQuotaStatus ? res.status : 403;
      const resolvedResource =
        resource ??
        (code.includes("link") || message.toLowerCase().includes("link")
          ? "links"
          : code.includes("click") || message.toLowerCase().includes("click")
            ? "clicks"
            : "workspace");

      throw new LinktoQuotaExceededError({
        status,
        code,
        message,
        resource: resolvedResource,
        fieldErrors,
        docUrl,
      });
    }

    throw new LinktoApiError({
      status: res.status,
      code,
      message,
      fieldErrors,
      docUrl,
    });
  }

  private async execute(
    path: string,
    options: RequestInit = {},
    defaultAccept = "application/json",
  ): Promise<Response> {
    const url = this.buildUrl(path);
    const body = this.serializeBody(options.body);
    const hasBody = body !== undefined && body !== null;
    const headers = this.buildHeaders(options.headers, hasBody, defaultAccept);

    const reqInit: RequestInit = {
      ...options,
      headers,
      body,
    };

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      let res: Response;
      try {
        res = await this.fetchFn(url, reqInit);
      } catch (err) {
        if (err instanceof LinktoError) {
          throw err;
        }
        const message = err instanceof Error ? err.message : String(err);
        throw new LinktoNetworkError(message, err);
      }

      if (res.status === 429) {
        const retryAfterSeconds = this.parseRetryAfter(
          res.headers.get("retry-after"),
        );

        if (attempt < this.maxRetries) {
          const delaySeconds =
            retryAfterSeconds !== null ? retryAfterSeconds : 2 ** attempt;
          await this.sleepFn(delaySeconds * 1000);
          continue;
        }

        const errorData = await this.parseResponseBody(res);
        const { code, message, docUrl } = this.extractErrorInfo(
          res,
          errorData,
          "rate_limit_exceeded",
          "Too many requests",
        );
        throw new LinktoRateLimitError({
          status: 429,
          code,
          message,
          retryAfter: retryAfterSeconds !== null ? retryAfterSeconds : 1,
          docUrl,
        });
      }

      if (!res.ok) {
        const errorData = await this.parseResponseBody(res);
        this.handleErrorResponse(res, errorData);
      }

      return res;
    }

    throw new LinktoNetworkError("Request failed after maximum retries");
  }

  async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await this.execute(path, options, "application/json");
    if (res.status === 204) {
      return undefined as unknown as T;
    }
    const text = await res.text();
    if (!text) {
      return undefined as unknown as T;
    }
    const json = JSON.parse(text);
    if (json && typeof json === "object" && "data" in json) {
      return (json as { data: T }).data;
    }
    return json as T;
  }

  async requestText(path: string, options?: RequestInit): Promise<string> {
    const res = await this.execute(path, options, "*/*");
    return await res.text();
  }
}
