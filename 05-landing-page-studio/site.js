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
function validateEnquiryFields(fields) {
  const error = validateEnquiry(fields);
  if (!error) return {error:null, field:null};
  const keys = ["name", "email", "message"];
  if (!fields || typeof fields !== "object")
    return {error, field:"name"};
  if (error === "Form values must be text.")
    return {error, field:keys.find(key => typeof fields[key] !== "string") || "name"};
  if (error.startsWith("Provide a name")) return {error, field:"name"};
  if (error.startsWith("Provide a valid email")) return {error, field:"email"};
  if (error.startsWith("Provide a project summary")) return {error, field:"message"};
  if (error === "Remove control characters.") {
    const control = /[\\u0000-\\u001f\\u007f]/;
    return {error, field:keys.find(key => control.test(fields[key])) || "name"};
  }
  return {error, field:"name"};
}
if (typeof document !== "undefined") {
  const form = document.getElementById("enquiry");
  const feedback = document.getElementById("feedback");
  const inputs = {name:form.elements.namedItem("name"),email:form.elements.namedItem("email"),message:form.elements.namedItem("message")};
  const errors = {name:document.getElementById("name-error"),email:document.getElementById("email-error"),message:document.getElementById("message-error")};
  function clearErrors() {
    for (const key of Object.keys(inputs)) {
      inputs[key].removeAttribute("aria-invalid");
      errors[key].textContent = "";
    }
  }
  for (const input of Object.values(inputs)) input.addEventListener("input", () => {
    clearErrors();
    feedback.setAttribute("role","status");
    feedback.textContent = "Nothing has been checked yet.";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();
    try {
    const result = validateEnquiryFields({
      name: form.elements.namedItem("name").value,
      email: form.elements.namedItem("email").value,
      message: form.elements.namedItem("message").value
    });
    if (result.error) {
      inputs[result.field].setAttribute("aria-invalid","true");
      errors[result.field].textContent = result.error;
      feedback.setAttribute("role","alert");
      feedback.textContent = "Please correct the highlighted field. Nothing was sent.";
      inputs[result.field].focus();
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
if (typeof module !== "undefined") module.exports = { validateEnquiry, validateEnquiryFields };
