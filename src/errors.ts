export class LinktoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LinktoError";
  }
}

export class LinktoNetworkError extends LinktoError {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "LinktoNetworkError";
    this.cause = cause;
  }
}

export interface FieldError {
  field: string;
  message: string;
}

export class LinktoApiError extends LinktoError {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: FieldError[];
  readonly docUrl?: string;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    fieldErrors?: FieldError[];
    docUrl?: string;
  }) {
    super(params.message);
    this.name = "LinktoApiError";
    this.status = params.status;
    this.code = params.code;
    this.fieldErrors = params.fieldErrors;
    this.docUrl = params.docUrl;
  }
}

export class LinktoRateLimitError extends LinktoApiError {
  readonly retryAfter: number;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    retryAfter: number;
    docUrl?: string;
  }) {
    super(params);
    this.name = "LinktoRateLimitError";
    this.retryAfter = params.retryAfter;
  }
}

export class LinktoQuotaExceededError extends LinktoApiError {
  readonly resource: string;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    resource: string;
    fieldErrors?: FieldError[];
    docUrl?: string;
  }) {
    super(params);
    this.name = "LinktoQuotaExceededError";
    this.resource = params.resource;
  }
}
