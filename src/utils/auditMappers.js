/**
 * This module provides utility functions to map HTTP requests and responses
 * to audit log events in a healthcare application. It includes functions to
 * determine event types, resource types, sanitize request data, and build
 * audit metadata.
 */
const {
  EventType,
  ActionType,
  ResourceType,
  SeverityLevel,
  EVENT_CONFIG,
  HIPAA_SENSITIVE_ROUTES,
  SENSITIVE_FIELDS,
} = require("../constants/auditConstants");

const ROUTE_PATTERNS = [
  {
    pattern: /\/auth\/sign-in/i,
    success: EventType.USER_LOGIN,
    failure: EventType.USER_LOGIN_FAILED,
    resource: ResourceType.USER_ACCOUNT,
  },
  {
    pattern: /\/auth\/sign-up/i,
    event: EventType.USER_CREATED,
    resource: ResourceType.USER_ACCOUNT,
  },
  {
    pattern: /\/auth\/logout/i,
    event: EventType.USER_LOGOUT,
    resource: ResourceType.USER_ACCOUNT,
  },
  {
    pattern: /\/auth\/verify-email/i,
    event: EventType.USER_UPDATED,
    resource: ResourceType.USER_ACCOUNT,
  },
  {
    pattern: /\/users\/.*\/password/i,
    event: EventType.USER_PASSWORD_CHANGED,
    resource: ResourceType.USER_ACCOUNT,
  },
  {
    pattern: /\/users\/.*\/role/i,
    event: EventType.USER_ROLE_CHANGED,
    resource: ResourceType.USER_ACCOUNT,
  },
  {
    pattern: /\/users\/.*\/status/i,
    event: EventType.USER_DEACTIVATED,
    resource: ResourceType.USER_ACCOUNT,
  },
  {
    pattern: /\/(users|patients)\/search/i,
    event: EventType.PATIENT_SEARCHED,
    resource: ResourceType.USER_ACCOUNT,
  },
  {
    pattern: /\/admin\/bulk-upload/i,
    event: EventType.DOCUMENT_UPLOADED,
    resource: ResourceType.USER_ACCOUNT,
  },
  {
    pattern: /\/patients\/.+/i,
    methods: ["GET"],
    event: EventType.PATIENT_ACCESSED,
    resource: ResourceType.PATIENT_RECORD,
  },
  {
    pattern: /\/users\/.+/i,
    methods: ["GET"],
    event: EventType.PATIENT_ACCESSED,
    resource: ResourceType.USER_ACCOUNT,
  },
  {
    pattern: /\/patients/i,
    methods: ["POST"],
    event: EventType.PATIENT_CREATED,
    resource: ResourceType.PATIENT_RECORD,
  },
  {
    pattern: /\/users/i,
    methods: ["POST"],
    event: EventType.USER_CREATED,
    resource: ResourceType.USER_ACCOUNT,
  },
  {
    pattern: /\/users/i,
    methods: ["PUT", "PATCH"],
    event: EventType.USER_UPDATED,
    resource: ResourceType.USER_ACCOUNT,
  },
];

function matchRoutePattern(pattern, method, path) {
  if (!pattern.pattern.test(path)) return null;
  if (pattern.methods && !pattern.methods.includes(method)) return null;
  return pattern;
}

function determineEventType(method, path, statusCode) {
  const normalizedMethod = method.toUpperCase();
  const normalizedPath = path.toLowerCase();

  if (statusCode >= 500) return EventType.SYSTEM_ERROR;

  for (const pattern of ROUTE_PATTERNS) {
    const match = matchRoutePattern(pattern, normalizedMethod, normalizedPath);
    if (!match) continue;

    if (match.success && match.failure) {
      return statusCode >= 200 && statusCode < 300
        ? match.success
        : match.failure;
    }

    if (match.event) return match.event;
  }

  if (statusCode === 401 || statusCode === 403) {
    return EventType.UNAUTHORIZED_ACCESS_ATTEMPT;
  }

  return `HTTP_${normalizedMethod}_REQUEST`;
}

function getEventConfig(eventType, method, path, success) {
  const config = EVENT_CONFIG[eventType];

  if (!config) {
    return {
      severity: SeverityLevel.INFO,
      action: ActionType.ACCESS,
      description: `${method} request to ${path} ${success ? "successful" : "failed"}`,
    };
  }

  return {
    severity: config.severity,
    action: config.action,
    description:
      config.description ||
      `${method} request to ${path} ${success ? "successful" : "failed"}`,
  };
}

function determineResourceType(path) {
  const lowerPath = path.toLowerCase();

  if (lowerPath.includes("/patient")) return ResourceType.PATIENT_RECORD;
  if (lowerPath.includes("/user") || lowerPath.includes("/auth"))
    return ResourceType.USER_ACCOUNT;
  if (lowerPath.includes("/admin") || lowerPath.includes("/config"))
    return ResourceType.SYSTEM_CONFIG;

  return null;
}

function isHipaaSensitiveRoute(path) {
  const lowerPath = path.toLowerCase();
  return HIPAA_SENSITIVE_ROUTES.some((route) => lowerPath.includes(route));
}

function extractResourceId(req) {
  return (
    req.params?.id ||
    req.params?.patientId ||
    req.body?.userId ||
    req.query?.id ||
    null
  );
}

function sanitizeRequestBody(body) {
  if (!body || typeof body !== "object") return {};

  const sanitized = { ...body };
  SENSITIVE_FIELDS.forEach((field) => {
    if (sanitized[field]) sanitized[field] = "***REDACTED***";
  });

  return sanitized;
}

function buildAuditMetadata(req, res, duration) {
  return {
    method: req.method,
    path: req.path,
    query: req.query,
    params: req.params,
    body: sanitizeRequestBody(req.body),
    statusCode: res.statusCode,
    contentType: res.get("Content-Type"),
    duration: `${duration}ms`,
    requestSize: req.get("Content-Length") || 0,
    responseSize: res.get("Content-Length") || 0,
  };
}

module.exports = {
  determineEventType,
  getEventConfig,
  determineResourceType,
  isHipaaSensitiveRoute,
  extractResourceId,
  sanitizeRequestBody,
  buildAuditMetadata,
};
