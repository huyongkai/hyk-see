// 事件类型
export const EVENTTYPES = {
  XHR: "xhr",
  FETCH: "fetch",
  CLICK: "click",
  HISTORY: "history",
  ERROR: "error",
  HASHCHANGE: "hashchange",
  UNHANDLEDREJECTION: "unhandledrejection",
  WHITESCREEN: "whitescreen",
  RESOURCE: "resource",
  DOM: "dom",
  VUE: "vue",
  REACT: "react",
  CUSTOM: "custom",
  PERFORMANCE: "performance",
  RECORDSCREEN: "recordscreen",
};

// 用户行为
export const BREADCRUMBTYPES = {
  HTTP: "http",
  CLICK: "click",
  ROUTE: "route",
  RESOURCE: "resource",
  CODEERROR: "codeerror",
  CUSTOM: "custom",
};

// 状态码
export const STATUS_CODE = {
  ERROR: "error",
  OK: "ok",
};

export const HTTPTYPE = {
  XHR: "xhr",
  FETCH: "fetch",
};

export const HTTP_CODE = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
};

export const EMethods = {
  Get: "GET",
  Post: "POST",
  Put: "PUT",
  Delete: "DELETE",
};

export const SpanStatus = {
  Ok: "ok",
  DeadlineExceeded: "deadline_exceeded",
  Unauthenticated: "unauthenticated",
  PermissionDenied: "permission_denied",
  NotFound: "not_found",
  ResourceExhausted: "resource_exhausted",
  InvalidArgument: "invalid_argument",
  Unimplemented: "unimplemented",
  Unavailable: "unavailable",
  InternalError: "internal_error",
  UnknownError: "unknown_error",
  Cancelled: "cancelled",
  AlreadyExists: "already_exists",
  FailedPrecondition: "failed_precondition",
  Aborted: "aborted",
  OutOfRange: "out_of_range",
  DataLoss: "data_loss",
};
