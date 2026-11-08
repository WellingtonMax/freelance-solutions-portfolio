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
      : `Please correct the highlighted fields (${count} remaining). Nothing was sent.`;
  }
  function clearError(key) {
    inputs[key].removeAttribute("aria-invalid");
    errors[key].textContent = "";
  }
  function clearErrors() {
    for (const key of Object.keys(inputs)) clearError(key);
  }
  let hasAttemptedValidation = false;
  let lastSubmitHadErrors = false;
  for (const [key, input] of Object.entries(inputs)) input.addEventListener("input", () => {
    // Any edit invalidates a previously successful validation result.
    // After a failed submit, retain an error until this field actually validates.
    // Before submit, avoid showing errors while the visitor is still typing.
    if (input.getAttribute("aria-invalid") === "true" || lastSubmitHadErrors) {
      const values = Object.fromEntries(Object.entries(inputs).map(([field, element]) => [field, element.value]));
      const currentError = validateEnquiryAllFields(values)[key];
      if (currentError) {
        input.setAttribute("aria-invalid", "true");
        errors[key].textContent = currentError;
      } else {
        clearError(key);
      }
    }
    const remainingErrors = Object.keys(inputs).filter(field => inputs[field].getAttribute("aria-invalid") === "true");
    feedback.textContent = remainingErrors.length
      ? errorSummary(remainingErrors.length)
      : hasAttemptedValidation
        ? lastSubmitHadErrors
          ? "All highlighted errors are resolved. Validate again to check the form; nothing was sent."
          : "Form changed since validation. Validate again; nothing was sent."
        : "Nothing has been checked yet.";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    hasAttemptedValidation = true;
    clearErrors();
    try {
    const fieldErrors = validateEnquiryAllFields({
      name: form.elements.namedItem("name").value,
      email: form.elements.namedItem("email").value,
      message: form.elements.namedItem("message").value
    });
    const invalidFields = Object.keys(inputs).filter(key => fieldErrors[key]);
    lastSubmitHadErrors = invalidFields.length > 0;
    if (invalidFields.length) {
      for (const key of invalidFields) {
        inputs[key].setAttribute("aria-invalid", "true");
        errors[key].textContent = fieldErrors[key];
      }
      feedback.textContent = errorSummary(invalidFields.length);
      inputs[invalidFields[0]].focus();
    } else {
      feedback.textContent = "Fields look valid. Demo only — nothing was sent or saved.";
    }
    } catch (_) {
      feedback.textContent = "Validation could not complete. Try again; nothing was sent.";
    }
  });
}
if (typeof module !== "undefined") module.exports = { validateEnquiry, validateEnquiryFields, validateEnquiryAllFields };
