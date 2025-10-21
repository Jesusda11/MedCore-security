const axios = require("axios");

/**
 * Service to interact with the ms-patient-ehr microservice for patient management.
 */
const patientService = {
  async createPatient(userId, token) {
    try {
      const res = await axios.post(
        `${process.env.MS_PATIENT}/patients`,
        {
          userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      return res.data;
    } catch (error) {
      throw new Error("Error creating patient in ms-patient-ehr");
    }
  },
};

module.exports = patientService;
