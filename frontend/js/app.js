import { recordService } from "./data.js";

const $ = selector => document.querySelector(selector);
const form = $("#record-form");
const titleInput = $("#title");
const categoryInput = $("#category");
const descriptionInput = $("#description");
const statusInput = $("#status");
const editingId = $("#editing-id");
const recordsBody = $("#records-body");
const recentBody = $("#recent-records");
const recordsEmpty = $("#records-empty");
const recentEmpty = $("#recent-empty");
const searchInput = $("#search-input");
const statusFilter = $("#status-filter");
const detailDialog = $("#detail-dialog");
let toastTimer;

function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function statusClass(status) {
  return status === "In progress" ? "status-in-progress" : status === "Completed" ? "status-completed" : "status-pending";
}
function badge(status) {
  return `<span class="status-badge ${statusClass(status)}">${escapeText(status)}</span>`;
}
function showToast(message, type = "success") {
  const toast = $("#toast");
  $("#toast-message").textContent = message;
  $(".toast-icon").textContent = type === "error" ? "!" : "✓";
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}
function formatId(id) { return `#${String(id).padStart(3,"0")}`; }

async function render() {
  const all = await recordService.list();
  const query = searchInput.value.trim().toLowerCase();
  const filter = statusFilter.value;
  const visible = all.filter(record =>
    record.title.toLowerCase().includes(query) && (filter === "All" || record.status === filter)
  );
  $("#stat-total").textContent = all.length;
  $("#stat-pending").textContent = all.filter(r => r.status === "Pending").length;
  $("#stat-progress").textContent = all.filter(r => r.status === "In progress").length;
  $("#stat-completed").textContent = all.filter(r => r.status === "Completed").length;
  $("#result-count").textContent = `${visible.length} ${visible.length === 1 ? "record" : "records"}`;
  recordsEmpty.hidden = visible.length !== 0;
  recordsBody.innerHTML = visible.map(record => rowMarkup(record, true)).join("");
  const recent = [...all].sort((a,b) => b.id-a.id).slice(0,5);
  recentEmpty.hidden = recent.length !== 0;
  recentBody.innerHTML = recent.map(record => rowMarkup(record, false)).join("");
}
function rowMarkup(record, showActions) {
  return `<tr>
    <td class="request-cell"><strong>${escapeText(record.title)}</strong><small>Campus maintenance request</small></td>
    <td class="category-text">${escapeText(record.category)}</td>
    <td>${badge(record.status)}</td>
    <td><span class="record-id">${formatId(record.id)}</span></td>
    <td>${showActions ? `<div class="row-actions"><button class="action-button" data-action="view" data-id="${record.id}">View</button><button class="action-button" data-action="edit" data-id="${record.id}">Edit</button><button class="action-button delete" data-action="delete" data-id="${record.id}">Delete</button></div>` : `<button class="action-button" data-action="view" data-id="${record.id}">View ↗</button>`}</td>
  </tr>`;
}
function validateRecord() {
  const record = {
    title:titleInput.value.trim(),
    category:categoryInput.value.trim(),
    description:descriptionInput.value.trim(),
    status:statusInput.value
  };
  if (record.title.length < 3 || record.title.length > 80) return {error:"Title must contain 3 to 80 characters."};
  if (record.category.length < 2 || record.category.length > 40) return {error:"Choose a valid category (2 to 40 characters)."};
  if (record.description.length < 5 || record.description.length > 300) return {error:"Description must contain 5 to 300 characters."};
  if (!["Pending","In progress","Completed"].includes(record.status)) return {error:"Choose a valid request status."};
  return {record};
}
function resetForm() {
  form.reset();
  editingId.value = "";
  $("#form-heading").textContent = "Log a new issue";
  $("#submit-button").innerHTML = 'Save request <span>→</span>';
  $("#cancel-edit").hidden = true;
  $("#char-count").textContent = "0 / 300";
}
async function editRecord(id) {
  const record = await recordService.get(id);
  editingId.value = record.id;
  titleInput.value = record.title;
  categoryInput.value = record.category;
  descriptionInput.value = record.description;
  statusInput.value = record.status;
  $("#form-heading").textContent = `Edit request ${formatId(record.id)}`;
  $("#submit-button").innerHTML = 'Update request <span>→</span>';
  $("#cancel-edit").hidden = false;
  $("#char-count").textContent = `${record.description.length} / 300`;
  $("#manage").scrollIntoView({behavior:"smooth"});
  titleInput.focus({preventScroll:true});
}
async function viewRecord(id) {
  const record = await recordService.get(id);
  $("#detail-id").textContent = `MAINTENANCE REQUEST / ${formatId(record.id)}`;
  $("#detail-title").textContent = record.title;
  $("#detail-status").className = `status-badge ${statusClass(record.status)}`;
  $("#detail-status").textContent = record.status;
  $("#detail-category").textContent = record.category;
  $("#detail-record-id").textContent = formatId(record.id);
  $("#detail-description").textContent = record.description;
  $("#detail-edit").dataset.id = record.id;
  detailDialog.showModal();
}
async function deleteRecord(id) {
  const record = await recordService.get(id);
  const confirmed = window.confirm(`Delete "${record.title}" (${formatId(record.id)})?\n\nThis action cannot be undone.`);
  if (!confirmed) {
    showToast("Deletion cancelled. The request is still saved.");
    return;
  }
  await recordService.remove(id);
  if (editingId.value === String(id)) resetForm();
  await render();
  showToast("Request deleted successfully.");
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const result = validateRecord();
  if (result.error) {
    showToast(result.error, "error");
    return;
  }
  try {
    if (editingId.value) {
      await recordService.update(editingId.value, result.record);
      showToast("Request updated successfully.");
    } else {
      await recordService.create(result.record);
      showToast("New maintenance request saved.");
    }
    resetForm();
    await render();
  } catch (error) {
    showToast(error.message || "Something went wrong.", "error");
  }
});
$("#cancel-edit").addEventListener("click", () => { resetForm(); showToast("Edit cancelled."); });
$("#new-request-button").addEventListener("click", () => { resetForm(); titleInput.focus(); });
$("#hero-add").addEventListener("click", () => { resetForm(); setTimeout(() => titleInput.focus(), 100); });
descriptionInput.addEventListener("input", () => { $("#char-count").textContent = `${descriptionInput.value.length} / 300`; });
searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);

document.addEventListener("click", async event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  try {
    if (button.dataset.action === "view") await viewRecord(id);
    if (button.dataset.action === "edit") await editRecord(id);
    if (button.dataset.action === "delete") await deleteRecord(id);
  } catch (error) { showToast(error.message || "Unable to complete that action.", "error"); }
});
$("#close-detail").addEventListener("click", () => detailDialog.close());
$("#close-detail-bottom").addEventListener("click", () => detailDialog.close());
$("#detail-edit").addEventListener("click", async event => {
  const id = event.currentTarget.dataset.id;
  detailDialog.close();
  await editRecord(id);
});
detailDialog.addEventListener("click", event => {
  if (event.target === detailDialog) detailDialog.close();
});

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));
    link.classList.add("active");
    $("#page-label").textContent = link.textContent.trim();
    $("#sidebar").classList.remove("open");
  });
});
$("#mobile-menu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#today-label").textContent = new Intl.DateTimeFormat("en-ZM",{day:"2-digit",month:"short",year:"numeric"}).format(new Date()).toUpperCase();

await render();
