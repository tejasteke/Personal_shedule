/**
 * DayFlow — Core Application JavaScript
 * State management, rendering, event listeners, import/export, and visual updates.
 */

// ==========================================
// 1. App State
// ==========================================
let state = {
  tasks: [], // Array of task objects
  weeklyGoals: [],
  monthlyGoals: [],
  longTermGoals: [],
  dares: [],
  selectedDate: '', // YYYY-MM-DD format
  filterCategory: 'All', // 'All' or specific category name
  activeView: 'timeline', // 'timeline', 'list', 'analytics', 'goals'
  activeSort: 'time', // 'time', 'priority', 'category', 'status'
  theme: 'dark-theme', // 'dark-theme' or 'light-theme'
  analyticsScope: 'day', // 'day', 'month', 'year'
  analyticsMonth: '', // YYYY-MM format
  analyticsYear: '' // YYYY format
};

// Category Metadata
const CATEGORIES = {
  Work: { emoji: '💼', color: 'var(--cat-work)', class: 'dot-work' },
  Personal: { emoji: '🏠', color: 'var(--cat-personal)', class: 'dot-personal' },
  Health: { emoji: '🍏', color: 'var(--cat-health)', class: 'dot-health' },
  Study: { emoji: '📚', color: 'var(--cat-study)', class: 'dot-study' },
  Leisure: { emoji: '🎮', color: 'var(--cat-leisure)', class: 'dot-leisure' },
  Routine: { emoji: '🔄', color: 'var(--cat-routine)', class: 'dot-routine' }
};

// Priority Sort Weights
const PRIORITY_WEIGHTS = { High: 3, Medium: 2, Low: 1 };

// ==========================================
// 2. Utility Functions
// ==========================================

