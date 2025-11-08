const { validateUserData } = require("../utils/validators");

/**
 * Integration tests for user data validation
 * Covers email, password, identification, and date of birth validations.
 */
describe("Validate tests", () => {
  test("should validate correct user data", () => {
    const validData = {
      email: "doctor@hospital.com",
      current_password: "SecurePass123",
      identificacion: "12345678",
      date_of_birth: "1985-05-15",
    };

    const result = validateUserData(validData);

    expect(result).toBeNull();
  });

  test("should reject missing email", () => {
    const invalidData = {
      email: "",
      current_password: "SecurePass123",
      identificacion: "12345678",
      date_of_birth: "1985-05-15",
    };

    const result = validateUserData(invalidData);

    expect(result).toBe("Faltan datos obligatorios");
  });

  test("should reject invalid email format", () => {
    const invalidData = {
      email: "invalid-email",
      current_password: "SecurePass123",
      identificacion: "12345678",
      date_of_birth: "1985-05-15",
    };

    const result = validateUserData(invalidData);

    expect(result).toBe("El email no es válido");
  });

  test("should reject weak password without numbers", () => {
    const invalidData = {
      email: "doctor@hospital.com",
      current_password: "OnlyLetters",
      identificacion: "12345678",
      date_of_birth: "1985-05-15",
    };

    const result = validateUserData(invalidData);

    expect(result).toBe(
      "La contraseña debe tener al menos una letra, un número y 6 caracteres",
    );
  });

  test("should reject password shorter than 6 characters", () => {
    const invalidData = {
      email: "doctor@hospital.com",
      current_password: "Pass1",
      identificacion: "12345678",
      date_of_birth: "1985-05-15",
    };

    const result = validateUserData(invalidData);

    expect(result).toBe(
      "La contraseña debe tener al menos una letra, un número y 6 caracteres",
    );
  });

  test("should reject invalid identification with letters", () => {
    const invalidData = {
      email: "doctor@hospital.com",
      current_password: "SecurePass123",
      identificacion: "ABC12345",
      date_of_birth: "1985-05-15",
    };

    const result = validateUserData(invalidData);

    expect(result).toBe(
      "La identificación no es válida (debe contener solo números)",
    );
  });

  test("should reject identification shorter than 5 digits", () => {
    const invalidData = {
      email: "doctor@hospital.com",
      current_password: "SecurePass123",
      identificacion: "1234",
      date_of_birth: "1985-05-15",
    };

    const result = validateUserData(invalidData);

    expect(result).toBe(
      "La identificación no es válida (debe contener solo números)",
    );
  });

  test("should reject identification longer than 15 digits", () => {
    const invalidData = {
      email: "doctor@hospital.com",
      current_password: "SecurePass123",
      identificacion: "1234567890123456",
      date_of_birth: "1985-05-15",
    };

    const result = validateUserData(invalidData);

    expect(result).toBe(
      "La identificación no es válida (debe contener solo números)",
    );
  });

  test("should reject invalid date format", () => {
    const invalidData = {
      email: "doctor@hospital.com",
      current_password: "SecurePass123",
      identificacion: "12345678",
      date_of_birth: "invalid-date",
    };

    const result = validateUserData(invalidData);

    expect(result).toBe("La fecha de nacimiento no es válida");
  });

  test("should reject future date of birth", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const invalidData = {
      email: "doctor@hospital.com",
      current_password: "SecurePass123",
      identificacion: "12345678",
      date_of_birth: futureDate.toISOString().split("T")[0],
    };

    const result = validateUserData(invalidData);

    expect(result).toBe("La fecha de nacimiento no es válida");
  });

  test("should reject age over 100 years", () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 101);

    const invalidData = {
      email: "doctor@hospital.com",
      current_password: "SecurePass123",
      identificacion: "12345678",
      date_of_birth: oldDate.toISOString().split("T")[0],
    };

    const result = validateUserData(invalidData);

    expect(result).toBe("La edad debe estar entre 0 y 100 años");
  });

  test("should accept valid edge case: 18 years old user", () => {
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

    const validData = {
      email: "young.doctor@hospital.com",
      current_password: "SecurePass123",
      identificacion: "12345678",
      date_of_birth: eighteenYearsAgo.toISOString().split("T")[0],
    };

    const result = validateUserData(validData);

    expect(result).toBeNull();
  });

  test("should accept valid edge case: 100 years old user", () => {
    const hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);

    const validData = {
      email: "old.patient@hospital.com",
      current_password: "SecurePass123",
      identificacion: "87654321",
      date_of_birth: hundredYearsAgo.toISOString().split("T")[0],
    };

    const result = validateUserData(validData);

    expect(result).toBeNull();
  });
});
