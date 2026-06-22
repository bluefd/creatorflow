// =============================================
//  CreatorFlow — script.js
// =============================================

const STORAGE_KEY = "creator-flow-ideas";

// ── State ─────────────────────────────────────

let ideas = [];
let activeFilter = "all";
let editingId = null;

// ── Persistence ───────────────────────────────

function loadIdeas() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    ideas = stored ? JSON.parse(stored) : [];
  } catch (e) {
    ideas = [];
  }
}

function saveIdeas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

// ── CRUD ──────────────────────────────────────

function addIdea(data) {
  ideas.unshift({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...data,
  });
  saveIdeas();
}

function updateIdea(id, data) {
  ideas = ideas.map((i) => (i.id === id ? { ...i, ...data } : i));
  saveIdeas();
}

function deleteIdea(id) {
  ideas = ideas.filter((i) => i.id !== id);
  saveIdeas();
}

// ── Config ────────────────────────────────────

const STATUS_CONFIG = {
  idea:      { label: "Idea",      color: "#AF52DE" },
  scripting: { label: "Scripting", color: "#007AFF" },
  filming:   { label: "Filming",   color: "#FF9500" },
  editing:   { label: "Editing",   color: "#FFCC00" },
  published: { label: "Published", color: "#34C759" },
};

const STATUSES = [
  { value: "all",       label: "All" },
  { value: "idea",      label: "Ideas" },
  { value: "scripting", label: "Scripting" },
  { value: "filming",   label: "Filming" },
  { value: "editing",   label: "Editing" },
  { value: "published", label: "Published" },
];

// ── Helpers ───────────────────────────────────

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)     return "Just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function filteredIdeas() {
  return activeFilter === "all"
    ? ideas
    : ideas.filter((i) => i.status === activeFilter);
}

// ── SVG icons ─────────────────────────────────

const ICON_PLUS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const ICON_CLOCK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const ICON_TRASH = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

// ── Render: segmented control ─────────────────

function renderSegments() {
  const container = document.getElementById("tabs");
  container.innerHTML = STATUSES.map(({ value, label }) => {
    const count = value === "all"
      ? ideas.length
      : ideas.filter((i) => i.status === value).length;
    return `
      <button
        class="seg-btn${activeFilter === value ? " active" : ""}"
        data-filter="${value}"
        data-testid="tab-filter-${value}"
      >
        ${label}
        <span class="seg-count">${count}</span>
      </button>`;
  }).join("");

  container.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      renderSegments();
      renderCards();
    });
  });
}

// ── Render: card grid ─────────────────────────

function renderCards() {
  const container = document.getElementById("card-container");
  const list = filteredIdeas();

  if (list.length === 0) {
    const isFiltered = activeFilter !== "all";
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${ICON_PLUS}</div>
        <h3>${isFiltered ? `Nothing in ${activeFilter} yet` : "Your pipeline is empty"}</h3>
        <p>${
          isFiltered
            ? `None of your videos are in the ${activeFilter} stage right now. Keep going — you'll get there.`
            : "When inspiration strikes, capture it here. Add your first idea and start moving it through your creative process."
        }</p>
        <button class="btn btn-primary" id="btn-add-empty" data-testid="button-add-idea-empty">
          ${ICON_PLUS} Add Your First Idea
        </button>
      </div>`;
    document.getElementById("btn-add-empty").addEventListener("click", () => openModal());
    return;
  }

  container.innerHTML = `<div class="card-grid">${list.map(renderCard).join("")}</div>`;

  container.querySelectorAll(".idea-card").forEach((card) => {
    card.addEventListener("click", () => openModal(card.dataset.id));
  });
}

function renderCard(idea, index) {
  const cfg = STATUS_CONFIG[idea.status];
  return `
    <div
      class="idea-card"
      data-id="${idea.id}"
      data-testid="card-idea-${idea.id}"
      style="animation-delay: ${index * 0.04}s"
    >
      <div class="card-color-strip" style="background: ${cfg.color};"></div>
      <div class="card-meta">
        <span class="status-badge ${idea.status}">${cfg.label}</span>
        ${idea.category ? `<span class="card-category">${escapeHtml(idea.category)}</span>` : ""}
      </div>
      <h3 class="card-title">${escapeHtml(idea.title)}</h3>
      ${idea.description ? `<p class="card-desc">${escapeHtml(idea.description)}</p>` : ""}
      <div class="card-footer">
        ${ICON_CLOCK}
        ${timeAgo(idea.createdAt)}
      </div>
    </div>`;
}

function render() {
  renderSegments();
  renderCards();
}

// ── Modal ─────────────────────────────────────

function openModal(id = null) {
  editingId = id;
  const overlay  = document.getElementById("modal-overlay");
  const title    = document.getElementById("modal-title");
  const saveBtn  = document.getElementById("btn-save");
  const delBtn   = document.getElementById("btn-delete");

  clearErrors();

  if (id) {
    const idea = ideas.find((i) => i.id === id);
    title.textContent = "Edit Video";
    saveBtn.textContent = "Save Changes";
    document.getElementById("field-title").value       = idea.title;
    document.getElementById("field-description").value = idea.description || "";
    document.getElementById("field-status").value      = idea.status;
    document.getElementById("field-category").value    = idea.category || "";
    delBtn.style.display = "inline-flex";
  } else {
    title.textContent = "New Video Idea";
    saveBtn.textContent = "Add Idea";
    document.getElementById("field-title").value       = "";
    document.getElementById("field-description").value = "";
    document.getElementById("field-status").value      = "idea";
    document.getElementById("field-category").value    = "";
    delBtn.style.display = "none";
  }

  overlay.classList.add("open");
  setTimeout(() => document.getElementById("field-title").focus(), 80);
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  editingId = null;
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach((el) => el.classList.remove("visible"));
}

function showError(id, msg) {
  const el = document.getElementById(`error-${id}`);
  if (el) { el.textContent = msg; el.classList.add("visible"); }
}

function validateForm() {
  clearErrors();
  let valid = true;
  const title = document.getElementById("field-title").value.trim();
  if (!title) {
    showError("title", "Please give your video a title.");
    valid = false;
  } else if (title.length > 100) {
    showError("title", "Try keeping the title under 100 characters.");
    valid = false;
  }
  const desc = document.getElementById("field-description").value.trim();
  if (desc.length > 500) {
    showError("description", "Notes are a bit long — please keep them under 500 characters.");
    valid = false;
  }
  const cat = document.getElementById("field-category").value.trim();
  if (cat.length > 50) {
    showError("category", "Category should be shorter — 50 characters max.");
    valid = false;
  }
  return valid;
}

function handleSave() {
  if (!validateForm()) return;
  const data = {
    title:       document.getElementById("field-title").value.trim(),
    description: document.getElementById("field-description").value.trim() || undefined,
    status:      document.getElementById("field-status").value,
    category:    document.getElementById("field-category").value.trim() || undefined,
  };
  editingId ? updateIdea(editingId, data) : addIdea(data);
  closeModal();
  render();
}

function handleDelete() {
  if (!editingId) return;
  deleteIdea(editingId);
  closeModal();
  render();
}

// ── Init ──────────────────────────────────────

function init() {
  loadIdeas();

  document.getElementById("btn-add-header").addEventListener("click", () => openModal());

  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById("btn-cancel").addEventListener("click", closeModal);
  document.getElementById("btn-save").addEventListener("click", handleSave);
  document.getElementById("btn-delete").addEventListener("click", handleDelete);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  document.getElementById("idea-form").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      handleSave();
    }
  });

  render();
}

document.addEventListener("DOMContentLoaded", init);