// Get local date string YYYY-MM-DD
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convert YYYY-MM-DD into a user-friendly format (e.g. "Sunday, June 28, 2026")
function formatFriendlyDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format 24h time to 12h time (e.g., "13:30" to "1:30 PM")
function format12HourTime(timeStr) {
  if (!timeStr) return '';
  const [hourStr, minStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minStr} ${suffix}`;
}

// Calculate time difference in minutes/hours
function calculateDuration(startStr, endStr) {
  if (!startStr || !endStr) return '';
  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);
  
  let diffMin = (endH * 60 + endM) - (startH * 60 + startM);
  if (diffMin < 0) diffMin += 24 * 60; // Over midnight (though timeline assumes same-day)

  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Generate unique task ID
function generateId() {
  return 'task_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ==========================================
// 3. Local Storage Management (Settings Fallback)
// ==========================================
function saveToLocalStorage() {
  const settings = {
    theme: state.theme,
    activeView: state.activeView,
    activeSort: state.activeSort,
    analyticsScope: state.analyticsScope
  };
  localStorage.setItem('dayflow_settings', JSON.stringify(settings));
  dbManager.saveSettings(settings);
}

function applyLoadedSettings(parsed) {
  state.theme = parsed.theme || 'dark-theme';
  state.activeView = parsed.activeView || 'timeline';
  state.activeSort = parsed.activeSort || 'time';
  state.analyticsScope = parsed.analyticsScope || 'day';

  document.body.className = state.theme;

  const viewTimelineBtn = document.getElementById('view-timeline-btn');
  const viewListBtn = document.getElementById('view-list-btn');
  const viewAnalyticsBtn = document.getElementById('view-analytics-btn');
  const viewGoalsBtn = document.getElementById('view-goals-btn');
  const timelineContainer = document.getElementById('timeline-view-container');
  const listContainer = document.getElementById('list-view-container');
  const analyticsContainer = document.getElementById('analytics-view-container');
  const goalsContainer = document.getElementById('goals-view-container');
  const listSortControls = document.getElementById('list-sorting-controls');

  if (viewTimelineBtn && viewListBtn && viewAnalyticsBtn && viewGoalsBtn && timelineContainer && listContainer && analyticsContainer && goalsContainer && listSortControls) {
    viewTimelineBtn.classList.remove('active');
    viewListBtn.classList.remove('active');
    viewAnalyticsBtn.classList.remove('active');
    viewGoalsBtn.classList.remove('active');
    timelineContainer.classList.add('hide');
    timelineContainer.classList.remove('active');
    listContainer.classList.add('hide');
    listContainer.classList.remove('active');
    analyticsContainer.classList.add('hide');
    analyticsContainer.classList.remove('active');
    goalsContainer.classList.add('hide');
    goalsContainer.classList.remove('active');
    listSortControls.classList.add('hide');

    if (state.activeView === 'timeline') {
      viewTimelineBtn.classList.add('active');
      timelineContainer.classList.remove('hide');
      timelineContainer.classList.add('active');
    } else if (state.activeView === 'list') {
      viewListBtn.classList.add('active');
      listContainer.classList.remove('hide');
      listContainer.classList.add('active');
      listSortControls.classList.remove('hide');
    } else if (state.activeView === 'analytics') {
      viewAnalyticsBtn.classList.add('active');
      analyticsContainer.classList.remove('hide');
      analyticsContainer.classList.add('active');
    } else if (state.activeView === 'goals') {
      viewGoalsBtn.classList.add('active');
      goalsContainer.classList.remove('hide');
      goalsContainer.classList.add('active');
    }
  }

  const sortSelect = document.getElementById('list-sort-select');
  if (sortSelect) sortSelect.value = state.activeSort;
}

function loadSettingsFromLocalStorage() {
  const loadedSettings = localStorage.getItem('dayflow_settings');
  if (loadedSettings) {
    try {
      const parsed = JSON.parse(loadedSettings);
      applyLoadedSettings(parsed);
    } catch (e) {
      // Keep defaults
    }
  }
}

function loadFallbackTasks() {
  const loadedTasks = localStorage.getItem('dayflow_tasks');
  if (loadedTasks) {
    try {
      state.tasks = JSON.parse(loadedTasks);
    } catch (e) {
      state.tasks = [];
    }
  }

  const loadedGoals = localStorage.getItem('dayflow_goals');
  if (loadedGoals) {
    try {
      const goalsData = JSON.parse(loadedGoals);
      state.weeklyGoals = goalsData.weekly || [];
      state.monthlyGoals = goalsData.monthly || [];
      state.longTermGoals = goalsData.longTerm || [];
      state.dares = goalsData.dares || [];
    } catch (e) {
      // Use defaults defined in state
    }
  }
}

function saveGoalsToLocal() {
  const goalsData = {
    weekly: state.weeklyGoals,
    monthly: state.monthlyGoals,
    longTerm: state.longTermGoals,
    dares: state.dares
  };
  localStorage.setItem('dayflow_goals', JSON.stringify(goalsData));
}

function injectMockTasks() {
  const todayStr = getLocalDateString();
  state.tasks = [
    {
      id: 'mock_1',
      title: 'Morning Meditation & Planning',
      date: todayStr,
      startTime: '07:30',
      endTime: '08:15',
      category: 'Health',
      priority: 'Low',
      notes: 'Clear mind and map daily goals. Drink glass of warm lemon water.',
      completed: true
    },
    {
      id: 'mock_2',
      title: 'Review Project Backlog & Tasks',
      date: todayStr,
      startTime: '09:00',
      endTime: '10:00',
      category: 'Work',
      priority: 'Medium',
      notes: 'Check GitHub issues, respond to client emails, and align goals for developers.',
      completed: false
    },
    {
      id: 'mock_3',
      title: 'Product Design Sprint & Brainstorm',
      date: todayStr,
      startTime: '10:30',
      endTime: '12:00',
      category: 'Work',
      priority: 'High',
      notes: 'Collaborate on design specs for the dashboard interface. Draw wireframes.',
      completed: false
    },
    {
      id: 'mock_4',
      title: 'Healthy Salad Lunch Break',
      date: todayStr,
      startTime: '12:30',
      endTime: '13:30',
      category: 'Health',
      priority: 'Medium',
      notes: 'Step away from screen. Quick 15 min walk outside.',
      completed: false
    },
    {
      id: 'mock_5',
      title: 'Complete Daily scheduling app',
      date: todayStr,
      startTime: '14:30',
      endTime: '17:00',
      category: 'Study',
      priority: 'High',
      notes: 'Add glassmorphism styles, clean localstorage bindings, and double-check timezone dates.',
      completed: true
    },
    {
      id: 'mock_6',
      title: 'Casual Gaming with Friends',
      date: todayStr,
      startTime: '19:30',
      endTime: '21:00',
      category: 'Leisure',
      priority: 'Low',
      notes: 'Play online co-op session. Fun times!',
      completed: false
    }
  ];
}

// ==========================================
// 4. Time Conflict Checks
// ==========================================
// Check if a proposed time range overlaps with any existing tasks on the same date
function detectConflicts(date, startTime, endTime, skipId = null) {
  if (!startTime || !endTime) return [];
  
  const currentDateTasks = state.tasks.filter(t => t.date === date && t.id !== skipId);
  const conflicts = [];

  let tStart = timeStringToMinutes(startTime);
  let tEnd = timeStringToMinutes(endTime);
  if (tEnd < tStart) tEnd += 24 * 60;

  for (const task of currentDateTasks) {
    let start = timeStringToMinutes(task.startTime);
    let end = timeStringToMinutes(task.endTime);
    if (end < start) end += 24 * 60;

    // Overlap condition: Proposed range overlaps existing range
    // Start1 < End2 AND Start2 < End1
    if (tStart < end && start < tEnd) {
      conflicts.push(task);
    }
  }
  return conflicts;
}

function timeStringToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// ==========================================
// 5. Toast Notifications Helper
// ==========================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '';
  switch (type) {
    case 'success':
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      break;
    case 'error':
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
      break;
    case 'warning':
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      break;
    case 'info':
    default:
      icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
      break;
  }

  toast.innerHTML = `${icon}<span>${message}</span>`;
  container.appendChild(toast);

  // Automatically remove toast after 3.5 seconds
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3500);
}

// ==========================================
// 6. UI Render Engine
// ==========================================

// Global render router
function renderUI() {
  renderDateHeader();
  renderProgress();
  renderCategoryList();
  
  if (state.activeView === 'timeline') {
    renderTimeline();
  } else if (state.activeView === 'list') {
    renderList();
  } else if (state.activeView === 'analytics') {
    renderAnalytics();
  } else if (state.activeView === 'goals') {
    renderGoalsAndDares();
  } else if (state.activeView === 'goals-analytics') {
    renderGoalsAnalytics();
  }
}

// Update date displays and calendar trigger value
function renderDateHeader() {
  document.getElementById('current-date-text').textContent = formatFriendlyDate(state.selectedDate);
  document.getElementById('hidden-date-picker').value = state.selectedDate;

  // Toggle quick-days active state
  const todayStr = getLocalDateString();
  const yesterdayStr = getLocalDateString(new Date(Date.now() - 86400000));
  const tomorrowStr = getLocalDateString(new Date(Date.now() + 86400000));

  const dayTabs = document.querySelectorAll('.day-tab');
  dayTabs.forEach(tab => {
    tab.classList.remove('active');
    const role = tab.getAttribute('data-day');
    if (role === 'today' && state.selectedDate === todayStr) tab.classList.add('active');
    if (role === 'prev' && state.selectedDate === yesterdayStr) tab.classList.add('active');
    if (role === 'next' && state.selectedDate === tomorrowStr) tab.classList.add('active');
  });
}

// Update the progress circle & stats card
function renderProgress() {
  const currentDateTasks = state.tasks.filter(t => t.date === state.selectedDate);
  const total = currentDateTasks.length;
  const completed = currentDateTasks.filter(t => t.completed).length;

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  
  // Update progress radial circle
  const circleFill = document.getElementById('progress-bar-fill');
  const circumference = 2 * Math.PI * 52; // 326.7
  const offset = circumference - (percent / 100) * circumference;
  circleFill.style.strokeDashoffset = offset;

  // Update text labels
  document.getElementById('progress-percent').textContent = `${percent}%`;
  document.getElementById('progress-counter-text').textContent = `${completed} of ${total} completed`;

  // Dynamic status/motivational quotes
  const quoteElem = document.getElementById('progress-motivation-text');
  if (total === 0) {
    quoteElem.textContent = "Plan some tasks to get started!";
  } else if (percent === 0) {
    quoteElem.textContent = "Ready to start your day? Let's go!";
  } else if (percent < 40) {
    quoteElem.textContent = "Nice start! Keep building momentum.";
  } else if (percent < 80) {
    quoteElem.textContent = "Over halfway! You are doing great.";
  } else if (percent < 100) {
    quoteElem.textContent = "Almost there! Finish strong.";
  } else {
    quoteElem.textContent = "Spectacular! Complete daily schedule achieved! 🎉";
  }
}

// Render category stats/filters panel
function renderCategoryList() {
  const filterList = document.getElementById('category-filter-list');
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  
  // Update visibility of clear filters button
  if (state.filterCategory !== 'All') {
    clearFiltersBtn.classList.remove('hide');
  } else {
    clearFiltersBtn.classList.add('hide');
  }

  // Count tasks by category for selected day
  const dailyTasks = state.tasks.filter(t => t.date === state.selectedDate);
  const counts = { Work: 0, Personal: 0, Health: 0, Study: 0, Leisure: 0, Routine: 0 };
  dailyTasks.forEach(task => {
    if (counts[task.category] !== undefined) {
      counts[task.category]++;
    }
  });

  filterList.innerHTML = '';
  Object.keys(CATEGORIES).forEach(cat => {
    const meta = CATEGORIES[cat];
    const count = counts[cat];
    const isActive = state.filterCategory === cat;

    const catEl = document.createElement('div');
    catEl.className = `category-filter-item ${isActive ? 'active' : ''}`;
    catEl.innerHTML = `
      <div class="category-name-wrapper">
        <span class="category-dot ${meta.class}"></span>
        <span>${meta.emoji} ${cat}</span>
      </div>
      <span class="category-count">${count}</span>
    `;

    catEl.addEventListener('click', () => {
      if (isActive) {
        state.filterCategory = 'All'; // Toggle off
      } else {
        state.filterCategory = cat; // Toggle on
      }
      renderUI();
    });

    filterList.appendChild(catEl);
  });
}

// Core rendering: TIMELINE VIEW
function renderTimeline() {
  const container = document.getElementById('timeline-view-container');
  container.innerHTML = '';

  // Get tasks for the day (filtered by active category)
  let dailyTasks = state.tasks.filter(t => t.date === state.selectedDate);
  if (state.filterCategory !== 'All') {
    dailyTasks = dailyTasks.filter(t => t.category === state.filterCategory);
  }

  // Detect which tasks have time conflict (skip untimed tasks)
  const allDailyTasks = state.tasks.filter(t => t.date === state.selectedDate);
  const conflictIds = new Set();
  for (let i = 0; i < allDailyTasks.length; i++) {
    for (let j = i + 1; j < allDailyTasks.length; j++) {
      const t1 = allDailyTasks[i];
      const t2 = allDailyTasks[j];
      let start1 = timeStringToMinutes(t1.startTime);
      let end1 = timeStringToMinutes(t1.endTime);
      let start2 = timeStringToMinutes(t2.startTime);
      let end2 = timeStringToMinutes(t2.endTime);
      // Only compare if both tasks have valid times
      if (start1 != null && end1 != null && start2 != null && end2 != null) {
        if (end1 < start1) end1 += 24 * 60;
        if (end2 < start2) end2 += 24 * 60;
        if (start1 < end2 && start2 < end1) {
          conflictIds.add(t1.id);
          conflictIds.add(t2.id);
        }
      }
    }
  }

  // Timeline hours from 06:00 to 23:00 (6 AM to 11 PM)
  const START_HOUR = 6;
  const END_HOUR = 23;

  for (let h = START_HOUR; h <= END_HOUR; h++) {
    const hourStr = String(h).padStart(2, '0');
    const formattedHourLabel = format12HourTime(`${hourStr}:00`);

    const row = document.createElement('div');
    row.className = 'hour-row';
    row.setAttribute('data-hour', hourStr);

    row.innerHTML = `
      <div class="hour-label">${formattedHourLabel}</div>
      <div class="hour-slot-track" id="slot-track-${hourStr}"></div>
      <button class="quick-add-btn" data-time="${hourStr}:00" aria-label="Add task at ${formattedHourLabel}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    `;

    container.appendChild(row);
  }

  // Populate tasks inside their starting hour slots (skip untimed)
  dailyTasks.forEach(task => {
    if (!task.startTime) return; // untimed tasks handled separately
    const startHour = task.startTime.split(':')[0];
    const slotTrack = document.getElementById(`slot-track-${startHour}`);

    if (slotTrack) {
      const isConflict = conflictIds.has(task.id);
      const card = createTaskCardHTML(task, isConflict, 'timeline');
      slotTrack.appendChild(card);
    }
  });

  // Render untimed (All‑day) tasks
  const untimedTasks = dailyTasks.filter(t => !t.startTime);
  const allDayContainer = document.getElementById('all-day-tasks-container');
  const allDayList = document.getElementById('all-day-tasks-list');
  allDayList.innerHTML = '';
  if (untimedTasks.length > 0) {
    allDayContainer.classList.remove('hide');
    untimedTasks.forEach(task => {
      const card = createTaskCardHTML(task, false, 'timeline');
      allDayList.appendChild(card);
    });
  } else {
    allDayContainer.classList.add('hide');
  }

  // Bind Quick Add Buttons
  document.querySelectorAll('.quick-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const start = btn.getAttribute('data-time');
      // Set end time to 1 hour later
      const hourNum = parseInt(start.split(':')[0], 10);
      const end = `${String((hourNum + 1) % 24).padStart(2, '0')}:00`;
      openModal(null, start, end);
    });
  });

  // Add click to edit hooks
  bindTaskCardEvents();
}

