function validateUserData({ email, current_password, identificacion, date_of_birth }) {
  if (!email || !current_password || !identificacion || !date_of_birth) {
    return "Faltan datos obligatorios";
  }

  if (!/^[0-9]{5,15}$/.test(identificacion)) {
    return "La identificación no es válida (debe contener solo números)";
  }

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return "El email no es válido";
  }

  if (current_password.length < 6 || !/^(?=.*[A-Za-z])(?=.*\d)/.test(current_password)) {
    return "La contraseña debe tener al menos una letra, un número y 6 caracteres";
  }

  const parsedDate = new Date(date_of_birth);
  if (isNaN(parsedDate.getTime()) || parsedDate > new Date()) {
    return "La fecha de nacimiento no es válida";
  }

  const age = new Date().getFullYear() - parsedDate.getFullYear();
  if (age < 0 || age > 100) {
    return "La edad debe estar entre 0 y 100 años";
  }

  return null; 
}

module.exports = { validateUserData };
