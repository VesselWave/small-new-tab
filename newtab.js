const STORAGE_KEY = "long-view-goals";
const today = new Date().toLocaleDateString("en-CA");

const time = document.querySelector("#time");
const date = document.querySelector("#date");
const form = document.querySelector("#goal-form");
const input = document.querySelector("#goal-input");
const list = document.querySelector("#goal-list");
const count = document.querySelector("#goal-count");
const emptyState = document.querySelector("#empty-state");
const goalTemplate = document.querySelector("#goal-template");
const dailyTemplate = document.querySelector("#daily-template");
const expandedGoals = new Set();

let goals = loadGoals();

function loadGoals() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(stored)) return [];
    return stored.map((goal) => ({ ...goal, actions: Array.isArray(goal.actions) ? goal.actions : [] }));
  } catch {
    return [];
  }
}

function saveGoals() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

function renderDailyActions(goal, dailyList) {
  dailyList.replaceChildren();

  goal.actions.forEach((action) => {
    const fragment = dailyTemplate.content.cloneNode(true);
    const checkbox = fragment.querySelector("input");
    const text = fragment.querySelector("label span:last-child");
    const remove = fragment.querySelector("button");

    checkbox.checked = action.completedOn === today;
    checkbox.setAttribute("aria-label", `Mark ${action.text} ${checkbox.checked ? "not done" : "done"} today`);
    text.textContent = action.text;
    remove.setAttribute("aria-label", `Delete ${action.text}`);

    checkbox.addEventListener("change", () => {
      action.completedOn = checkbox.checked ? today : null;
      saveGoals();
      renderGoals();
    });

    remove.addEventListener("click", () => {
      goal.actions = goal.actions.filter((entry) => entry.id !== action.id);
      saveGoals();
      renderGoals();
    });

    dailyList.append(fragment);
  });
}

function renderGoals() {
  list.replaceChildren();

  goals.forEach((goal) => {
    const fragment = goalTemplate.content.cloneNode(true);
    const checkbox = fragment.querySelector(".goal-check");
    const text = fragment.querySelector(".goal-text");
    const expand = fragment.querySelector(".expand-goal");
    const actionCount = fragment.querySelector(".action-count");
    const panel = fragment.querySelector(".daily-panel");
    const dailyList = fragment.querySelector(".daily-list");
    const dailyForm = fragment.querySelector(".daily-form");
    const dailyInput = dailyForm.querySelector("input");
    const deleteButton = fragment.querySelector(".delete-goal");
    const isExpanded = expandedGoals.has(goal.id);
    const doneToday = goal.actions.filter((action) => action.completedOn === today).length;

    checkbox.checked = goal.completed;
    checkbox.setAttribute("aria-label", `Mark ${goal.text} ${goal.completed ? "active" : "complete"}`);
    text.textContent = goal.text;
    actionCount.textContent = goal.actions.length ? `${doneToday}/${goal.actions.length} today` : "Break down";
    expand.setAttribute("aria-label", `${isExpanded ? "Hide" : "Show"} daily steps for ${goal.text}`);
    expand.setAttribute("aria-expanded", String(isExpanded));
    panel.hidden = !isExpanded;
    deleteButton.setAttribute("aria-label", `Delete ${goal.text}`);

    renderDailyActions(goal, dailyList);

    checkbox.addEventListener("change", () => {
      goal.completed = checkbox.checked;
      saveGoals();
      updateSummary();
    });

    expand.addEventListener("click", () => {
      isExpanded ? expandedGoals.delete(goal.id) : expandedGoals.add(goal.id);
      renderGoals();
    });

    dailyForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const actionText = dailyInput.value.trim();
      if (!actionText) return;
      goal.actions.push({ id: crypto.randomUUID(), text: actionText, completedOn: null });
      expandedGoals.add(goal.id);
      saveGoals();
      renderGoals();
    });

    deleteButton.addEventListener("click", () => {
      goals = goals.filter((entry) => entry.id !== goal.id);
      expandedGoals.delete(goal.id);
      saveGoals();
      renderGoals();
    });

    list.append(fragment);
  });

  updateSummary();
}

function updateSummary() {
  const active = goals.filter((goal) => !goal.completed).length;
  count.textContent = `${active} active`;
  emptyState.hidden = goals.length > 0;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const goal = { id: crypto.randomUUID(), text, completed: false, actions: [] };
  goals.unshift(goal);
  expandedGoals.add(goal.id);
  saveGoals();
  renderGoals();
  form.reset();
  input.focus();
});

function updateClock() {
  const now = new Date();
  time.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  date.textContent = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

renderGoals();
updateClock();
setInterval(updateClock, 1000);
