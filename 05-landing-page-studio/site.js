"use strict";
function validateEnquiry(fields) {
  const name = String(fields.name || "").trim();
  const email = String(fields.email || "").trim();
  const message = String(fields.message || "").trim();
  if (!name || name.length > 80) return "Provide a name (1–80 characters).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    return "Provide a valid email format.";
  if (message.length < 10 || message.length > 1000)
    return "Provide a project summary (10–1000 characters).";
  if (/[\u0000-\u001f\u007f]/.test(name + email + message))
    return "Remove control characters.";
  return null;
}
if (typeof document !== "undefined") {
  const form = document.getElementById("enquiry");
  const feedback = document.getElementById("feedback");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const error = validateEnquiry({
      name: form.elements.namedItem("name").value,
      email: form.elements.namedItem("email").value,
      message: form.elements.namedItem("message").value
    });
    feedback.textContent = error || "Looks valid. Demo only — nothing was sent or saved.";
  });
}
if (typeof module !== "undefined") module.exports = { validateEnquiry };
