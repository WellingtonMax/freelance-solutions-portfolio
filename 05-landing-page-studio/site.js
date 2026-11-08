"use strict";
function validateEnquiry(fields) {
  if (!fields || ["name", "email", "message"].some(
    key => typeof fields[key] !== "string"
  )) return "Form values must be text.";
  const name = fields.name.trim();
  const email = fields.email.trim();
  const message = fields.message.trim();
  if (!name || name.length > 80) return "Provide a name (1–80 characters).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254
      || /[\u200B-\u200F\u2060\uFEFF\u0000-\u001F\u007F]/u.test(email))
    return "Provide a valid email format.";
  if (message.length < 10 || message.length > 1000)
    return "Provide a project summary (10–1000 characters).";
  if (/[\u0000-\u001f\u007f]/.test(name + email + message))
    return "Remove control characters.";
  return null;
}
function validateEnquiryAllFields(fields) {
  const errors = {};
  const keys = ["name", "email", "message"];
  if (!fields || typeof fields !== "object") {
    for (const key of keys) errors[key] = "Form values must be text.";
    return errors;
  }
  for (const key of keys) {
    if (typeof fields[key] !== "string") {
      errors[key] = "Form values must be text.";
    }
  }
  if (errors.name === undefined) {
    const name = fields.name.trim();
    if (!name || name.length > 80) errors.name = "Provide a name (1–80 characters).";
    else if (/[\u0000-\u001f\u007f]/.test(name)) errors.name = "Remove control characters.";
  }
  if (errors.email === undefined) {
    const email = fields.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254
        || /[\u200B-\u200F\u2060\uFEFF\u0000-\u001F\u007F]/u.test(email))
      errors.email = "Provide a valid email format.";
  }
  if (errors.message === undefined) {
    const message = fields.message.trim();
    if (message.length < 10 || message.length > 1000)
      errors.message = "Provide a project summary (10–1000 characters).";
    else if (/[\u0000-\u001f\u007f]/.test(message)) errors.message = "Remove control characters.";
  }
  return errors;
}
function validateEnquiryFields(fields) {
  const errors = validateEnquiryAllFields(fields);
  const field = ["name", "email", "message"].find(key => errors[key]);
  return field ? {error:errors[field], field} : {error:null, field:null};
}
if (typeof document !== "undefined") {
  const form = document.getElementById("enquiry");
  const feedback = document.getElementById("feedback");
  const inputs = {name:form.elements.namedItem("name"),email:form.elements.namedItem("email"),message:form.elements.namedItem("message")};
  const errors = {name:document.getElementById("name-error"),email:document.getElementById("email-error"),message:document.getElementById("message-error")};
  function errorSummary(count) {
    return count === 1
      ? "Please correct the highlighted field. Nothing was sent."
      : "Please correct the highlighted fields. Nothing was sent.";
  }
    function clearError(key) {
    inputs[key].removeAttribute("aria-invalid");
    errors[key].textContent = "";
  }
  function clearErrors() {
    for (const key of Object.keys(inputs)) clearError(key);
  }
  for (const [key, input] of Object.entries(inputs)) input.addEventListener("input", () => {
    clearError(key);
    const remainingErrors = Object.keys(inputs).filter(field => inputs[field].getAttribute("aria-invalid") === "true");
    feedback.setAttribute("role", remainingErrors.length ? "alert" : "status");
    feedback.textContent = remainingErrors.length
      ? errorSummary(remainingErrors.length)
      : "Nothing has been checked yet.";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();
    try {
    const fieldErrors = validateEnquiryAllFields({
      name: form.elements.namedItem("name").value,
      email: form.elements.namedItem("email").value,
      message: form.elements.namedItem("message").value
    });
    const invalidFields = Object.keys(inputs).filter(key => fieldErrors[key]);
    if (invalidFields.length) {
      for (const key of invalidFields) {
        inputs[key].setAttribute("aria-invalid", "true");
        errors[key].textContent = fieldErrors[key];
      }
      feedback.setAttribute("role","alert");
      feedback.textContent = errorSummary(invalidFields.length);
      inputs[invalidFields[0]].focus();
    } else {
      feedback.setAttribute("role","status");
      feedback.textContent = "Fields look valid. Demo only — nothing was sent or saved.";
    }
    } catch (_) {
      feedback.setAttribute("role","alert");
      feedback.textContent = "Validation could not complete. Try again; nothing was sent.";
    }
  });
}
if (typeof module !== "undefined") module.exports = { validateEnquiry, validateEnquiryFields, validateEnquiryAllFields };