// Core rendering: LIST VIEW
function renderList() {
  const container = document.getElementById('list-tasks-wrapper');
  const countLabel = document.getElementById('list-tasks-count');
  container.innerHTML = '';

  let dailyTasks = state.tasks.filter(t => t.date === state.selectedDate);

  // Filter category
  if (state.filterCategory !== 'All') {
    dailyTasks = dailyTasks.filter(t => t.category === state.filterCategory);
  }

  // Sorting
  dailyTasks.sort((a, b) => {
    if (state.activeSort === 'time') {
      return a.startTime.localeCompare(b.startTime);
    } else if (state.activeSort === 'priority') {
      return PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
    } else if (state.activeSort === 'category') {
      return a.category.localeCompare(b.category);
    } else if (state.activeSort === 'status') {
      return (a.completed === b.completed) ? a.startTime.localeCompare(b.startTime) : (a.completed ? 1 : -1);
    }
    return 0;
  });

  // Conflict lists
  const allDailyTasks = state.tasks.filter(t => t.date === state.selectedDate);
  const conflictIds = new Set();
  for (let i = 0; i < allDailyTasks.length; i++) {
    for (let j = i + 1; j < allDailyTasks.length; j++) {
      const t1 = allDailyTasks[i];
      const t2 = allDailyTasks[j];
      let start1 = timeStringToMinutes(t1.startTime);
      let end1 = timeStringToMinutes(t1.endTime);
      let start2 = timeStringToMinutes(t2.startTime);
      let end2 = timeStringToMinutes(t2.endTime);

      if (start1 != null && end1 != null && start2 != null && end2 != null) {
        if (end1 < start1) end1 += 24 * 60;
        if (end2 < start2) end2 += 24 * 60;
        if (start1 < end2 && start2 < end1) {
          conflictIds.add(t1.id);
          conflictIds.add(t2.id);
        }
      }
    }
  }

  // Render List elements
  if (dailyTasks.length === 0) {
    countLabel.textContent = 'No tasks scheduled';
    container.innerHTML = `
      <div class="empty-state-container">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <h4>All Clear for Today</h4>
        <p>No tasks matched this list view. Use "Add Task" to fill your agenda.</p>
      </div>
    `;
  } else {
    countLabel.textContent = `${dailyTasks.length} task${dailyTasks.length > 1 ? 's' : ''} scheduled`;
    dailyTasks.forEach(task => {
      const isConflict = conflictIds.has(task.id);
      const card = createTaskCardHTML(task, isConflict, 'list');
      container.appendChild(card);
    });
  }

  bindTaskCardEvents();
}

// Generate the DOM structure for a Task card
function createTaskCardHTML(task, isConflict, viewType = 'list') {
  const card = document.createElement('div');
  card.className = `task-card cat-${task.category.toLowerCase()} ${task.completed ? 'completed' : ''}`;
  card.setAttribute('data-id', task.id);
  // Add an attribute so we know the view type if needed later
  if (viewType === 'timeline') card.classList.add('timeline-mode-card');
  card.style.borderLeftColor = CATEGORIES[task.category].color;

  const formattedStart = format12HourTime(task.startTime);
  const formattedEnd = format12HourTime(task.endTime);
  const duration = calculateDuration(task.startTime, task.endTime);

  const categoryEmoji = CATEGORIES[task.category].emoji;
  const prioClass = `prio-${task.priority.toLowerCase()}-badge`;

  let conflictHTML = '';
  if (isConflict && !task.completed) {
    conflictHTML = `
      <span class="task-conflict-indicator" title="Scheduling Conflict: Overlaps another task!">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
        <span>Time Overlap</span>
      </span>
    `;
  }

  const checkboxHTML = viewType === 'timeline' ? '' : `
    <div class="task-checkbox-wrapper">
      <input type="checkbox" class="task-checkbox" aria-label="Toggle Complete" ${task.completed ? 'checked' : ''}>
    </div>
  `;

  const actionsHTML = viewType === 'timeline' ? '' : `
    <div class="task-actions">
      <button class="task-action-btn edit-btn" title="Edit Task" aria-label="Edit Task">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      </button>
      <button class="task-action-btn delete-btn" title="Delete Task" aria-label="Delete Task">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    </div>
  `;

  card.innerHTML = `
    ${checkboxHTML}
    <div class="task-main-details">
      <div class="task-title-row">
        <h4 class="task-title">${escapeHTML(task.title)}</h4>
        <span class="badge category-badge">${categoryEmoji} ${task.category}</span>
        <span class="badge priority-badge ${prioClass}">${task.priority}</span>
        ${conflictHTML}
      </div>
      
      <div class="task-meta-row">
        <div class="task-time-chip">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>${formattedStart} – ${formattedEnd} (${duration})</span>
        </div>
        ${task.notes ? `<span class="task-notes-snippet" title="${escapeHTML(task.notes)}">• ${escapeHTML(task.notes)}</span>` : ''}
      </div>
    </div>
    ${actionsHTML}
  `;

  return card;
}

// Bind checkbox completion, edit, and delete triggers on cards
function bindTaskCardEvents() {
  document.querySelectorAll('.task-card').forEach(card => {
    const id = card.getAttribute('data-id');
    const task = state.tasks.find(t => t.id === id);

    // Toggle completed state when checkbox is clicked
    const checkbox = card.querySelector('.task-checkbox');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        task.completed = checkbox.checked;
        
        dbManager.updateTask(task).then(() => {
          // Persist tasks to localStorage as well
          localStorage.setItem('dayflow_tasks', JSON.stringify(state.tasks));
          renderUI();
          const statusText = task.completed ? 'Completed' : 'Pending';
          showToast(`Task marked as ${statusText}`, 'info');
        }).catch(err => {
          console.error("DB Toggle complete failed", err);
          showToast('Database error: failed to update status.', 'error');
        });
      });
    }

    // Open editor when card is clicked, UNLESS it's in timeline mode where edits are removed
    card.addEventListener('click', (e) => {
      // Don't trigger if click is on action buttons
      if (e.target.closest('.task-action-btn') || e.target.closest('.custom-checkbox') || e.target.closest('.task-checkbox')) return;
      if (card.classList.contains('timeline-mode-card')) return; // Disable card click edit in timeline
      openModal(task);
    });

    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal(task);
      });
    }

    // Inline delete card action
    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
          deleteTask(id);
        }
      });
    }
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// ==========================================
// 7. Operations & CRUD
// ==========================================

function saveTask(taskData) {
  const { id, title, date, startTime, endTime, category, priority, notes } = taskData;
  const isEdit = !!id;
  
  const task = {
    id: id || generateId(),
    title,
    date,
    startTime,
    endTime,
    category,
    priority,
    notes,
    completed: isEdit ? (state.tasks.find(t => t.id === id)?.completed || false) : false
  };

  const promise = isEdit ? dbManager.updateTask(task) : dbManager.addTask(task);

  promise.then(() => {
    try {
      if (isEdit) {
        const index = state.tasks.findIndex(t => t.id === id);
        if (index !== -1) state.tasks[index] = task;
        showToast('Task updated successfully!', 'success');
      } else {
        state.tasks.push(task);
        showToast('Task added to schedule!', 'success');
      }
      
      localStorage.setItem('dayflow_tasks', JSON.stringify(state.tasks));
      
      renderUI();
      closeModal();
    } catch (uiErr) {
      console.error("UI Update failed after saving task", uiErr);
      // Suppress showing DB save failed for UI errors.
    }
  }).catch(err => {
    console.error("DB Save failed", err);
    showToast('Database error: failed to save task.', 'error');
  });
}

function deleteTask(id) {
  dbManager.deleteTask(id).then(() => {
    const index = state.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      const title = state.tasks[index].title;
      state.tasks.splice(index, 1);
      localStorage.setItem('dayflow_tasks', JSON.stringify(state.tasks));
      showToast(`Deleted task: "${title}"`, 'warning');
    }
    renderUI();
    closeModal();
  }).catch(err => {
    console.error("DB Delete failed", err);
    showToast('Database error: failed to delete task.', 'error');
  });
}

function clearDayTasks() {
  dbManager.clearDayTasks(state.selectedDate).then(cleared => {
    state.tasks = state.tasks.filter(t => t.date !== state.selectedDate);
    localStorage.setItem('dayflow_tasks', JSON.stringify(state.tasks));
    renderUI();
    if (cleared > 0) {
      showToast(`Reset day! Cleared ${cleared} task(s).`, 'warning');
    } else {
      showToast('Day was already empty.', 'info');
    }
  }).catch(err => {
    console.error("DB Clear Day failed", err);
    showToast('Database error: failed to clear day.', 'error');
  });
}

