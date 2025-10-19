const { Kafka, logLevel } = require("kafkajs");
const { v4: uuidv4 } = require("uuid");
const { AZURE_EVENT_HUB_CONFIG } = require("../constants/azureConfig");

class AuditConfig {
  constructor() {
    this.kafka = null;
    this.producer = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        return;
      }

      const connectionString = AZURE_EVENT_HUB_CONFIG.CONNECTION_STRING;

      if (!connectionString) {
        return;
      }

      const kafkaConfig = {
        clientId: AZURE_EVENT_HUB_CONFIG.CLIENT_ID,
        brokers: AZURE_EVENT_HUB_CONFIG.BROKERS,
        ssl: true,
        sasl: {
          mechanism: "plain",
          username: "$ConnectionString",
          password: connectionString,
        },
        connectionTimeout: 10000,
        requestTimeout: 30000,
        logLevel: logLevel.WARN,
        retry: {
          initialRetryTime: 100,
          retries: 8,
        },
      };

      this.kafka = new Kafka(kafkaConfig);
      this.producer = this.kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000,
      });

      await this.producer.connect();
      this.isInitialized = true;
    } catch (error) {
      this.isInitialized = false;
    }
  }

  async sendAuditEvent(eventData) {
    try {
      if (!this.isInitialized || !this.producer) {
        return false;
      }

      const topic = AZURE_EVENT_HUB_CONFIG.TOPIC;

      const auditEvent = {
        eventId: eventData.eventId || uuidv4(),
        eventType: eventData.eventType,
        source: eventData.source || "ms-security",
        timestamp: new Date(),
        userId: eventData.userId || "anonymous",
        sessionId: eventData.sessionId,
        severityLevel: eventData.severityLevel,
        data: eventData.data,
        hipaaCompliance: eventData.hipaaCompliance,
        metadata: {
          ...eventData.metadata,
          serviceName: "ms-security",
          auditTimestamp: new Date().toISOString(),
        },
      };

      const message = {
        key: auditEvent.eventId,
        value: JSON.stringify(auditEvent),
        timestamp: Date.now().toString(),
        headers: {
          service: "ms-security",
          eventType: eventData.eventType,
          userId: eventData.userId || "anonymous",
          severityLevel: eventData.severityLevel,
        },
      };

      await this.producer.send({
        topic,
        messages: [message],
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.producer) {
        await this.producer.disconnect();
        this.isInitialized = false;
      }
    } catch (error) {}
  }
}

const auditConfig = new AuditConfig();

module.exports = {
  initialize: auditConfig.initialize.bind(auditConfig),
  sendAuditEvent: auditConfig.sendAuditEvent.bind(auditConfig),
  disconnect: auditConfig.disconnect.bind(auditConfig),
};
