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
  const idea = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  ideas.unshift(idea);
  saveIdeas();
}

function updateIdea(id, data) {
  ideas = ideas.map((idea) => (idea.id === id ? { ...idea, ...data } : idea));
  saveIdeas();
}

function deleteIdea(id) {
  ideas = ideas.filter((idea) => idea.id !== id);
  saveIdeas();
}

// ── Helpers ───────────────────────────────────

const STATUS_CONFIG = {
  idea:      { label: "Idea",      color: "#8b5cf6" },
  scripting: { label: "Scripting", color: "#3b82f6" },
  filming:   { label: "Filming",   color: "#f97316" },
  editing:   { label: "Editing",   color: "#eab308" },
  published: { label: "Published", color: "#22c55e" },
};

const STATUSES = [
  { value: "all",       label: "All Board" },
  { value: "idea",      label: "Ideas" },
  { value: "scripting", label: "Scripting" },
  { value: "filming",   label: "Filming" },
  { value: "editing",   label: "Editing" },
  { value: "published", label: "Published" },
];

function timeAgo(isoString) {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60)     return "just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
  if (activeFilter === "all") return ideas;
  return ideas.filter((i) => i.status === activeFilter);
}

// ── SVG icons ─────────────────────────────────

const ICON_PLUS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const ICON_CLOCK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const ICON_TRASH = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

// ── Render ────────────────────────────────────

function renderTabs() {
  const container = document.getElementById("tabs");
  container.innerHTML = STATUSES.map(({ value, label }) => {
    const count = value === "all"
      ? ideas.length
      : ideas.filter((i) => i.status === value).length;
    return `
      <button
        class="tab-btn${activeFilter === value ? " active" : ""}"
        data-filter="${value}"
        data-testid="tab-filter-${value}"
      >
        ${label}
        <span class="tab-count">${count}</span>
      </button>`;
  }).join("");

  container.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      renderTabs();
      renderCards();
    });
  });
}

function renderCards() {
  const container = document.getElementById("card-container");
  const list = filteredIdeas();

  if (list.length === 0) {
    const isFiltered = activeFilter !== "all";
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${ICON_PLUS}</div>
        <h3>No videos found</h3>
        <p>${
          isFiltered
            ? `You don't have any videos in the ${activeFilter} stage right now.`
            : "Your pipeline is empty. Start adding ideas to get your creative flow going."
        }</p>
        <button class="btn btn-primary" id="btn-add-empty" data-testid="button-add-idea-empty">
          ${ICON_PLUS} Add new idea
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
      style="animation-delay: ${index * 0.05}s"
    >
      <div class="card-top-bar" style="background: ${cfg.color};"></div>
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
  renderTabs();
  renderCards();
}

// ── Modal ─────────────────────────────────────

function openModal(id = null) {
  editingId = id;
  const overlay = document.getElementById("modal-overlay");
  const title   = document.getElementById("modal-title");
  const saveBtn = document.getElementById("btn-save");
  const deleteBtn = document.getElementById("btn-delete");

  clearErrors();

  if (id) {
    const idea = ideas.find((i) => i.id === id);
    title.textContent = "Edit Idea";
    saveBtn.textContent = "Save Changes";
    document.getElementById("field-title").value       = idea.title;
    document.getElementById("field-description").value = idea.description || "";
    document.getElementById("field-status").value      = idea.status;
    document.getElementById("field-category").value    = idea.category || "";
    deleteBtn.style.display = "inline-flex";
  } else {
    title.textContent = "New Video Idea";
    saveBtn.textContent = "Create Idea";
    document.getElementById("field-title").value       = "";
    document.getElementById("field-description").value = "";
    document.getElementById("field-status").value      = "idea";
    document.getElementById("field-category").value    = "";
    deleteBtn.style.display = "none";
  }

  overlay.classList.add("open");
  document.getElementById("field-title").focus();
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  editingId = null;
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach((el) => el.classList.remove("visible"));
}

function showError(fieldId, message) {
  const el = document.getElementById(`error-${fieldId}`);
  if (el) {
    el.textContent = message;
    el.classList.add("visible");
  }
}

function validateForm() {
  clearErrors();
  let valid = true;
  const title = document.getElementById("field-title").value.trim();

  if (!title) {
    showError("title", "Title is required.");
    valid = false;
  } else if (title.length > 100) {
    showError("title", "Title must be 100 characters or fewer.");
    valid = false;
  }

  const desc = document.getElementById("field-description").value.trim();
  if (desc.length > 500) {
    showError("description", "Description must be 500 characters or fewer.");
    valid = false;
  }

  const category = document.getElementById("field-category").value.trim();
  if (category.length > 50) {
    showError("category", "Category must be 50 characters or fewer.");
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

  if (editingId) {
    updateIdea(editingId, data);
  } else {
    addIdea(data);
  }

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

  // Header add button
  document.getElementById("btn-add-header").addEventListener("click", () => openModal());

  // Modal close targets
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById("btn-cancel").addEventListener("click", closeModal);

  // Save & delete
  document.getElementById("btn-save").addEventListener("click", handleSave);
  document.getElementById("btn-delete").addEventListener("click", handleDelete);

  // Keyboard close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Allow Enter to submit (but not in textarea)
  document.getElementById("idea-form").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      handleSave();
    }
  });

  render();
}

document.addEventListener("DOMContentLoaded", init);