// ==========================================
// 8. Modal Management
// ==========================================
const modal = document.getElementById('task-modal');
const modalForm = document.getElementById('task-form');
const conflictWarning = document.getElementById('modal-conflict-warning');
const conflictMessage = document.getElementById('conflict-warning-message');

function openModal(task = null, startDefault = '', endDefault = '') {
  modal.classList.add('active');
  modalForm.reset();

  const idField = document.getElementById('task-id-field');
  const titleField = document.getElementById('task-title');
  const dateField = document.getElementById('hidden-date-picker'); // hidden, synced to header state
  const startField = document.getElementById('task-start-time');
  const endField = document.getElementById('task-end-time');
  const catField = document.getElementById('task-category');
  const deleteBtn = document.getElementById('delete-task-btn');
  const modalTitle = document.getElementById('modal-title');
  const notesField = document.getElementById('task-notes');

  // Hide conflict warnings initially
  conflictWarning.classList.add('hide');

  if (task) {
    // Populate form for Editing
    modalTitle.textContent = 'Edit Schedule Task';
    idField.value = task.id;
    titleField.value = task.title;
    startField.value = task.startTime;
    endField.value = task.endTime;
    catField.value = task.category;
    notesField.value = task.notes || '';
    
    // Set priority radio button
    const prioRadio = document.querySelector(`input[name="priority"][value="${task.priority}"]`);
    if (prioRadio) prioRadio.checked = true;

    deleteBtn.classList.remove('hide');
  } else {
    // Populate form for Creating
    modalTitle.textContent = 'Create Schedule Task';
    idField.value = '';
    
    // Default times (prefilled by double click hour slots or auto computed)
    if (startDefault && endDefault) {
      startField.value = startDefault;
      endField.value = endDefault;
    } else {
      const now = new Date();
      const currHour = now.getHours();
      startField.value = `${String(currHour).padStart(2, '0')}:00`;
      endField.value = `${String((currHour + 1) % 24).padStart(2, '0')}:00`;
    }
    
    // Set default category
    catField.value = state.filterCategory !== 'All' ? state.filterCategory : 'Work';
    
    // Set priority to Medium
    document.getElementById('prio-med').checked = true;

    deleteBtn.classList.add('hide');
  }

  // Attach dynamic collision check as user edits times
  const checkOverlap = () => {
    const skipId = idField.value || null;
    const sVal = startField.value;
    const eVal = endField.value;
    const dateVal = state.selectedDate;

    if (sVal && eVal) {
      // Validate times logic (start before end)
      if (sVal >= eVal) {
        conflictWarning.classList.remove('hide');
        conflictMessage.textContent = 'Warning: Start time must be earlier than End time.';
        document.getElementById('save-task-btn').disabled = true;
        return;
      }

      const conflicts = detectConflicts(dateVal, sVal, eVal, skipId);
      if (conflicts.length > 0) {
        conflictWarning.classList.remove('hide');
        conflictMessage.textContent = `Alert: Overlaps with "${conflicts[0].title}" (${format12HourTime(conflicts[0].startTime)} - ${format12HourTime(conflicts[0].endTime)})`;
        document.getElementById('save-task-btn').disabled = false; // still allow saving, just show warning
      } else {
        conflictWarning.classList.add('hide');
        document.getElementById('save-task-btn').disabled = false;
      }
    }
  };

  startField.addEventListener('input', checkOverlap);
  endField.addEventListener('input', checkOverlap);
  
  // Focus on title
  setTimeout(() => titleField.focus(), 100);
}

function closeModal() {
  modal.classList.remove('active');
  modalForm.reset();
}

// ==========================================
// 9. Data Import / Export Operations
// ==========================================

