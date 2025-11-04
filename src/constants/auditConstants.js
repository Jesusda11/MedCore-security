/**
 * This module defines constants and configurations for an audit logging system
 * in a healthcare application. It includes event types, user roles, severity levels,
 * action types, resource types, compliance standards, and mappings for HTTP methods
 * to action types. Additionally, it specifies sensitive routes and fields to ensure
 * compliance with regulations like HIPAA.
 */
const EventType = {
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  USER_LOGIN_FAILED: "USER_LOGIN_FAILED",
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DEACTIVATED: "USER_DEACTIVATED",
  USER_PASSWORD_CHANGED: "USER_PASSWORD_CHANGED",
  USER_ROLE_CHANGED: "USER_ROLE_CHANGED",
  PATIENT_CREATED: "PATIENT_CREATED",
  PATIENT_ACCESSED: "PATIENT_ACCESSED",
  PATIENT_SEARCHED: "PATIENT_SEARCHED",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_ACCESSED: "DOCUMENT_ACCESSED",
  SYSTEM_ERROR: "SYSTEM_ERROR",
  SECURITY_VIOLATION: "SECURITY_VIOLATION",
  UNAUTHORIZED_ACCESS_ATTEMPT: "UNAUTHORIZED_ACCESS_ATTEMPT",
  HTTP_POST_REQUEST: "HTTP_POST_REQUEST",
  HTTP_GET_REQUEST: "HTTP_GET_REQUEST",
  HTTP_PUT_REQUEST: "HTTP_PUT_REQUEST",
  HTTP_DELETE_REQUEST: "HTTP_DELETE_REQUEST",
  HTTP_PATCH_REQUEST: "HTTP_PATCH_REQUEST",
};

const UserRole = {
  ADMINISTRADOR: "ADMINISTRADOR",
  MEDICO: "MEDICO",
  ENFERMERA: "ENFERMERA",
  PACIENTE: "PACIENTE",
  SISTEMA: "SISTEMA",
  UNKNOWN: "UNKNOWN",
};

const SeverityLevel = {
  INFO: "INFO",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

const ActionType = {
  CREATE: "CREATE",
  READ: "READ",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  ACCESS: "ACCESS",
  SEARCH: "SEARCH",
  EXPORT: "EXPORT",
  UPLOAD: "UPLOAD",
  ERROR: "ERROR",
  VIOLATION: "VIOLATION",
};

const ResourceType = {
  PATIENT_RECORD: "PATIENT_RECORD",
  USER_ACCOUNT: "USER_ACCOUNT",
  SYSTEM_CONFIG: "SYSTEM_CONFIG",
  AUDIT_LOG: "AUDIT_LOG",
};

const ComplianceStandard = {
  HIPAA: "HIPAA",
  GDPR: "GDPR",
  SOC2: "SOC2",
};

const HTTP_METHOD_TO_ACTION = {
  POST: ActionType.CREATE,
  GET: ActionType.READ,
  PUT: ActionType.UPDATE,
  PATCH: ActionType.UPDATE,
  DELETE: ActionType.DELETE,
};

const EVENT_CONFIG = {
  [EventType.USER_LOGIN]: {
    severity: SeverityLevel.INFO,
    action: ActionType.LOGIN,
    description: "User login attempt successful",
  },
  [EventType.USER_LOGOUT]: {
    severity: SeverityLevel.INFO,
    action: ActionType.LOGOUT,
    description: "User logged out",
  },
  [EventType.USER_LOGIN_FAILED]: {
    severity: SeverityLevel.MEDIUM,
    action: ActionType.LOGIN,
    description: "Failed login attempt",
  },
  [EventType.USER_CREATED]: {
    severity: SeverityLevel.LOW,
    action: ActionType.CREATE,
    description: "New user account created",
  },
  [EventType.USER_UPDATED]: {
    severity: SeverityLevel.LOW,
    action: ActionType.UPDATE,
    description: "User account updated",
  },
  [EventType.USER_DEACTIVATED]: {
    severity: SeverityLevel.MEDIUM,
    action: ActionType.UPDATE,
    description: "User account deactivated",
  },
  [EventType.USER_PASSWORD_CHANGED]: {
    severity: SeverityLevel.MEDIUM,
    action: ActionType.UPDATE,
    description: "User password changed",
  },
  [EventType.USER_ROLE_CHANGED]: {
    severity: SeverityLevel.HIGH,
    action: ActionType.UPDATE,
    description: "User role modified",
  },
  [EventType.PATIENT_CREATED]: {
    severity: SeverityLevel.LOW,
    action: ActionType.CREATE,
    description: "New patient record created",
  },
  [EventType.PATIENT_ACCESSED]: {
    severity: SeverityLevel.MEDIUM,
    action: ActionType.ACCESS,
    description: "Patient record accessed",
  },
  [EventType.PATIENT_SEARCHED]: {
    severity: SeverityLevel.LOW,
    action: ActionType.SEARCH,
    description: "Patient records searched",
  },
  [EventType.DOCUMENT_UPLOADED]: {
    severity: SeverityLevel.LOW,
    action: ActionType.UPLOAD,
    description: "Document uploaded",
  },
  [EventType.DOCUMENT_ACCESSED]: {
    severity: SeverityLevel.MEDIUM,
    action: ActionType.ACCESS,
    description: "Document accessed",
  },
  [EventType.SYSTEM_ERROR]: {
    severity: SeverityLevel.HIGH,
    action: ActionType.ERROR,
    description: "System error occurred",
  },
  [EventType.SECURITY_VIOLATION]: {
    severity: SeverityLevel.CRITICAL,
    action: ActionType.VIOLATION,
    description: "Security violation detected",
  },
  [EventType.UNAUTHORIZED_ACCESS_ATTEMPT]: {
    severity: SeverityLevel.CRITICAL,
    action: ActionType.VIOLATION,
    description: "Unauthorized access attempt",
  },
  [EventType.HTTP_POST_REQUEST]: {
    severity: SeverityLevel.INFO,
    action: ActionType.CREATE,
  },
  [EventType.HTTP_GET_REQUEST]: {
    severity: SeverityLevel.INFO,
    action: ActionType.READ,
  },
  [EventType.HTTP_PUT_REQUEST]: {
    severity: SeverityLevel.INFO,
    action: ActionType.UPDATE,
  },
  [EventType.HTTP_DELETE_REQUEST]: {
    severity: SeverityLevel.LOW,
    action: ActionType.DELETE,
  },
  [EventType.HTTP_PATCH_REQUEST]: {
    severity: SeverityLevel.INFO,
    action: ActionType.UPDATE,
  },
};

const HIPAA_SENSITIVE_ROUTES = ["/patients"];
const EXCLUDED_ROUTES = [];

const SENSITIVE_FIELDS = [
  "password",
  "current_password",
  "new_password",
  "confirmPassword",
  "token",
  "accessToken",
  "refreshToken",
  "verificationCode",
  "creditCard",
];

module.exports = {
  EventType,
  UserRole,
  SeverityLevel,
  ActionType,
  ResourceType,
  ComplianceStandard,
  HTTP_METHOD_TO_ACTION,
  EVENT_CONFIG,
  HIPAA_SENSITIVE_ROUTES,
  EXCLUDED_ROUTES,
  SENSITIVE_FIELDS,
};
