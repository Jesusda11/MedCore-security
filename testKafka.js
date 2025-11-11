require("dotenv").config();
const { publishDoctorStatusChange } = require("./src/events/kafkaProducer");

(async () => {
  try {
    await publishDoctorStatusChange({
      id: "test-doctor-001",
      status: "INACTIVE",
      specialty: "Cardiología",
    });
    console.log("Mensaje enviado correctamente");
  } catch (err) {
    console.error("Error enviando mensaje:", err);
  }
})();