function exportToPdf() {
  if (state.tasks.length === 0) {
    showToast('No tasks to export.', 'warning');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const dayTasks = state.tasks.filter(t => t.date === state.selectedDate);
  if (dayTasks.length === 0) {
    showToast('No tasks for the selected date.', 'warning');
    return;
  }

  // Header Banner
  doc.setFillColor(59, 130, 246); // Primary blue
  doc.rect(0, 0, doc.internal.pageSize.width, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.text('DayFlow Daily Planner', 14, 20);
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Schedule for: ${formatFriendlyDate(state.selectedDate)}`, 14, 28);

  let yPos = 45;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  // Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPos - 6, pageWidth - 28, 10, 'F');
  
  doc.setTextColor(0, 0, 0); // Pure black
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  // Widen columns to prevent overlapping and make room for Checkbox at end
  doc.text('TIME', 14, yPos);
  doc.text('TASK DETAILS', 55, yPos);
  doc.text('CATEGORY', 135, yPos);
  doc.text('PRIORITY', 160, yPos);
  doc.text('DONE', 185, yPos);
  
  yPos += 12;
  
  dayTasks.forEach(task => {
    // Calculate heights with larger fonts
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    // Reduce wrap width slightly to guarantee no overlap with Category
    const titleLines = doc.splitTextToSize(task.title, 75);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const noteLines = task.notes ? doc.splitTextToSize(`Notes: ${task.notes}`, 130) : [];
    
    const rowHeight = (titleLines.length * 7) + (noteLines.length * 6) + 12;
    
    if (yPos + rowHeight > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }
    
    const timeStr = task.startTime && task.endTime ? 
      `${format12HourTime(task.startTime)} - ${format12HourTime(task.endTime)}` : 'All Day';
      
    // Row bottom border
    doc.setDrawColor(150, 150, 150);
    doc.line(14, yPos + rowHeight - 2, pageWidth - 14, yPos + rowHeight - 2);
    
    // Time
    doc.setTextColor(0, 0, 0); // Pure black
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(timeStr, 14, yPos + 6);
    
    // Title
    doc.setTextColor(0, 0, 0); // Pure black
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text(titleLines, 55, yPos + 6);
    
    // Category
    doc.setTextColor(0, 0, 0); // Pure black
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(task.category, 135, yPos + 6);
    
    // Priority
    doc.setTextColor(0, 0, 0); // Pure black
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text(task.priority, 160, yPos + 6);
    
    // Checkbox Visual at the end
    doc.setDrawColor(0, 0, 0);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.rect(188, yPos + 2.5, 5, 5, 'DF'); // Draw a square box
    if (task.completed) {
      // Draw a checkmark (tick) instead of an X
      doc.setLineWidth(0.6);
      doc.line(189, yPos + 5, 190.5, yPos + 6.5);
      doc.line(190.5, yPos + 6.5, 192.5, yPos + 3.5);
    }
    
    let currentY = yPos + (titleLines.length * 7) + 5;
    
    // Notes
    if (noteLines.length > 0) {
       doc.setTextColor(0, 0, 0); // Pure black
       doc.setFontSize(11);
       doc.setFont(undefined, 'normal');
       doc.text(noteLines, 55, currentY);
    }
    
    yPos += rowHeight;
  });

  // Footer summary
  const total = dayTasks.length;
  const completed = dayTasks.filter(t => t.completed).length;
  
  if (yPos > pageHeight - 30) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFillColor(245, 245, 245);
  doc.rect(14, yPos + 5, pageWidth - 28, 12, 'F');
  doc.setTextColor(0, 0, 0); // Pure black
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  const rate = total === 0 ? 0 : Math.round((completed/total)*100);
  doc.text(`Total Tasks: ${total}   |   Completed: ${completed}   |   Completion Rate: ${rate}%`, 20, yPos + 13);
  
  doc.save(`DayFlow_${state.selectedDate}.pdf`);
  showToast('Schedule exported to PDF!', 'success');
}

// ==========================================
// 10. Event Listeners Initialization
// ==========================================

function initEventListeners() {
  // Theme Toggle Button
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  themeToggleBtn.addEventListener('click', () => {
    if (state.theme === 'dark-theme') {
      state.theme = 'light-theme';
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    } else {
      state.theme = 'dark-theme';
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    }
    saveToLocalStorage();
    showToast(`Switched to ${state.theme === 'dark-theme' ? 'Dark' : 'Light'} Mode`, 'info');
  });

  // Date Navigation (Arrows)
  document.getElementById('prev-day-btn').addEventListener('click', () => {
    const [y, m, d] = state.selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    state.selectedDate = getLocalDateString(date);
    renderUI();
  });

  document.getElementById('next-day-btn').addEventListener('click', () => {
    const [y, m, d] = state.selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    state.selectedDate = getLocalDateString(date);
    renderUI();
  });

  // Quick tabs Yesterday / Today / Tomorrow
  document.querySelectorAll('.day-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const type = tab.getAttribute('data-day');
      const now = new Date();
      if (type === 'today') {
        state.selectedDate = getLocalDateString(now);
      } else if (type === 'prev') {
        state.selectedDate = getLocalDateString(new Date(now.setDate(now.getDate() - 1)));
      } else if (type === 'next') {
        state.selectedDate = getLocalDateString(new Date(now.setDate(now.getDate() + 1)));
      }
      renderUI();
    });
  });

  // Calendar Trigger
  const datePicker = document.getElementById('hidden-date-picker');
  const triggerBtn = document.getElementById('calendar-trigger-btn');
  const dateText = document.getElementById('current-date-text');

  triggerBtn.addEventListener('click', () => datePicker.showPicker());
  dateText.addEventListener('click', () => datePicker.showPicker());

  datePicker.addEventListener('change', (e) => {
    if (e.target.value) {
      state.selectedDate = e.target.value;
      renderUI();
    }
  });

  // Clear Category filters button
  document.getElementById('clear-filters-btn').addEventListener('click', () => {
    state.filterCategory = 'All';
    renderUI();
  });

  const viewTimelineBtn = document.getElementById('view-timeline-btn');
  const viewListBtn = document.getElementById('view-list-btn');
  const viewAnalyticsBtn = document.getElementById('view-analytics-btn');
  const viewGoalsBtn = document.getElementById('view-goals-btn');
  const viewGoalsAnalyticsBtn = document.getElementById('view-goals-analytics-btn');
  const timelineContainer = document.getElementById('timeline-view-container');
  const listContainer = document.getElementById('list-view-container');
  const analyticsContainer = document.getElementById('analytics-view-container');
  const goalsContainer = document.getElementById('goals-view-container');
  const goalsAnalyticsContainer = document.getElementById('goals-analytics-view-container');
  const listSortControls = document.getElementById('list-sorting-controls');

  const setView = (viewName) => {
    state.activeView = viewName;
    saveToLocalStorage();
    
    viewTimelineBtn.classList.remove('active');
    viewListBtn.classList.remove('active');
    viewAnalyticsBtn.classList.remove('active');
    viewGoalsBtn.classList.remove('active');
    if (viewGoalsAnalyticsBtn) viewGoalsAnalyticsBtn.classList.remove('active');
    
    timelineContainer.classList.add('hide');
    timelineContainer.classList.remove('active');
    listContainer.classList.add('hide');
    listContainer.classList.remove('active');
    analyticsContainer.classList.add('hide');
    analyticsContainer.classList.remove('active');
    goalsContainer.classList.add('hide');
    goalsContainer.classList.remove('active');
    if (goalsAnalyticsContainer) {
      goalsAnalyticsContainer.classList.add('hide');
      goalsAnalyticsContainer.classList.remove('active');
    }
    
    listSortControls.classList.add('hide');

    if (viewName === 'timeline') {
      viewTimelineBtn.classList.add('active');
      timelineContainer.classList.add('active');
      timelineContainer.classList.remove('hide');
    } else if (viewName === 'list') {
      viewListBtn.classList.add('active');
      listContainer.classList.add('active');
      listContainer.classList.remove('hide');
      listSortControls.classList.remove('hide');
    } else if (viewName === 'analytics') {
      viewAnalyticsBtn.classList.add('active');
      analyticsContainer.classList.add('active');
      analyticsContainer.classList.remove('hide');
    } else if (viewName === 'goals') {
      viewGoalsBtn.classList.add('active');
      goalsContainer.classList.add('active');
      goalsContainer.classList.remove('hide');
    } else if (viewName === 'goals-analytics') {
      if (viewGoalsAnalyticsBtn) viewGoalsAnalyticsBtn.classList.add('active');
      if (goalsAnalyticsContainer) {
        goalsAnalyticsContainer.classList.add('active');
        goalsAnalyticsContainer.classList.remove('hide');
      }
    }
    renderUI();
  };

  viewTimelineBtn.addEventListener('click', () => setView('timeline'));
  viewListBtn.addEventListener('click', () => setView('list'));
  viewAnalyticsBtn.addEventListener('click', () => setView('analytics'));
  viewGoalsBtn.addEventListener('click', () => setView('goals'));
  if (viewGoalsAnalyticsBtn) viewGoalsAnalyticsBtn.addEventListener('click', () => setView('goals-analytics'));

  // Scope Tabs for Analytics (Day/Month/Year)
  document.querySelectorAll('.analytics-scope-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.analytics-scope-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.analyticsScope = tab.getAttribute('data-scope');
      saveToLocalStorage();
      renderAnalytics();
    });
  });

  // Selector dropdowns in Analytics view
  const monthSelect = document.getElementById('analytics-month-select');
  const yearSelect = document.getElementById('analytics-year-select');

  monthSelect.addEventListener('change', (e) => {
    state.analyticsMonth = e.target.value;
    renderMonthAnalytics();
  });

  yearSelect.addEventListener('change', (e) => {
    state.analyticsYear = e.target.value;
    renderYearAnalytics();
  });

  // Sort Selection List View
  document.getElementById('list-sort-select').addEventListener('change', (e) => {
    state.activeSort = e.target.value;
    saveToLocalStorage();
    renderList();
  });

  // Main Add Task Button
  document.getElementById('open-add-modal-btn').addEventListener('click', () => openModal());

  // Modal Actions
  document.getElementById('close-modal-btn').addEventListener('click', closeModal);
  document.getElementById('cancel-task-btn').addEventListener('click', closeModal);
  
  // Close modal when clicking on overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Handle Form Submit
  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('task-id-field').value || null;
    const title = document.getElementById('task-title').value.trim();
    const startTime = document.getElementById('task-start-time').value;
    const endTime = document.getElementById('task-end-time').value;
    const category = document.getElementById('task-category').value;
    const priority = document.querySelector('input[name="priority"]:checked').value;
    const notes = document.getElementById('task-notes').value.trim();
    const allDay = document.getElementById('task-all-day').checked;

    // Validation: if not an all‑day task, require times and proper order
    if (!title) {
      showToast('Please enter a title.', 'error');
      return;
    }
    if (!allDay) {
      if (!startTime || !endTime) {
        showToast('Please fill out start and end times, or check "All‑day".', 'error');
        return;
      }
      if (startTime === endTime) {
        showToast('Start time and end time cannot be the same.', 'error');
        return;
      }
    }

    // If all‑day, clear time fields before saving
    const payload = {
      id,
      title,
      date: state.selectedDate,
      startTime: allDay ? '' : startTime,
      endTime: allDay ? '' : endTime,
      category,
      priority,
      notes
    };
    saveTask(payload);
    return; // skip original saveTask call
  });

  // Modal Delete Button
  document.getElementById('delete-task-btn').addEventListener('click', () => {
    const id = document.getElementById('task-id-field').value;
    if (id && confirm('Delete this task?')) {
      deleteTask(id);
    }
  });

  // Backup Export Button trigger
  document.getElementById('export-btn').addEventListener('click', exportToPdf);

  // Reset Day Button
  document.getElementById('clear-all-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete ALL tasks scheduled for this day? This action is permanent.')) {
      clearDayTasks();
    }
  });

  // Goal Form Submits
  const bindGoalForm = (formId, stateKey) => {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const text = input.value.trim();
      if (text) {
        state[stateKey].push({ id: generateId(), text, completed: false });
        saveGoalsToLocal();
        input.value = '';
        renderGoalsAndDares();
        showToast('Added successfully!', 'success');
      }
    });
  };

  bindGoalForm('form-add-weekly', 'weeklyGoals');
  bindGoalForm('form-add-monthly', 'monthlyGoals');
  bindGoalForm('form-add-long-term', 'longTermGoals');
  bindGoalForm('form-add-dare', 'dares');
}

// ==========================================
// 11. Analytics Dashboard Renderers
// ==========================================
function renderAnalytics() {
  const dayPanel = document.getElementById('analytics-day-panel');
  const monthPanel = document.getElementById('analytics-month-panel');
  const yearPanel = document.getElementById('analytics-year-panel');
  const monthSelect = document.getElementById('analytics-month-select');
  const yearSelect = document.getElementById('analytics-year-select');

  // Hide all initially
  dayPanel.classList.add('hide');
  monthPanel.classList.add('hide');
  yearPanel.classList.add('hide');
  monthSelect.classList.add('hide');
  yearSelect.classList.add('hide');

  // Render tab active class
  document.querySelectorAll('.analytics-scope-tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.getAttribute('data-scope') === state.analyticsScope) {
      tab.classList.add('active');
    }
  });

  if (state.analyticsScope === 'day') {
    dayPanel.classList.remove('hide');
    renderDayAnalytics();
  } else if (state.analyticsScope === 'month') {
    monthPanel.classList.remove('hide');
    monthSelect.classList.remove('hide');
    renderMonthAnalytics();
  } else if (state.analyticsScope === 'year') {
    yearPanel.classList.remove('hide');
    yearSelect.classList.remove('hide');
    renderYearAnalytics();
  }
}

function renderDayAnalytics() {
  const panel = document.getElementById('analytics-day-panel');
  
  const dayTasks = state.tasks.filter(t => t.date === state.selectedDate);
  const total = dayTasks.length;
  const completed = dayTasks.filter(t => t.completed).length;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Focus Category
  const catCounts = {};
  dayTasks.filter(t => t.completed).forEach(t => {
    catCounts[t.category] = (catCounts[t.category] || 0) + 1;
  });
  let topCat = 'None';
  let topCatVal = 0;
  Object.keys(catCounts).forEach(cat => {
    if (catCounts[cat] > topCatVal) {
      topCatVal = catCounts[cat];
      topCat = `${CATEGORIES[cat].emoji} ${cat}`;
    }
  });

  // Calculate workload time
  let totalMin = 0;
  let completedMin = 0;
  dayTasks.forEach(t => {
    if (!t.startTime || !t.endTime) return;
    let min = timeStringToMinutes(t.endTime) - timeStringToMinutes(t.startTime);
    if (min < 0) min += 24 * 60;
    totalMin += min;
    if (t.completed) completedMin += min;
  });
  
  const totalHrsText = `${Math.floor(totalMin/60)}h ${totalMin%60}m`;
  
  // Category workloads
  const catWorkloads = { Work: 0, Personal: 0, Health: 0, Study: 0, Leisure: 0, Routine: 0 };
  const catCompletedWorkloads = { Work: 0, Personal: 0, Health: 0, Study: 0, Leisure: 0, Routine: 0 };
  dayTasks.forEach(t => {
    if (!t.startTime || !t.endTime) return;
    let min = timeStringToMinutes(t.endTime) - timeStringToMinutes(t.startTime);
    if (min < 0) min += 24 * 60;
    catWorkloads[t.category] += min;
    if (t.completed) catCompletedWorkloads[t.category] += min;
  });

  panel.innerHTML = `
    <div class="analytics-grid-3col">
      <div class="glass-card analytics-card completed-accent">
        <span class="analytics-metric-value">${rate}%</span>
        <span class="analytics-metric-label">Completion Rate</span>
      </div>
      <div class="glass-card analytics-card">
        <span class="analytics-metric-value">${completed} / ${total}</span>
        <span class="analytics-metric-label">Completed Tasks</span>
      </div>
      <div class="glass-card analytics-card">
        <span class="analytics-metric-value">${totalHrsText}</span>
        <span class="analytics-metric-label">Focus Duration</span>
      </div>
    </div>

    <div class="glass-card charts-flex-layout" style="padding: 24px;">
      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; border-right: 1px solid var(--border-color); padding-right: 20px;">
        <h4 style="font-family: var(--font-display); font-size: 15px; font-weight: 700; margin-bottom: 16px; color: var(--text-muted); align-self: flex-start;">Day Load Breakdown</h4>
        <div class="progress-ring-wrapper" style="width: 140px; height: 140px; margin-bottom: 12px;">
          <svg class="progress-ring" width="140" height="140" style="transform: rotate(-90deg);">
            <circle class="progress-ring-bg" stroke="rgba(255,255,255,0.08)" stroke-width="10" fill="transparent" r="60" cx="70" cy="70"/>
            <circle class="progress-ring-bar" stroke="url(#progress-gradient)" stroke-width="10" stroke-dasharray="377" stroke-dashoffset="${377 - (rate/100)*377}" stroke-linecap="round" fill="transparent" r="60" cx="70" cy="70"/>
          </svg>
          <div class="progress-percentage-label">
            <span style="font-size: 26px; font-weight: 800;">${rate}%</span>
          </div>
        </div>
        <p style="font-size: 13px; font-weight: 600; text-align: center; color: var(--text-muted);">
          Top Focus: <span style="color: var(--primary-light);">${topCat}</span>
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <h4 style="font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--text-muted);">Workload by Category</h4>
        <div class="category-bars-container">
          ${Object.keys(CATEGORIES).map(cat => {
            const totalMin = catWorkloads[cat];
            const compMin = catCompletedWorkloads[cat];
            const percent = totalMin === 0 ? 0 : Math.round((compMin / totalMin) * 100);
            const durationText = totalMin === 0 ? 'No tasks' : `${Math.floor(totalMin/60)}h ${totalMin%60}m`;
            
            return `
              <div class="chart-bar-row">
                <div class="chart-bar-info">
                  <span class="chart-bar-name">${CATEGORIES[cat].emoji} ${cat} <span style="font-size:11px; font-weight:normal; color:var(--text-dim);">(${durationText})</span></span>
                  <span style="color: ${CATEGORIES[cat].color}; font-weight:700;">${percent}%</span>
                </div>
                <div class="chart-bar-track">
                  <div class="chart-bar-fill" style="width: ${percent}%; background-color: ${CATEGORIES[cat].color};"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderMonthAnalytics() {
  const panel = document.getElementById('analytics-month-panel');
  const monthSelect = document.getElementById('analytics-month-select');

  // Populate Month selector dropdown
  const months = new Set();
  state.tasks.forEach(t => {
    if (t.date && t.date.length >= 7) {
      months.add(t.date.substring(0, 7));
    }
  });
  if (state.selectedDate) {
    months.add(state.selectedDate.substring(0, 7));
  }
  const sortedMonths = Array.from(months).sort().reverse();
  
  if (!state.analyticsMonth) {
    state.analyticsMonth = state.selectedDate.substring(0, 7);
  }

  monthSelect.innerHTML = '';
  sortedMonths.forEach(m => {
    const [yr, mn] = m.split('-');
    const dateObj = new Date(parseInt(yr), parseInt(mn) - 1, 1);
    const label = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = label;
    if (m === state.analyticsMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  });

  const monthTasks = state.tasks.filter(t => t.date.startsWith(state.analyticsMonth));
  const total = monthTasks.length;
  const completed = monthTasks.filter(t => t.completed).length;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Peak productivity day in Month
  const dailyCompleted = {};
  monthTasks.filter(t => t.completed).forEach(t => {
    dailyCompleted[t.date] = (dailyCompleted[t.date] || 0) + 1;
  });
  let peakDate = 'None';
  let peakVal = 0;
  Object.keys(dailyCompleted).forEach(d => {
    if (dailyCompleted[d] > peakVal) {
      peakVal = dailyCompleted[d];
      peakDate = d;
    }
  });
  const peakDateFriendly = peakDate === 'None' ? 'N/A' : peakDate.split('-')[2] + ' ' + new Date(peakDate).toLocaleDateString('en-US', { month: 'short' });

  // Generate Month Grid cells
  const [yearNum, monthNum] = state.analyticsMonth.split('-').map(Number);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const startDayOfWeek = new Date(yearNum, monthNum - 1, 1).getDay(); // 0=Sunday...

  const todayStr = getLocalDateString();

  let calendarHTML = `
    <div class="calendar-day-header">Su</div>
    <div class="calendar-day-header">Mo</div>
    <div class="calendar-day-header">Tu</div>
    <div class="calendar-day-header">We</div>
    <div class="calendar-day-header">Th</div>
    <div class="calendar-day-header">Fr</div>
    <div class="calendar-day-header">Sa</div>
  `;

  // Preceding month filler
  const prevMonthNum = monthNum === 1 ? 12 : monthNum - 1;
  const prevYearNum = monthNum === 1 ? yearNum - 1 : yearNum;
  const daysInPrevMonth = new Date(prevYearNum, prevMonthNum, 0).getDate();
  
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dVal = daysInPrevMonth - i;
    const dateStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}-${String(dVal).padStart(2, '0')}`;
    calendarHTML += `
      <div class="calendar-day-cell other-month" data-date="${dateStr}">
        <span class="calendar-day-number">${dVal}</span>
        <div class="calendar-day-info"><span class="calendar-day-dot-indicator cal-level-none">•</span></div>
      </div>
    `;
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = String(d).padStart(2, '0');
    const mStr = String(monthNum).padStart(2, '0');
    const dateStr = `${yearNum}-${mStr}-${dStr}`;

    const dayTasks = state.tasks.filter(t => t.date === dateStr);
    const dayTotal = dayTasks.length;
    const dayComp = dayTasks.filter(t => t.completed).length;

    let levelClass = 'cal-status-0';
    let indicatorText = '•';
    
    if (dayTotal > 0) {
      const dayRate = (dayComp / dayTotal) * 100;
      indicatorText = `${dayComp}/${dayTotal}`;
      
      if (dayRate === 100) {
        levelClass = 'cal-status-3';
      } else if (dayRate >= 50) {
        levelClass = 'cal-status-2';
      } else {
        levelClass = 'cal-status-1';
      }
    }

    const isToday = dateStr === todayStr;

    calendarHTML += `
      <div class="calendar-day-cell ${levelClass} ${isToday ? 'today-cell' : ''}" data-date="${dateStr}">
        <span class="calendar-day-number">${d}</span>
        <div class="calendar-day-info">
          <span class="calendar-day-dot-indicator">${indicatorText}</span>
        </div>
      </div>
    `;
  }

  // Next month filler
  const totalGridCells = 42;
  const currentCount = startDayOfWeek + daysInMonth;
  const nextMonthPadding = totalGridCells - currentCount;
  const nextMonthNum = monthNum === 12 ? 1 : monthNum + 1;
  const nextYearNum = monthNum === 12 ? yearNum + 1 : yearNum;

  for (let d = 1; d <= nextMonthPadding; d++) {
    const dateStr = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarHTML += `
      <div class="calendar-day-cell other-month" data-date="${dateStr}">
        <span class="calendar-day-number">${d}</span>
        <div class="calendar-day-info"><span class="calendar-day-dot-indicator cal-level-none">•</span></div>
      </div>
    `;
  }

  panel.innerHTML = `
    <div class="analytics-grid-3col">
      <div class="glass-card analytics-card completed-accent">
        <span class="analytics-metric-value">${rate}%</span>
        <span class="analytics-metric-label">Monthly Rate</span>
      </div>
      <div class="glass-card analytics-card">
        <span class="analytics-metric-value">${completed} / ${total}</span>
        <span class="analytics-metric-label">Completed Tasks</span>
      </div>
      <div class="glass-card analytics-card">
        <span class="analytics-metric-value">${peakDateFriendly} <span style="font-size:12px; font-weight:normal; color:var(--text-muted);">(${peakVal} tasks)</span></span>
        <span class="analytics-metric-label">Peak Workday</span>
      </div>
    </div>

    <div class="glass-card month-calendar-card">
      <div class="calendar-header-row">
        <h4 style="font-family: var(--font-display); font-size: 16px; font-weight: 700;">Monthly Productivity Grid</h4>
        <div style="display: flex; gap: 12px; font-size: 11px; align-items: center; color: var(--text-muted);">
          <span>Legend:</span>
          <span style="display:inline-flex; align-items:center; gap:3px;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--secondary);"></span>&lt;50%</span>
          <span style="display:inline-flex; align-items:center; gap:3px;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--primary);"></span>50%-99%</span>
          <span style="display:inline-flex; align-items:center; gap:3px;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--success); box-shadow:0 0 4px var(--success);"></span>100%</span>
        </div>
      </div>
      <div class="calendar-grid">
        ${calendarHTML}
      </div>
    </div>
  `;

  // Attach redirects to calendar dates
  panel.querySelectorAll('.calendar-day-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const clickDate = cell.getAttribute('data-date');
      state.selectedDate = clickDate;
      
      const viewTimelineBtn = document.getElementById('view-timeline-btn');
      const viewListBtn = document.getElementById('view-list-btn');
      const viewAnalyticsBtn = document.getElementById('view-analytics-btn');
      
      const timelineContainer = document.getElementById('timeline-view-container');
      const listContainer = document.getElementById('list-view-container');
      const analyticsContainer = document.getElementById('analytics-view-container');

      state.activeView = 'timeline';
      saveToLocalStorage();

      viewTimelineBtn.classList.add('active');
      viewListBtn.classList.remove('active');
      viewAnalyticsBtn.classList.remove('active');

      timelineContainer.classList.add('active');
      timelineContainer.classList.remove('hide');
      listContainer.classList.add('hide');
      analyticsContainer.classList.add('hide');

      renderUI();
      showToast(`Selected date: ${formatFriendlyDate(clickDate)}`, 'info');
    });
  });
}

function renderYearAnalytics() {
  const panel = document.getElementById('analytics-year-panel');
  const yearSelect = document.getElementById('analytics-year-select');

  // Populate Year selector dropdown
  const years = new Set();
  state.tasks.forEach(t => {
    if (t.date && t.date.length >= 4) {
      years.add(t.date.substring(0, 4));
    }
  });
  if (state.selectedDate) {
    years.add(state.selectedDate.substring(0, 4));
  }
  const sortedYears = Array.from(years).sort().reverse();
  
  if (!state.analyticsYear) {
    state.analyticsYear = state.selectedDate.substring(0, 4);
  }

  yearSelect.innerHTML = '';
  sortedYears.forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (y === state.analyticsYear) opt.selected = true;
    yearSelect.appendChild(opt);
  });

  const yearTasks = state.tasks.filter(t => t.date.startsWith(state.analyticsYear));
  const total = yearTasks.length;
  const completed = yearTasks.filter(t => t.completed).length;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Focus Category
  const catCounts = {};
  yearTasks.filter(t => t.completed).forEach(t => {
    catCounts[t.category] = (catCounts[t.category] || 0) + 1;
  });
  let topCat = 'None';
  let topCatVal = 0;
  Object.keys(catCounts).forEach(cat => {
    if (catCounts[cat] > topCatVal) {
      topCatVal = catCounts[cat];
      topCat = `${CATEGORIES[cat].emoji} ${cat}`;
    }
  });

  // Calculate Streak
  const completedDates = Array.from(new Set(
    state.tasks.filter(t => t.completed).map(t => t.date)
  )).sort();

  let maxStreak = 0;
  let currentStreak = 0;
  let prevDate = null;

  completedDates.forEach(dStr => {
    if (prevDate === null) {
      currentStreak = 1;
    } else {
      const d1 = new Date(prevDate);
      const d2 = new Date(dStr);
      const diffTime = Math.abs(d2 - d1);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        if (currentStreak > maxStreak) maxStreak = currentStreak;
        currentStreak = 1;
      }
    }
    prevDate = dStr;
  });
  if (currentStreak > maxStreak) maxStreak = currentStreak;

  // Generate Year Heatmap cells
  const yearInt = parseInt(state.analyticsYear);
  const isLeap = (yearInt % 4 === 0 && yearInt % 100 !== 0) || (yearInt % 400 === 0);
  const daysInYear = isLeap ? 366 : 365;

  const jan1Date = new Date(yearInt, 0, 1);
  const jan1Weekday = jan1Date.getDay(); // 0=Sunday...

  let heatmapCellsHTML = '';
  
  // Padding cells at start
  for (let i = 0; i < jan1Weekday; i++) {
    heatmapCellsHTML += `<div class="heatmap-cell hm-level-0" style="opacity:0.1; cursor:default;"></div>`;
  }

  let trackingDate = new Date(yearInt, 0, 1);
  const completedCountsByDate = {};
  yearTasks.filter(t => t.completed).forEach(t => {
    completedCountsByDate[t.date] = (completedCountsByDate[t.date] || 0) + 1;
  });

  for (let d = 0; d < daysInYear; d++) {
    const yearStr = trackingDate.getFullYear();
    const monthStr = String(trackingDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(trackingDate.getDate()).padStart(2, '0');
    const dateKey = `${yearStr}-${monthStr}-${dayStr}`;

    const count = completedCountsByDate[dateKey] || 0;
    let level = 0;
    if (count > 0) {
      if (count <= 2) level = 1;
      else if (count <= 4) level = 2;
      else level = 3;
    }

    const friendlyDate = trackingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    heatmapCellsHTML += `
      <div class="heatmap-cell hm-level-${level}" 
           title="${friendlyDate}: ${count} task${count === 1 ? '' : 's'} completed" 
           data-date="${dateKey}">
      </div>
    `;

    trackingDate.setDate(trackingDate.getDate() + 1);
  }

  // Padding cells at end
  const totalDrawnCells = jan1Weekday + daysInYear;
  const paddingEnd = (7 - (totalDrawnCells % 7)) % 7;
  for (let i = 0; i < paddingEnd; i++) {
    heatmapCellsHTML += `<div class="heatmap-cell hm-level-0" style="opacity:0.1; cursor:default;"></div>`;
  }

  panel.innerHTML = `
    <div class="analytics-grid-3col">
      <div class="glass-card analytics-card completed-accent">
        <span class="analytics-metric-value">${rate}%</span>
        <span class="analytics-metric-label">Yearly Completion</span>
      </div>
      <div class="glass-card analytics-card">
        <span class="analytics-metric-value">${maxStreak} Days</span>
        <span class="analytics-metric-label">Max Productive Streak</span>
      </div>
      <div class="glass-card analytics-card">
        <span class="analytics-metric-value">${topCat}</span>
        <span class="analytics-metric-label">Top Category Focus</span>
      </div>
    </div>

    <div class="glass-card" style="padding:24px;">
      <h4 style="font-family: var(--font-display); font-size:16px; font-weight:700; margin-bottom:18px;">Yearly Activity Heatmap</h4>
      
      <div class="heatmap-scroll-container">
        <div class="heatmap-grid-layout">
          <div class="heatmap-month-headers">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
          </div>

          <div class="heatmap-row-wrapper">
            <div class="heatmap-day-labels">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>
            
            <div class="heatmap-grid" id="heatmap-cells-grid">
              ${heatmapCellsHTML}
            </div>
          </div>
        </div>
      </div>

      <div class="heatmap-footer-row">
        <span>Click any active square to view and edit that day's schedule.</span>
        <div class="heatmap-legend">
          <span>Less</span>
          <div class="heatmap-cell hm-level-0"></div>
          <div class="heatmap-cell hm-level-1"></div>
          <div class="heatmap-cell hm-level-2"></div>
          <div class="heatmap-cell hm-level-3"></div>
          <span>More</span>
        </div>
      </div>
    </div>
  `;

  // Attach heatmap square triggers
  panel.querySelectorAll('.heatmap-cell').forEach(cell => {
    const clickDate = cell.getAttribute('data-date');
    if (!clickDate) return;

    cell.addEventListener('click', () => {
      state.selectedDate = clickDate;
      
      const viewTimelineBtn = document.getElementById('view-timeline-btn');
      const viewListBtn = document.getElementById('view-list-btn');
      const viewAnalyticsBtn = document.getElementById('view-analytics-btn');
      
      const timelineContainer = document.getElementById('timeline-view-container');
      const listContainer = document.getElementById('list-view-container');
      const analyticsContainer = document.getElementById('analytics-view-container');

      state.activeView = 'timeline';
      saveToLocalStorage();

      viewTimelineBtn.classList.add('active');
      viewListBtn.classList.remove('active');
      viewAnalyticsBtn.classList.remove('active');

      timelineContainer.classList.add('active');
      timelineContainer.classList.remove('hide');
      listContainer.classList.add('hide');
      analyticsContainer.classList.add('hide');

      renderUI();
      showToast(`Selected date: ${formatFriendlyDate(clickDate)}`, 'info');
    });
  });
}

