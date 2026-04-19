const VIDEO_URL = "background.mp4";

let tasks = [];
let currentFilter = "all";
let currentUser   = "";

// ── VIDEO ────────────────────────────────────────────
function setVideo(url) {
  const v = document.getElementById("bgVideo");
  if (url) {
    if (v.getAttribute("src") !== url) { v.src = url; v.load(); v.play(); }
  } else {
    v.pause(); v.removeAttribute("src"); v.load();
  }
}

// ── NAV ──────────────────────────────────────────────
function goToLogin() {
  document.getElementById("landingPage").style.display = "none";
  document.getElementById("loginPage").style.display   = "flex";
  setVideo(VIDEO_URL);
}

function login() {
  const name = document.getElementById("username").value.trim();
  if (!name) { document.getElementById("username").focus(); return; }
  currentUser = name;
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("appPage").style.display   = "block";
  document.getElementById("greetMsg").textContent    = "Hello, " + name + " 👋";
  document.getElementById("dateStr").textContent     = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric"
  });
  setVideo(null);
  loadTasks();
  renderTasks();

  // On mobile default to tasks view; on desktop both views are always visible
  if (window.innerWidth <= 768) {
    showView("tasks");
  }
}

function logout() {
  saveTasks();
  document.getElementById("appPage").style.display  = "none";
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("username").value = "";
  tasks = []; currentUser = "";
  setVideo(VIDEO_URL);
}

// ── ADD TASK ─────────────────────────────────────────
function openTaskMeta() {
  const txt = document.getElementById("taskInput").value.trim();
  if (!txt) { document.getElementById("taskInput").focus(); return; }
  document.getElementById("taskMetaPanel").style.display = "block";
}

function closeTaskMeta() {
  document.getElementById("taskMetaPanel").style.display = "none";
}

function addTask() {
  const text = document.getElementById("taskInput").value.trim();
  if (!text) return;
  tasks.push({
    id:       Date.now(),
    text,
    priority: document.getElementById("priority").value,
    due:      document.getElementById("dueDate").value,
    category: document.getElementById("category").value.trim(),
    done:     false
  });
  document.getElementById("taskInput").value  = "";
  document.getElementById("dueDate").value    = "";
  document.getElementById("category").value   = "";
  document.getElementById("priority").value   = "Medium";
  closeTaskMeta();
  saveTasks();
  renderTasks();
}

function toggleDone(id) {
  const t = tasks.find(t => t.id === id);
  if (t) t.done = !t.done;
  saveTasks(); renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks(); renderTasks();
}

// ── FILTER & RENDER ───────────────────────────────────
function setFilter(f, btn) {
  currentFilter = f;
  // Sync desktop sidebar buttons
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  // Sync mobile dropdown
  const mobileSelect = document.querySelector(".mobile-filter-select");
  if (mobileSelect) mobileSelect.value = f;
  renderTasks();
}

function renderTasks() {
  const query    = (document.getElementById("search")?.value || "").toLowerCase();
  const filtered = tasks.filter(t => {
    if (currentFilter === "pending"   &&  t.done) return false;
    if (currentFilter === "completed" && !t.done) return false;
    if (query && !t.text.toLowerCase().includes(query)) return false;
    return true;
  });

  // stats
  const total   = tasks.length;
  const pending = tasks.filter(t => !t.done).length;
  const done    = tasks.filter(t =>  t.done).length;

  document.getElementById("statTotal").textContent   = total;
  document.getElementById("statPending").textContent = pending;
  document.getElementById("statDone").textContent    = done;

  // progress bar
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const bar = document.getElementById("progressBar");
  const pctLabel = document.getElementById("progressPct");
  if (bar)      bar.style.width = pct + "%";
  if (pctLabel) pctLabel.textContent = pct + "%";

  const ul    = document.getElementById("taskList");
  const empty = document.getElementById("emptyState");

  if (!filtered.length) {
    ul.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  ul.innerHTML = filtered.map(t => `
    <li class="priority-${t.priority}">
      <div class="task-info">
        <span class="task-name ${t.done ? "done" : ""}">${escapeHtml(t.text)}</span>
        <div class="task-sub">
          <span class="task-tag">${priorityDot(t.priority)} ${t.priority}</span>
          ${t.due      ? `<span class="task-tag">📅 ${t.due}</span>`                  : ""}
          ${t.category ? `<span class="task-tag">🏷 ${escapeHtml(t.category)}</span>` : ""}
        </div>
      </div>
      <div class="task-actions">
        <button class="done-btn" onclick="toggleDone(${t.id})">${t.done ? "↩ Undo" : "✓ Done"}</button>
        <button class="del-btn"  onclick="deleteTask(${t.id})">Delete</button>
      </div>
    </li>
  `).join("");
}

function priorityDot(p) {
  return p === "High" ? "🔴" : p === "Medium" ? "🟡" : "🟢";
}

// ── THEME ─────────────────────────────────────────────
function toggleTheme() {
  const light = document.body.classList.toggle("light");
  document.querySelector(".theme-btn").textContent = light ? "🌙 Dark" : "☀️ Light";
}

// ── PERSIST ───────────────────────────────────────────
function saveTasks() {
  if (currentUser) localStorage.setItem("planr_" + currentUser, JSON.stringify(tasks));
}
function loadTasks() {
  const s = currentUser && localStorage.getItem("planr_" + currentUser);
  tasks = s ? JSON.parse(s) : [];
}

// ── UTILS ─────────────────────────────────────────────
function escapeHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── VIEW SWITCHER (mobile only) ───────────────────────
function showView(view) {
  // On desktop CSS forces both panels visible — do nothing
  if (window.innerWidth > 768) return;

  const dashboardView = document.getElementById("dashboardView");
  const tasksView     = document.getElementById("tasksView");

  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));

  if (view === "dashboard") {
    dashboardView.style.display = "block";
    tasksView.style.display     = "none";
    // Second tab = dashboard
    const tabs = document.querySelectorAll(".tab-btn");
    if (tabs[1]) tabs[1].classList.add("active");
  } else {
    dashboardView.style.display = "none";
    tasksView.style.display     = "block";
    // First tab = tasks
    const tabs = document.querySelectorAll(".tab-btn");
    if (tabs[0]) tabs[0].classList.add("active");
  }
}

// ── INIT ─────────────────────────────────────────────
setVideo(VIDEO_URL);
