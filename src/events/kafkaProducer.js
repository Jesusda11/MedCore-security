const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: process.env.AZURE_EVENT_HUB_CLIENT_ID,
  brokers: [process.env.AZURE_EVENT_HUB_BROKERS],
  ssl: true, 
  sasl: {
    mechanism: "plain",
    username: "$ConnectionString",
    password: process.env.AZURE_EVENT_HUB_CONNECTION_STRING,
  },
});

const producer = kafka.producer();

const publishDoctorStatusChange = async (doctor) => {
  await producer.connect();
  await producer.send({
    topic: process.env.AZURE_EVENT_HUB_TOPIC,
    messages: [
      {
        key: doctor.id,
        value: JSON.stringify({
          eventType: "doctor.status.changed",
          timestamp: new Date().toISOString(),
          doctorId: doctor.id,
          newStatus: doctor.status,
          specialty: doctor.specialty,
        }),
      },
    ],
  });
  console.log(`[Kafka/Azure] Evento publicado: doctor ${doctor.id} -> ${doctor.status}`);
};

module.exports = { publishDoctorStatusChange };
