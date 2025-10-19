const {
  initialize,
  sendAuditEvent,
  disconnect,
} = require("../config/auditConfig");

class AuditInterceptor {
  constructor() {}

  async initialize() {
    await initialize();
  }

  auditInterceptor(req, res, next) {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function (body) {
      res.locals.responseBody = body;
      return originalSend.call(this, body);
    };

    next();

    res.on("finish", async () => {
      await this.captureHttpEvent(req, res, startTime);
    });
  }

  async captureHttpEvent(req, res, startTime) {
    try {
      const endTime = Date.now();
      const duration = endTime - startTime;

      let severity = "LOW";
      if (res.statusCode >= 500) severity = "CRITICAL";
      else if (res.statusCode >= 400) severity = "HIGH";
      else if (duration > 5000) severity = "MEDIUM";

      const eventType = this.determineEventType(
        req.method,
        req.originalUrl,
        res.statusCode,
      );

      const auditData = {
        eventType,
        source: "ms-security",
        userId: req.user?.id,
        userRole: req.user?.role,
        sessionId: req.user?.sessionId,
        severityLevel: severity,
        data: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get("User-Agent"),
          ipAddress: req.ip || req.connection.remoteAddress,
          queryParams: req.query,
          bodySize: req.get("Content-Length") || 0,
          responseSize: res.get("Content-Length") || 0,
          ...req.auditData,
        },
        hipaaCompliance: this.extractHipaaData(req, res),
        metadata: {
          timestamp: new Date().toISOString(),
          userRole: req.user?.role,
          endpoint: `${req.method} ${req.originalUrl}`,
        },
      };

      await sendAuditEvent(auditData);
    } catch (error) {
      console.error("Error capturing HTTP audit event:", error);
    }
  }

  determineEventType(method, path, statusCode) {
    method = method.toUpperCase();
    path = path.toLowerCase();

    if (path.includes("/sign-up")) return "USER_CREATED";
    if (path.includes("/sign-in")) return "USER_LOGIN";
    if (path.includes("/verify-email")) return "EMAIL_VERIFIED";
    if (path.includes("/resend-verification-code"))
      return "VERIFICATION_CODE_SENT";
    if (path.includes("/bulk-upload")) return "BULK_USER_UPLOAD";

    if (statusCode >= 500) return "SYSTEM_ERROR";
    if (statusCode === 401 || statusCode === 403) return "SECURITY_VIOLATION";

    return `HTTP_${method}_REQUEST`;
  }

  extractHipaaData(req, res) {
    const patientId =
      req.params?.patientId || req.body?.patientId || req.query?.patientId;
    const accessReason =
      req.body?.accessReason || req.query?.accessReason || "SYSTEM_ACCESS";

    if (patientId) {
      return {
        patientId,
        accessReason,
      };
    }

    return undefined;
  }

  async disconnect() {
    await disconnect();
  }
}

const auditInterceptor = new AuditInterceptor();
module.exports = {
  initialize: auditInterceptor.initialize.bind(auditInterceptor),
  auditInterceptor: auditInterceptor.auditInterceptor.bind(auditInterceptor),
  disconnect: auditInterceptor.disconnect.bind(auditInterceptor),
};
