"use strict";
// Every untrusted value is rendered with textContent. No HTML injection paths.
const byId = (id) => document.getElementById(id);
let csrfToken = null;
let currentUsername = null;

async function request(path, options = {}) {
  const response = await fetch(path, { cache: "no-store", credentials: "same-origin", ...options });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Request failed.");
  return result;
}

function showLogin() {
  csrfToken = null;
  currentUsername = null;
  byId("app").hidden = true;
  byId("login").hidden = false;
  byId("password").value = "";
}

async function showDashboard(session) {
  csrfToken = session.csrf;
  currentUsername = session.username;
  byId("current-user").textContent = currentUsername;
  byId("login").hidden = true;
  byId("app").hidden = false;
  await loadHistory();
}

async function loadHistory() {
  const data = await request("/api/jobs");
  const jobs = data.jobs || [];
  byId("metric-jobs").textContent = jobs.length.toLocaleString();
  byId("metric-accepted").textContent = jobs.reduce((n, item) => n + item.accepted, 0).toLocaleString();
  byId("metric-rejected").textContent = jobs.reduce((n, item) => n + item.rejected, 0).toLocaleString();
  const body = byId("history-rows");
  body.replaceChildren();
  byId("empty-state").hidden = jobs.length > 0;

  for (const job of jobs) {
    const row = document.createElement("tr");
    const add = (value, className = "") => {
      const cell = document.createElement("td");
      cell.textContent = String(value);
      if (className) cell.className = className;
      row.append(cell);
      return cell;
    };
    add(job.filename, "filename");
    add(new Date(job.created_at * 1000).toLocaleString());
    add(job.accepted, "count-good");
    add(job.rejected, "count-bad");
    const downloads = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "table-actions";
    for (const [kind, label] of [["cleaned", "Clean CSV"], ["rejected", "Audit CSV"]]) {
      const link = document.createElement("a");
      link.href = "/api/jobs/" + job.id + "/" + kind + ".csv";
      link.textContent = label;
      link.setAttribute("download", "");
      actions.append(link);
    }
    downloads.append(actions);
    row.append(downloads);
    const removeCell = document.createElement("td");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "secondary";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", "Delete job " + job.filename);
    remove.addEventListener("click", async () => {
      if (!confirm("Delete this processing job and its stored outputs?")) return;
      remove.disabled = true;
      try {
        await request("/api/jobs/" + job.id, {
          method: "DELETE", headers: { "X-CSRF-Token": csrfToken }
        });
        await loadHistory();
      } catch (error) {
        alert(error.message);
        remove.disabled = false;
      }
    });
    removeCell.append(remove);
    row.append(removeCell);
    body.append(row);
  }
}

byId("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = byId("login-submit");
  const error = byId("login-error");
  error.textContent = "";
  button.disabled = true;
  try {
    const session = await request("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: byId("username").value,
        password: byId("password").value
      })
    });
    await showDashboard(session);
  } catch (exception) {
    error.textContent = exception.message;
  } finally {
    button.disabled = false;
  }
});

byId("file").addEventListener("change", () => {
  const file = byId("file").files[0];
  byId("file-label").textContent = file ? file.name : "Choose a CSV file";
});

byId("upload-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = byId("file").files[0];
  const notice = byId("upload-feedback");
  const button = byId("process-button");
  notice.textContent = "";
  notice.classList.remove("error");
  if (!file) { notice.textContent = "Choose a CSV file first."; return; }
  if (file.size === 0 || file.size > 5000000) {
    notice.classList.add("error");
    notice.textContent = "Choose a nonempty file smaller than 5 MB.";
    return;
  }
  button.disabled = true;
  button.textContent = "Validating CSV...";
  try {
    const fileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 100);
    const response = await request("/api/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "text/csv",
        "X-CSRF-Token": csrfToken,
        "X-File-Name": fileName
      },
      body: file
    });
    notice.textContent = "Completed: " + response.job.accepted
      + " accepted; " + response.job.rejected + " flagged for review.";
    byId("upload-form").reset();
    byId("file-label").textContent = "Choose a CSV file";
    await loadHistory();
  } catch (exception) {
    notice.classList.add("error");
    notice.textContent = exception.message;
    if (exception.message === "Login required") showLogin();
  } finally {
    button.disabled = false;
    button.textContent = "Validate & clean CSV →";
  }
});

byId("refresh").addEventListener("click", async () => {
  try { await loadHistory(); }
  catch (error) { if (error.message === "Login required") showLogin(); else alert(error.message); }
});

byId("logout").addEventListener("click", async () => {
  try {
    await request("/api/logout", { method: "POST", headers: { "X-CSRF-Token": csrfToken } });
  } finally {
    showLogin();
  }
});

request("/api/me").then(showDashboard).catch(showLogin);