// ==========================================
// 12. Goals & Dares Renderer
// ==========================================
function renderGoalsAndDares() {
  const weeklyList = document.getElementById('weekly-goals-list');
  const monthlyList = document.getElementById('monthly-goals-list');
  const longTermList = document.getElementById('long-term-goals-list');
  const daresList = document.getElementById('dares-list');

  if (!weeklyList || !monthlyList || !longTermList || !daresList) return;

  const createGoalHTML = (item, stateKey) => {
    const card = document.createElement('div');
    card.className = `goal-item ${item.completed ? 'completed' : ''}`;
    card.innerHTML = `
      <input type="checkbox" class="goal-checkbox" ${item.completed ? 'checked' : ''}>
      <span class="goal-text">${escapeHTML(item.text)}</span>
      <button class="goal-delete-btn" aria-label="Delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    // Checkbox toggle
    const checkbox = card.querySelector('.goal-checkbox');
    checkbox.addEventListener('change', (e) => {
      item.completed = e.target.checked;
      saveGoalsToLocal();
      renderGoalsAndDares();
    });

    // Delete button
    const deleteBtn = card.querySelector('.goal-delete-btn');
    deleteBtn.addEventListener('click', () => {
      state[stateKey] = state[stateKey].filter(g => g.id !== item.id);
      saveGoalsToLocal();
      renderGoalsAndDares();
    });

    return card;
  };

  weeklyList.innerHTML = '';
  state.weeklyGoals.forEach(g => weeklyList.appendChild(createGoalHTML(g, 'weeklyGoals')));
  if (state.weeklyGoals.length === 0) weeklyList.innerHTML = '<span style="color:var(--text-muted);font-size:13px;padding:8px;">No weekly goals set.</span>';

  monthlyList.innerHTML = '';
  state.monthlyGoals.forEach(g => monthlyList.appendChild(createGoalHTML(g, 'monthlyGoals')));
  if (state.monthlyGoals.length === 0) monthlyList.innerHTML = '<span style="color:var(--text-muted);font-size:13px;padding:8px;">No monthly goals set.</span>';

  longTermList.innerHTML = '';
  state.longTermGoals.forEach(g => longTermList.appendChild(createGoalHTML(g, 'longTermGoals')));
  if (state.longTermGoals.length === 0) longTermList.innerHTML = '<span style="color:var(--text-muted);font-size:13px;padding:8px;">No long-term goals set.</span>';

  daresList.innerHTML = '';
  state.dares.forEach(d => daresList.appendChild(createGoalHTML(d, 'dares')));
  if (state.dares.length === 0) daresList.innerHTML = '<span style="color:var(--text-muted);font-size:13px;padding:8px;">No dares right now. Add one!</span>';
}

// ==========================================
// 13. Goals Analytics Renderer
// ==========================================
function renderGoalsAnalytics() {
  const container = document.getElementById('goals-analytics-view-container');
  if (!container || !container.classList.contains('active')) return;

  const updateStat = (listKey, textId, percentId, barId) => {
    const list = state[listKey] || [];
    const total = list.length;
    const completed = list.filter(g => g.completed).length;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    const textEl = document.getElementById(textId);
    const percentEl = document.getElementById(percentId);
    const barEl = document.getElementById(barId);
    
    if (textEl) textEl.textContent = `${completed} / ${total} completed`;
    if (percentEl) percentEl.textContent = `${rate}%`;
    if (barEl) barEl.style.width = `${rate}%`;

    return { total, completed };
  };

  const weeklyStats = updateStat('weeklyGoals', 'ga-weekly-text', 'ga-weekly-percent', 'ga-weekly-bar');
  const monthlyStats = updateStat('monthlyGoals', 'ga-monthly-text', 'ga-monthly-percent', 'ga-monthly-bar');
  const longTermStats = updateStat('longTermGoals', 'ga-long-term-text', 'ga-long-term-percent', 'ga-long-term-bar');
  const daresStats = updateStat('dares', 'ga-dares-text', 'ga-dares-percent', 'ga-dares-bar');

  // Overall calculations (excluding dares for the main goal calculation)
  const totalGoals = weeklyStats.total + monthlyStats.total + longTermStats.total;
  const completedGoals = weeklyStats.completed + monthlyStats.completed + longTermStats.completed;
  const overallRate = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);

  const overallRateEl = document.getElementById('ga-overall-rate');
  const overallCompletedEl = document.getElementById('ga-overall-completed');
  const totalDaresEl = document.getElementById('ga-total-dares');

  if (overallRateEl) overallRateEl.textContent = `${overallRate}%`;
  if (overallCompletedEl) overallCompletedEl.textContent = `${completedGoals} / ${totalGoals}`;
  if (totalDaresEl) totalDaresEl.textContent = `${daresStats.completed}`;
}

// ==========================================
// 14. App Bootstrap
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Load UI configuration settings
  loadSettingsFromLocalStorage();

  document.body.className = state.theme;
  state.selectedDate = getLocalDateString();

  // Set default view active tabs
  const viewTimelineBtn = document.getElementById('view-timeline-btn');
  const viewListBtn = document.getElementById('view-list-btn');
  const viewAnalyticsBtn = document.getElementById('view-analytics-btn');
  const timelineContainer = document.getElementById('timeline-view-container');
  const listContainer = document.getElementById('list-view-container');
  const analyticsContainer = document.getElementById('analytics-view-container');
  const listSortControls = document.getElementById('list-sorting-controls');

  viewTimelineBtn.classList.remove('active');
  viewListBtn.classList.remove('active');
  viewAnalyticsBtn.classList.remove('active');
  timelineContainer.classList.add('hide');
  listContainer.classList.add('hide');
  analyticsContainer.classList.add('hide');
  listSortControls.classList.add('hide');

  if (state.activeView === 'timeline') {
    viewTimelineBtn.classList.add('active');
    timelineContainer.classList.remove('hide');
    timelineContainer.classList.add('active');
  } else if (state.activeView === 'list') {
    viewListBtn.classList.add('active');
    listContainer.classList.remove('hide');
    listContainer.classList.add('active');
    listSortControls.classList.remove('hide');
  } else if (state.activeView === 'analytics') {
    viewAnalyticsBtn.classList.add('active');
    analyticsContainer.classList.remove('hide');
    analyticsContainer.classList.add('active');
  }

  const sortSelect = document.getElementById('list-sort-select');
  if (sortSelect) sortSelect.value = state.activeSort;

  // Initialize listeners
  initEventListeners();

  // Initialize Local SQLite Database
  dbManager.init().then(dbAvailable => {
    if (dbAvailable) {
      // First, fetch and apply settings from server SQLite DB
      dbManager.getSettings().then(dbSettings => {
        if (dbSettings && Object.keys(dbSettings).length > 0) {
          applyLoadedSettings(dbSettings);
        }
        
        // Then, fetch all tasks
        return dbManager.getAllTasks();
      }).then(tasks => {
        state.tasks = tasks;
        if (state.tasks.length === 0) {
          // First ever visit, populate database with default tasks
          injectMockTasks();
          dbManager.importTasks(state.tasks).then(() => {
            localStorage.setItem('dayflow_tasks', JSON.stringify(state.tasks));
            renderUI();
          });
        } else {
          localStorage.setItem('dayflow_tasks', JSON.stringify(state.tasks));
          renderUI();
        }
      }).catch(err => {
        console.error("Failed to load settings or tasks from DB, using fallback", err);
        loadFallbackTasks();
        renderUI();
      });
    } else {
      loadFallbackTasks();
      renderUI();
    }
  });
});
