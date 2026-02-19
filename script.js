// --- Custom Confirm Modal Logic ---
let confirmCallback = null;

function showConfirmModal(message, onConfirm, btnText = 'Ha, O\'chirish') {
    const modal = document.getElementById('confirm-modal');
    const msgEle = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes-btn');

    if (!modal || !msgEle || !yesBtn) return;

    msgEle.textContent = message;
    yesBtn.textContent = btnText;
    confirmCallback = onConfirm;
    modal.style.display = 'flex';
}

function showLogoutConfirmModal(message, onConfirm, btnText = 'Ha, Chiqish') {
    const modal = document.getElementById('confirm-modal');
    const msgEle = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes-btn');
    const iconWrapper = document.querySelector('.confirm-icon-wrapper');

    if (!modal || !msgEle || !yesBtn) return;

    // Save original icon html to restore later if needed, 
    // but easier to just swap content since trash is default
    const originalIconHTML = iconWrapper.innerHTML;

    // Set custom icon for logout
    iconWrapper.innerHTML = `
        <i data-lucide="frown" class="sad-icon sad-icon-animated" width="60" height="60"></i>
        <div class="icon-decoration sad-decoration">
            <span>:(</span><span style="font-size: 2rem;">.</span><span style="font-size: 2rem;">.</span><span>:(</span>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    msgEle.textContent = message;
    yesBtn.textContent = btnText;

    // Override the close logic to also restore icon
    const noBtn = document.getElementById('confirm-no-btn');
    const originalNoClick = noBtn.onclick;

    const restoreDefault = () => {
        iconWrapper.innerHTML = `
            <i data-lucide="trash-2" class="trash-icon"></i>
            <div class="icon-decoration">
                <span>×</span><span>+</span><span>•</span><span>×</span>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        noBtn.onclick = originalNoClick;
    };

    confirmCallback = () => {
        if (onConfirm) onConfirm();
        restoreDefault();
    };

    noBtn.onclick = () => {
        modal.style.display = 'none';
        confirmCallback = null;
        restoreDefault();
    };

    modal.style.display = 'flex';
}

// Attach listeners once at initialization or globally
document.addEventListener('DOMContentLoaded', () => {
    const yesBtn = document.getElementById('confirm-yes-btn');
    const noBtn = document.getElementById('confirm-no-btn');
    const modal = document.getElementById('confirm-modal');

    if (yesBtn) {
        yesBtn.onclick = () => {
            if (confirmCallback) confirmCallback();
            modal.style.display = 'none';
            confirmCallback = null;
        };
    }

    if (noBtn) {
        noBtn.onclick = () => {
            modal.style.display = 'none';
            confirmCallback = null;
        };
    }

    // 1. Initial UI Setup (Must run immediately)
    updateDate();
    setInterval(updateDate, 1000);

    // 2. Wait for Firebase and then initialize data
    waitForFirebaseAndInit();

    // Auto-save logic for notes
    const noteTitleInput = document.getElementById('note-title');
    const noteContentInput = document.getElementById('note-content');

    let autoSaveTimeout;
    function triggerAutoSave() {
        const noteStatus = document.getElementById('note-status');
        if (noteStatus) noteStatus.textContent = 'Saqlanmoqda...';
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            saveCurrentNote().then(() => {
                if (noteStatus) noteStatus.textContent = 'Saqlandi';
                setTimeout(() => { if (noteStatus) noteStatus.textContent = ''; }, 2000);
            });
        }, 1000);
    }

    if (noteTitleInput) noteTitleInput.addEventListener('input', triggerAutoSave);
    if (noteContentInput) noteContentInput.addEventListener('input', triggerAutoSave);
});

async function waitForFirebaseAndInit() {
    console.log("System: Waiting for Firebase SDK...");
    let attempts = 0;
    while (!window.firebaseDB && attempts < 50) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }

    if (!window.firebaseDB) {
        console.error('System Error: Firebase SDK not found after 5s.');
    } else {
        console.log("System: Firebase SDK connected.");
    }

    try {
        await initializeSession();
        console.log("System: Session initialized.");

        if (window.lucide) window.lucide.createIcons();
        initCalendar();
        initFinance();
        renderKanbanTasks();
        renderDashboard();
        renderNotesList();
        renderMessages();
        generateNotifications();
        renderNotifications();
        startHeartbeat();
        console.log("System: All components rendered.");
    } catch (e) {
        console.error("System Error: Initialization failed:", e);
    }
}


// --- Global State ---
let currentUser = null;
let tasks = [];
let events = [];
let transactions = [];
let notes = [];
let currentNoteId = null;
let editingEventId = null;
let financeTrashHistory = []; // Stores last 3 deletion operations

// --- Firebase Cloud Storage Handlers ---
async function saveToCloud() {
    if (!currentUser || !window.firebaseDB) return;
    try {
        const userRef = window.firebaseRef(window.firebaseDB, 'users/' + currentUser.login);

        const cleanData = {
            tasks: tasks || [],
            events: events || [],
            transactions: (transactions || []).map(t => ({
                ...t,
                date: t.date instanceof Date ? t.date.getTime() : t.date
            })),
            notes: (notes || []).map(n => ({
                ...n,
                date: n.date instanceof Date ? n.date.getTime() : n.date
            })),
            financeTrashHistory: (financeTrashHistory || []).map(h => ({
                ...h,
                data: h.data.map(t => ({
                    ...t,
                    date: t.date instanceof Date ? t.date.getTime() : t.date
                }))
            }))
        };

        await window.firebaseUpdate(userRef, cleanData);
    } catch (e) {
        console.error('Cloud Save xatosi:', e);
    }
}

async function initializeSession() {
    const userJson = localStorage.getItem('dashboard_current_user');
    if (!userJson) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = JSON.parse(userJson);

    // Check if we have local data to migrate
    const prefix = currentUser.login + '_';
    const localTasks = localStorage.getItem(prefix + 'tasks');
    const localEvents = localStorage.getItem(prefix + 'events');
    const localTransactions = localStorage.getItem(prefix + 'transactions');
    const localNotes = localStorage.getItem(prefix + 'notes');

    if (localTasks || localEvents || localTransactions || localNotes) {
        console.log('Local ma\'lumotlar topildi. Migratsiya qilinmoqda...');
        if (localTasks) tasks = JSON.parse(localTasks);
        if (localEvents) events = JSON.parse(localEvents);
        if (localTransactions) transactions = JSON.parse(localTransactions).map(t => ({ ...t, date: new Date(t.date) }));
        if (localNotes) notes = JSON.parse(localNotes).map(n => ({ ...n, date: new Date(n.date) }));

        await saveToCloud();

        // Clear local storage after successful migration
        localStorage.removeItem(prefix + 'notes');
    } else {
        // Load from Cloud
        try {
            const userRef = window.firebaseRef(window.firebaseDB, 'users/' + currentUser.login);
            // Use onlyOnce for initial load
            // Helper to safely convert Firebase response (Object or Array) to Array
            const safeArray = (data) => {
                if (!data) return [];
                return Array.isArray(data) ? data : Object.values(data);
            };

            await new Promise((resolve) => {
                window.firebaseGet(userRef).then((snapshot) => {
                    const data = snapshot.val() || {}; // Handle null data
                    if (data) {
                        try {
                            tasks = safeArray(data.tasks);
                            events = safeArray(data.events);

                            const rawTransactions = safeArray(data.transactions);
                            transactions = rawTransactions.map(t => ({ ...t, date: new Date(t.date) }));

                            const rawNotes = safeArray(data.notes);
                            notes = rawNotes.map(n => ({ ...n, date: new Date(n.date) }));

                            const rawHistory = safeArray(data.financeTrashHistory);
                            financeTrashHistory = rawHistory.map(h => ({
                                ...h,
                                data: (Array.isArray(h.data) ? h.data : Object.values(h.data || {})).map(t => ({ ...t, date: new Date(t.date) }))
                            }));

                            // Filter out any potential nulls if array was sparse
                            tasks = tasks.filter(x => x);
                            events = events.filter(x => x);
                            transactions = transactions.filter(x => x);
                            notes = notes.filter(x => x);
                        } catch (parseError) {
                            console.error("Data parsing error:", parseError);
                        }
                    }
                }).catch((e) => {
                    console.error('Firebase Get Error:', e);
                }).finally(() => {
                    resolve();
                });
            });
        } catch (e) {
            console.error('Cloud Load xatosi:', e);
        }
    }

    // Listeners are initialized in waitForFirebaseAndInit or manually if needed
    // initializeMessagesListener(); // Moved to be called only if not already active

    updateUserUI();
}

function updateUserUI() {
    if (!currentUser) return;
    const usernameEle = document.querySelector('.user-profile .username');
    const avatarEle = document.querySelector('.user-profile .avatar');

    if (usernameEle) usernameEle.textContent = currentUser.name || currentUser.login;
    if (avatarEle) {
        if (currentUser.avatar) {
            avatarEle.innerHTML = `<img src="${currentUser.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            avatarEle.style.background = "none";
        } else {
            const nameParts = (currentUser.name || currentUser.login || "U").split(' ');
            const initials = nameParts.length > 1
                ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                : nameParts[0].substring(0, 2).toUpperCase();
            avatarEle.textContent = initials;
        }
    }

    // Show Admin Nav if login is admin OR isAdmin property exists
    const adminNav = document.getElementById('admin-nav-item');
    if (adminNav) {
        const isUserAdmin = (currentUser.login === 'admin' || currentUser.isAdmin === true);
        adminNav.style.display = isUserAdmin ? 'flex' : 'none';
        console.log("Admin Check:", currentUser.login, "isAdmin:", isUserAdmin);
    }

    updateOnlineStatus();
    syncUsersOnce();
}

async function syncUsersOnce() {
    if (currentUser.login !== 'admin') return;
    const localUsers = JSON.parse(localStorage.getItem('dashboard_users') || '[]');
    if (localUsers.length > 0 && window.firebaseDB) {
        for (const u of localUsers) {
            await window.firebaseSet(window.firebaseRef(window.firebaseDB, 'users/' + u.login), u);
        }
        localStorage.removeItem('dashboard_users'); // Clean up local storage
    }
}




function updateDate() {
    const dateElement = document.querySelector('.page-title .date');
    const clockElement = document.getElementById('live-clock');

    const today = new Date();

    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        // Using uz-UZ locale properly
        dateElement.textContent = today.toLocaleDateString('uz-UZ', options);
    }

    if (clockElement) {
        const hh = String(today.getHours()).padStart(2, '0');
        const mm = String(today.getMinutes()).padStart(2, '0');
        clockElement.textContent = `${hh}:${mm}`;
    }
}

// --- Navigation / Tabs ---
function switchTab(tabId, element) {
    console.log('Switching to tab:', tabId);
    // Check if mobile sidebar is open and close it
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
        toggleSidebar();
    }

    const views = document.querySelectorAll('.content-view');
    views.forEach(view => view.style.display = 'none');

    const targetView = document.getElementById(`view-${tabId}`);
    if (targetView) targetView.style.display = 'block';

    const headings = {
        'dashboard': 'Asosiy',
        'tasks': 'Vazifalar',
        'calendar': 'Kalendar',
        'finance': 'Moliya',
        'notes': 'Qaydlar',
        'admin': 'Admin',
        'settings': 'Sozlamalar'
    };

    // Update Sidebar Logo dynamically
    const logoMap = {
        'dashboard': 'logo.png',
        'tasks': 'vazifa-01.png',
        'finance': 'moliya-01.png',
        'calendar': 'kalendar-01.png',
        'notes': 'qaydlar-01.png'
    };
    const logoEle = document.getElementById('sidebar-logo');
    if (logoEle) {
        const logoFile = logoMap[tabId] || 'logo.png';
        logoEle.style.backgroundImage = `url('assets/${logoFile}')`;
    }

    if (tabId === 'dashboard') renderDashboard();
    if (tabId === 'calendar') initCalendar();
    if (tabId === 'finance') initFinance();
    if (tabId === 'notes') renderNotesList();
    if (tabId === 'admin') renderAdminPanel();
    if (tabId === 'settings') loadSettings();
    document.getElementById('page-heading').textContent = headings[tabId] || 'PlanPro';
    if (window.lucide) window.lucide.createIcons();

    // Handle active state
    if (element) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        if (element.classList.contains('nav-item')) {
            element.classList.add('active');
        } else {
            const correspondingNav = document.querySelector(`.nav-item[onclick*="'${tabId}'"]`);
            if (correspondingNav) correspondingNav.classList.add('active');
        }
    }
}

// --- Kanban Logic ---
function updateTaskStatus(id, newStatus) {
    const task = tasks.find(t => t.id === Number(id));
    if (task && task.status !== newStatus) {
        task.status = newStatus;
        saveToCloud();
        renderKanbanTasks();
    }
}

function renderKanbanTasks() {
    const listIds = ['todo', 'in-progress', 'done'];
    const listEles = listIds.map(id => document.getElementById(`list-${id}`));
    listEles.forEach(list => { if (list) list.innerHTML = ''; });

    let counts = { 'todo': 0, 'in-progress': 0, 'done': 0 };

    tasks.forEach(task => {
        if (counts.hasOwnProperty(task.status)) {
            counts[task.status]++;
            const card = createKanbanCard(task);
            const targetList = document.getElementById(`list-${task.status}`);
            if (targetList) targetList.appendChild(card);
        }
    });

    // Empty States
    listIds.forEach(id => {
        const list = document.getElementById(`list-${id}`);
        if (list && list.children.length === 0) {
            list.innerHTML = `
                <div class="empty-state" style="padding: 1.5rem 1rem; border: none; background: transparent;">
                    <i data-lucide="inbox" style="width:20px; opacity:0.3; margin-bottom: 0.5rem;"></i>
                    <p style="font-size: 0.8rem; opacity: 0.6;">Vazifalar yo'q</p>
                </div>`;
        }
    });

    if (document.getElementById('count-todo')) document.getElementById('count-todo').textContent = counts['todo'];
    if (document.getElementById('count-in-progress')) document.getElementById('count-in-progress').textContent = counts['in-progress'];
    if (document.getElementById('count-done')) document.getElementById('count-done').textContent = counts['done'];

    if (window.lucide) window.lucide.createIcons();
    renderDashboard();
}

function createKanbanCard(task) {
    const div = document.createElement('div');
    div.className = `kanban-card status-${task.status}`;
    div.setAttribute('draggable', true);
    div.setAttribute('ondragstart', `drag(event, ${task.id})`);
    div.setAttribute('ondragend', 'dragEnd(event)');
    div.setAttribute('data-task-id', task.id);

    // Add click event for editing, but prevent it when clicking the action buttons
    div.onclick = (e) => {
        if (!e.target.closest('.card-delete-btn') && !e.target.closest('.card-move-btn')) {
            openEditTaskModal(task.id);
        }
    };

    let moveButtons = '';
    if (task.status === 'todo') {
        moveButtons = `
            <button class="card-move-btn next" onclick="updateTaskStatus(${task.id}, 'in-progress'); event.stopPropagation();" title="Boshlash">
                <i data-lucide="play"></i>
                <span>Boshlash</span>
            </button>
        `;
    } else if (task.status === 'in-progress') {
        moveButtons = `
            <div class="move-actions-group">
                <button class="card-move-btn prev" onclick="updateTaskStatus(${task.id}, 'todo'); event.stopPropagation();" title="Orqaga">
                    <i data-lucide="arrow-left"></i>
                </button>
                <button class="card-move-btn next finish" onclick="updateTaskStatus(${task.id}, 'done'); event.stopPropagation();" title="Tugatish">
                    <i data-lucide="check"></i>
                    <span>Tugatish</span>
                </button>
            </div>
        `;
    } else if (task.status === 'done') {
        moveButtons = `
            <button class="card-move-btn prev" onclick="updateTaskStatus(${task.id}, 'in-progress'); event.stopPropagation();" title="Qaytarish">
                <i data-lucide="rotate-ccw"></i>
                <span>Qaytarish</span>
            </button>
        `;
    }

    const deadlineHTML = task.deadline ? `
        <div class="card-meta-item deadline">
            <span>${task.deadline}</span>
        </div>
    ` : '';

    div.innerHTML = `
        <div class="card-title">${task.title}</div>
        <div class="card-desc">${task.desc || ''}</div>
        
        <div class="card-footer">
            <div class="card-meta">
                ${deadlineHTML}
            </div>
            <div class="card-actions-right">
                ${moveButtons}
                <button class="card-delete-btn" onclick="deleteTask(${task.id}); event.stopPropagation();" title="O'chirish">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        </div>
    `;
    return div;
}

// --- Drag and Drop Logic ---

function drag(ev, taskId) {
    ev.dataTransfer.setData("text", taskId);
    ev.dataTransfer.effectAllowed = "move";
    ev.target.classList.add('dragging');
}

function dragEnd(ev) {
    ev.target.classList.remove('dragging');
}

function allowDrop(ev) {
    ev.preventDefault();
}

// New functions for hover effects
function dragEnter(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add('drag-over');
}

function dragLeave(ev) {
    ev.currentTarget.classList.remove('drag-over');
}

function drop(ev, newStatus) {
    ev.preventDefault();
    const container = ev.currentTarget;
    container.classList.remove('drag-over');

    const taskId = parseInt(ev.dataTransfer.getData("text"));
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];

    // Find where it was dropped within the specific list container
    const listContainer = document.getElementById(`list-${newStatus}`);
    const afterElement = getDragAfterElement(listContainer, ev.clientY);

    // Remove from current position
    tasks.splice(taskIndex, 1);

    // Update status
    task.status = newStatus;

    if (afterElement == null) {
        // Appending to the end of the list: Find the last task of this status and insert after it
        // Or just push to the end of the array if visibility order is maintained
        tasks.push(task);
    } else {
        const afterTaskId = parseInt(afterElement.getAttribute('data-task-id'));
        const insertIndex = tasks.findIndex(t => t.id === afterTaskId);
        if (insertIndex !== -1) {
            tasks.splice(insertIndex, 0, task);
        } else {
            tasks.push(task);
        }
    }

    saveToCloud();
    renderKanbanTasks();
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}


// Modal Functions

function openTaskModal() {
    // Reset for adding
    document.getElementById('task-modal-title').textContent = 'Yangi Vazifa Qo\'shish';
    document.getElementById('k-title').value = '';
    document.getElementById('k-desc').value = '';
    document.getElementById('k-deadline').value = '';
    document.getElementById('edit-task-id').value = '';
    document.getElementById('task-modal').style.display = 'flex';
}

function openEditTaskModal(id) {
    const task = tasks.find(t => t.id === Number(id));
    if (!task) return;

    document.getElementById('task-modal-title').textContent = 'Vazifani Tahrirlash';
    document.getElementById('k-title').value = task.title;
    document.getElementById('k-desc').value = task.desc || '';
    document.getElementById('k-deadline').value = task.deadline || '';
    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('task-modal').style.display = 'flex';
}

function closeTaskModal() {
    document.getElementById('task-modal').style.display = 'none';
}

function addKanbanTask() {
    const titleEle = document.getElementById('k-title');
    const descEle = document.getElementById('k-desc');
    const deadlineEle = document.getElementById('k-deadline');
    const idEle = document.getElementById('edit-task-id');

    const title = titleEle.value.trim();
    const desc = descEle.value.trim();
    const deadline = deadlineEle.value;
    const editId = idEle.value;

    if (!title) {
        alert('Iltimos, vazifa nomini kiriting');
        return;
    }

    if (editId) {
        // Update existing task
        const taskIndex = tasks.findIndex(t => t.id === Number(editId));
        if (taskIndex !== -1) {
            tasks[taskIndex].title = title;
            tasks[taskIndex].desc = desc;
            tasks[taskIndex].deadline = deadline;
        }
    } else {
        // Add new task
        const newTask = {
            id: Date.now(),
            title: title,
            desc: desc,
            deadline: deadline,
            status: 'todo',
        };
        tasks.push(newTask);
    }

    saveToCloud();
    renderKanbanTasks();
    renderDashboardSummary();
    closeTaskModal();

    // Reset inputs
    titleEle.value = '';
    descEle.value = '';
    idEle.value = '';
}

function deleteTask(id) {
    showConfirmModal('Ushbu vazifani o\'chirmoqchimisiz?', () => {
        const taskId = Number(id);
        tasks = tasks.filter(t => Number(t.id) !== taskId);
        saveToCloud();
        renderKanbanTasks();
        renderDashboardSummary();
    });
}



// --- CALENDAR LOGIC ---
let currentDate = new Date();
let selectedDate = new Date();
let calendarView = 'month'; // 'week' or 'month'

// Initialize Calendar
function initCalendar() {
    // Mobile UX: Default to week view on small screens
    if (window.innerWidth < 768 && !calendarViewSetManually) {
        calendarView = 'week';
        const weekBtn = document.getElementById('cal-view-week');
        const monthBtn = document.getElementById('cal-view-month');
        if (weekBtn && monthBtn) {
            monthBtn.classList.remove('active');
            weekBtn.classList.add('active');
        }
    }
    renderCalendar();
}

let calendarViewSetManually = false;


// Switch View
function setCalendarView(view, btn) {
    calendarView = view;
    calendarViewSetManually = true;
    document.querySelectorAll('.cal-toggle-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderCalendar();
}

// Change Date
function changeCalendarDate(delta) {
    if (calendarView === 'week') {
        currentDate.setDate(currentDate.getDate() + (delta * 7));
        selectedDate = new Date(currentDate);
    } else if (calendarView === 'month') {
        currentDate.setMonth(currentDate.getMonth() + delta);
        // On month change, select the 1st of that month
        selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    } else {
        currentDate.setFullYear(currentDate.getFullYear() + delta);
        selectedDate = new Date(currentDate.getFullYear(), 0, 1);
    }
    renderCalendar();
}

function goToToday() {
    currentDate = new Date();
    selectedDate = new Date();

    // If in year view, switch to month view to see the actual day
    if (calendarView === 'year') {
        calendarView = 'month';
        // Update toggle buttons UI
        document.querySelectorAll('.cal-toggle-btn').forEach(b => b.classList.remove('active'));
        const monthBtn = document.getElementById('cal-view-month');
        if (monthBtn) monthBtn.classList.add('active');
    }

    renderCalendar();
}

// Render Calendar Dispatcher
function renderCalendar() {
    console.log('Rendering Calendar View:', calendarView);
    const grid = document.getElementById('calendar-grid-v3');
    const label = document.getElementById('current-period-label');
    if (!grid || !label) return;

    const monthNames = [
        "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
        "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    ];

    const layout = document.querySelector('.calendar-page-layout');
    if (layout) {
        if (calendarView === 'year') {
            layout.classList.add('year-view-active');
        } else {
            layout.classList.remove('year-view-active');
        }
    }

    if (calendarView === 'week') {
        grid.className = 'calendar-grid-v3 week-view';
        renderWeekView(grid);

        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        const startMonth = monthNames[startOfWeek.getMonth()];
        const endMonth = monthNames[endOfWeek.getMonth()];
        const year = startOfWeek.getFullYear();

        label.textContent = startMonth === endMonth ? `${startMonth} ${year}` : `${startMonth} - ${endMonth} ${year}`;
    } else if (calendarView === 'month') {
        grid.className = 'calendar-grid-v3 month-view';
        renderMonthView(grid);
        label.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

        // Mobile optimization: update events list for selected date
        if (window.innerWidth <= 768) {
            renderDayEvents(selectedDate.toISOString().split('T')[0]);
        }
    } else if (calendarView === 'year') {
        grid.className = 'calendar-grid-v3 year-view';
        renderYearView(grid);
        label.textContent = `${currentDate.getFullYear()}-yil`;
    }

    if (window.lucide) window.lucide.createIcons();
}

// Helper: Get Monday of the current week
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

// Render Week View (Simplified: Only 7 days, no hours)
function renderWeekView(container) {
    if (!Array.isArray(events)) events = [];
    container.innerHTML = '';

    const uzbekDaysShort = ['DU', 'SE', 'CH', 'PA', 'JU', 'SH', 'YA'];
    uzbekDaysShort.forEach((day, index) => {
        const header = document.createElement('div');
        header.className = 'v3-header';
        if (index === 6) header.style.color = '#EF5C91';
        header.textContent = day;
        container.appendChild(header);
    });

    const startOfWeek = getStartOfWeek(currentDate);

    for (let i = 0; i < 7; i++) {
        const cellDate = new Date(startOfWeek);
        cellDate.setDate(startOfWeek.getDate() + i);
        const dateStr = cellDate.toISOString().split('T')[0];

        const cell = document.createElement('div');
        cell.className = 'v3-cell';
        const today = new Date();
        if (dateStr === today.toISOString().split('T')[0]) cell.classList.add('today');

        const uzbekDaysFull = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
        const dayName = uzbekDaysFull[i];

        cell.innerHTML = `
            <div class="v3-cell-top">
                <span class="v3-day-label-mobile">${dayName}</span>
                <div class="v3-day-num">${cellDate.getDate()}</div>
            </div>
        `;

        const dayEvents = events.filter(e => e.date === dateStr);
        dayEvents.forEach(ev => {
            const evDiv = document.createElement('div');
            evDiv.className = 'v3-event';
            evDiv.style.backgroundColor = ev.color;
            evDiv.textContent = ev.title;

            evDiv.onclick = (e) => {
                e.stopPropagation();
                showEventDetails(ev.id);
            };

            cell.appendChild(evDiv);
        });

        cell.onclick = (e) => {
            if (e.target === cell || e.target.classList.contains('v3-day-num')) {
                editingEventId = null;
                openEventModalWithDate(dateStr, '09:00');
            }
        };

        container.appendChild(cell);
    }
}

// Render Month View
function renderMonthView(container) {
    if (!Array.isArray(events)) events = [];
    container.innerHTML = '';

    const uzbekDaysShort = ['DU', 'SE', 'CH', 'PA', 'JU', 'SH', 'YA'];
    uzbekDaysShort.forEach((day, index) => {
        const header = document.createElement('div');
        header.className = 'v3-header';
        if (index === 6) header.style.color = '#EF5C91';
        header.textContent = day;
        container.appendChild(header);
    });

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    for (let i = 0; i < startDayIndex; i++) {
        const empty = document.createElement('div');
        empty.className = 'v3-cell empty';
        container.appendChild(empty);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const selDateStr = selectedDate.toISOString().split('T')[0];

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const dateStr = cellDate.toISOString().split('T')[0];

        const cell = document.createElement('div');
        cell.className = 'v3-cell';

        if (dateStr === todayStr) cell.classList.add('today');
        if (dateStr === selDateStr) cell.classList.add('selected');

        const dayEvents = events.filter(e => e.date === dateStr);
        if (dayEvents.length > 0) cell.classList.add('has-events');

        cell.innerHTML = `
            <div class="v3-day-num">${i}</div>
            <div class="v3-dot-indicator"></div>
        `;

        dayEvents.forEach(ev => {
            const evDiv = document.createElement('div');
            evDiv.className = 'v3-event';
            evDiv.style.backgroundColor = ev.color;
            evDiv.textContent = ev.title;

            evDiv.onclick = (e) => {
                e.stopPropagation();
                showEventDetails(ev.id);
            };

            cell.appendChild(evDiv);
        });

        cell.onclick = (e) => {
            if (window.innerWidth <= 768) {
                selectedDate = new Date(dateStr);
                renderMonthView(container);
                renderDayEvents(dateStr);
            } else {
                if (e.target === cell || e.target.classList.contains('v3-day-num') || e.target.classList.contains('v3-dot-indicator')) {
                    editingEventId = null;
                    openEventModalWithDate(dateStr, '09:00');
                }
            }
        };

        container.appendChild(cell);
    }
}

function renderDayEvents(dateStr) {
    const panel = document.getElementById('event-details-panel');
    if (!panel) return;

    const dayEvents = events.filter(e => e.date === dateStr);
    const d = new Date(dateStr);
    const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
    const formattedDate = `${d.getDate()}-${monthNames[d.getMonth()]}`;

    if (dayEvents.length === 0) {
        panel.innerHTML = `
            <div class="no-selection-state">
                <div class="illus-circle"><i data-lucide="calendar"></i></div>
                <h3>${formattedDate}</h3>
                <p>Ushbu kunda rejalar yo'q.</p>
                <button class="primary-btn-modern" onclick="openEventModalWithDate('${dateStr}', '09:00')" style="margin-top:15px;">
                    <i data-lucide="plus"></i> Reja qo'shish
                </button>
            </div>
        `;
    } else {
        panel.innerHTML = `
            <div class="day-events-header">
                <h3>${formattedDate} rejalari</h3>
            </div>
            <div class="day-events-list">
                ${dayEvents.map(ev => `
                    <div class="day-event-card" onclick="showEventDetails(${ev.id})">
                        <div class="event-card-color" style="background:${ev.color}"></div>
                        <div class="event-card-info">
                            <div class="event-card-time">${ev.time}</div>
                            <div class="event-card-title">${ev.title}</div>
                        </div>
                        <i data-lucide="chevron-right"></i>
                    </div>
                `).join('')}
            </div>
            <button class="primary-btn-modern" onclick="openEventModalWithDate('${dateStr}', '09:00')" style="margin-top:15px; width:100%;">
                <i data-lucide="plus"></i> Yana qo'shish
            </button>
        `;
    }
    if (window.lucide) window.lucide.createIcons();
}



// --- Event Modal Functions ---
function openEventModal() {
    editingEventId = null;
    document.getElementById('event-modal-title').textContent = "Yangi Reja Qo'shish";
    document.getElementById('delete-event-btn').style.display = 'none';

    // Set default date/time
    const now = new Date();
    document.getElementById('e-date').valueAsDate = now;
    document.getElementById('e-time').value = '09:00';
    document.getElementById('e-color').value = '#6B4EFF';
    document.getElementById('e-title').value = '';
    document.getElementById('e-desc').value = '';

    const options = document.querySelectorAll('.color-option');
    options.forEach(el => el.classList.remove('selected'));
    options.forEach(el => {
        if (el.style.backgroundColor.toLowerCase().includes('6b4eff')) el.classList.add('selected');
    });

    document.getElementById('event-modal').style.display = 'flex';
}

function openEventModalWithDate(dateStr, timeStr) {
    editingEventId = null;
    document.getElementById('event-modal-title').textContent = "Yangi Reja Qo'shish";
    document.getElementById('delete-event-btn').style.display = 'none';

    document.getElementById('e-date').value = dateStr;
    document.getElementById('e-time').value = timeStr;
    document.getElementById('e-color').value = '#3B82F6'; // Default
    document.getElementById('e-title').value = '';

    // Select default color visually
    const options = document.querySelectorAll('.color-option');
    options.forEach(el => el.classList.remove('selected'));
    // Find option with #3B82F6 and select it
    options.forEach(el => {
        if (el.style.backgroundColor.toLowerCase().includes('6b4eff')) el.classList.add('selected');
    });

    document.getElementById('event-modal').style.display = 'flex';
}

// Render Year View
// Render Year View
function renderYearView(container) {
    if (!Array.isArray(events)) events = [];
    container.innerHTML = '';
    const monthNames = [
        "YANVAR", "FEVRAL", "MART", "APREL", "MAY", "IYUN",
        "IYUL", "AVGUST", "SENTABR", "OKTABR", "NOYABR", "DEKABR"
    ];
    // Monday first
    const daysShort = ['D', 'S', 'CH', 'P', 'J', 'SH', 'Y'];

    for (let m = 0; m < 12; m++) {
        const monthBox = document.createElement('div');
        monthBox.className = 'year-month-box';

        const title = document.createElement('div');
        title.className = 'year-month-title';
        title.textContent = monthNames[m];
        monthBox.appendChild(title);

        const miniGrid = document.createElement('div');
        miniGrid.className = 'year-mini-grid';

        // Headers
        daysShort.forEach((d, idx) => {
            const h = document.createElement('div');
            h.className = 'year-mini-header';
            if (idx === 6) h.classList.add('sun'); // YA is Sunday
            h.textContent = d;
            miniGrid.appendChild(h);
        });

        const firstDay = new Date(currentDate.getFullYear(), m, 1);
        const lastDay = new Date(currentDate.getFullYear(), m + 1, 0);

        // Monday start logic: (day + 6) % 7
        let startIdx = (firstDay.getDay() + 6) % 7;

        // Empty cells
        for (let i = 0; i < startIdx; i++) {
            const empty = document.createElement('div');
            empty.className = 'year-mini-day empty';
            miniGrid.appendChild(empty);
        }

        // Days
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'year-mini-day';
            dayDiv.textContent = d;

            const dateStr = `${currentDate.getFullYear()}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

            // Check if today
            const today = new Date();
            if (dateStr === today.toISOString().split('T')[0]) dayDiv.classList.add('today');

            // Click navigates to month view
            dayDiv.onclick = (e) => {
                e.stopPropagation();
                currentDate.setFullYear(currentDate.getFullYear());
                currentDate.setMonth(m);
                currentDate.setDate(d);

                // Switch view
                calendarView = 'month';
                calendarViewSetManually = true;

                // Update active buttons
                document.querySelectorAll('.cal-toggle-btn').forEach(b => b.classList.remove('active'));
                const monthBtn = document.getElementById('cal-view-month');
                if (monthBtn) monthBtn.classList.add('active');

                renderCalendar();

                // Proactively show details for this date if it's selected
                // (Month view logic usually handles highlighting)
            };

            miniGrid.appendChild(dayDiv);
        }

        monthBox.appendChild(miniGrid);
        container.appendChild(monthBox);
    }
}

function openEditEventModal(id) {
    const ev = events.find(e => Number(e.id) === Number(id));
    if (!ev) return;

    editingEventId = ev.id;
    document.getElementById('event-modal-title').textContent = "Rejani Taxrirlash";
    document.getElementById('delete-event-btn').style.display = 'block';

    document.getElementById('e-title').value = ev.title;
    document.getElementById('e-desc').value = ev.desc || '';
    document.getElementById('e-date').value = ev.date;
    document.getElementById('e-time').value = ev.time;
    document.getElementById('e-color').value = ev.color;

    const options = document.querySelectorAll('.color-option');
    options.forEach(el => el.classList.remove('selected'));
    options.forEach(el => {
        if (el.style.backgroundColor.toLowerCase().includes(ev.color.toLowerCase())) el.classList.add('selected');
    });

    document.getElementById('event-modal').style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
}

function closeEventModal() {
    document.getElementById('event-modal').style.display = 'none';
    document.getElementById('e-title').value = '';
    editingEventId = null;
}

function selectColor(element, color) {
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    document.getElementById('e-color').value = color;
}

function addEvent() {
    const title = document.getElementById('e-title').value.trim();
    const desc = document.getElementById('e-desc').value.trim();
    const dateVal = document.getElementById('e-date').value;
    const time = document.getElementById('e-time').value;
    const color = document.getElementById('e-color').value;

    if (!title || !dateVal || !time) {
        alert('Iltimos, barcha maydonlarni to\'ldiring');
        return;
    }

    if (editingEventId) {
        const index = events.findIndex(e => Number(e.id) === Number(editingEventId));
        if (index !== -1) {
            events[index] = {
                ...events[index],
                title,
                desc,
                date: dateVal,
                time,
                color
            };
        }
    } else {
        events.push({
            id: Date.now(),
            groupId: null,
            title,
            desc,
            date: dateVal,
            time,
            color
        });
    }

    saveToCloud();
    renderCalendar();
    renderDashboardSummary();
    closeEventModal();
}

function deleteCurrentEvent() {
    if (editingEventId) {
        deleteEvent(editingEventId);
        closeEventModal();
    }
}

function deleteEvent(id) {
    showConfirmModal('Rejani o\'chirmoqchimisiz?', () => {
        const eventId = Number(id);
        events = events.filter(e => Number(e.id) !== eventId);
        saveToCloud();
        renderCalendar();
        renderDashboardSummary();

        // Reset details panel
        document.getElementById('event-details-panel').innerHTML = `
            <div class="no-selection-state">
                <div class="illus-circle">
                    <i data-lucide="calendar-days"></i>
                </div>
                <h3>Reja tanlanmagan</h3>
                <p>Tafsilotlarni ko'rish uchun kalendardagi rejalardan birini tanlang yoki yangi reja qo'shing.</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    });
}

function showEventDetails(id) {
    const ev = events.find(e => Number(e.id) === Number(id));
    if (!ev) return;

    const panel = document.getElementById('event-details-panel');
    const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

    // Parse Date
    const d = new Date(ev.date);
    const dateStr = `${d.getDate()} ${monthNames[d.getMonth()]}, ${d.getFullYear()}`;

    // Creator Info (Fallback to current user)
    const creatorName = currentUser ? (currentUser.name || currentUser.login) : "Foydalanuvchi";
    const avatarContent = currentUser && currentUser.avatar
        ? `<img src="${currentUser.avatar}" class="creator-avatar">`
        : `<div class="creator-avatar" style="background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-weight:700;">${creatorName.substring(0, 2).toUpperCase()}</div>`;

    panel.innerHTML = `
        <div class="detail-header">
            <div class="detail-header-top">
                <h2>${ev.title}</h2>
                <div class="detail-actions">
                    <button class="icon-btn edit-event" onclick="openEditEventModal(${ev.id})" title="Taxrirlash">
                        <i data-lucide="edit"></i>
                    </button>
                    <button class="icon-btn delete-event" onclick="deleteEvent(${ev.id})" title="O'chirish" style="color:#EF5C91;">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
            <div class="detail-desc">
                ${ev.desc || "Ushbu reja uchun qo'shimcha tafsilotlar kiritilmagan."}
            </div>
        </div>

        <div class="detail-meta-list">
            <div class="meta-item">
                <div class="meta-icon-box">
                    <i data-lucide="calendar"></i>
                </div>
                <div class="meta-text">
                    <span class="meta-val">${dateStr}</span>
                    <span class="meta-lab">Sana</span>
                </div>
            </div>
            <div class="meta-item">
                <div class="meta-icon-box">
                    <i data-lucide="clock"></i>
                </div>
                <div class="meta-text">
                    <span class="meta-val">${ev.time}</span>
                    <span class="meta-lab">Boshlanish vaqti</span>
                </div>
            </div>
        </div>

        <div class="creator-info">
            ${avatarContent}
            <div class="creator-bio">
                <div class="creator-name">${creatorName}</div>
                <div class="creator-role">Reja egasi</div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
}



// --- FINANCE LOGIC ---
let currentFinanceView = 'monthly'; // 'daily', 'weekly' or 'monthly'
let currentFinanceDate = new Date();

function initFinance() {
    renderFinance();
}

function setFinanceView(view) {
    currentFinanceView = view;
    document.querySelectorAll('.view-toggle .toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');
    renderFinance();
}

function changeFinanceDate(delta) {
    if (currentFinanceView === 'daily') {
        currentFinanceDate.setDate(currentFinanceDate.getDate() + delta);
    } else if (currentFinanceView === 'weekly') {
        currentFinanceDate.setDate(currentFinanceDate.getDate() + (delta * 7));
    } else {
        // Monthly
        currentFinanceDate.setMonth(currentFinanceDate.getMonth() + delta);
    }
    renderFinance();
}

function addTransaction(type) {
    let amount, desc, category;

    if (type === 'income') {
        amount = document.getElementById('income-amount').value;
        category = document.getElementById('income-type').value;
        const catLabel = category === 'salary' ? 'Oylik' : 'Qo\'shimcha';
        desc = catLabel + ' Kirim';
    } else {
        amount = document.getElementById('expense-amount').value;
        desc = document.getElementById('expense-desc').value.trim() || 'Xarajat';
        category = 'expense';
    }

    if (!amount || amount <= 0) {
        alert('Iltimos, to\'g\'ri summa kiriting');
        return;
    }

    transactions.unshift({
        id: Date.now(),
        type: type, // 'income' or 'expense'
        amount: parseFloat(amount),
        desc: desc,
        date: new Date()
    });

    if (type === 'income') {
        document.getElementById('income-amount').value = '';
    } else {
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-desc').value = '';
    }

    saveToCloud();
    renderFinance();
    renderDashboardSummary();
}

function deleteTransaction(id) {
    showConfirmModal('Ushbu o\'tkazmani o\'chirmoqchimisiz?', () => {
        const transId = Number(id);
        const toDelete = transactions.find(t => Number(t.id) === transId);
        if (toDelete) {
            addToFinanceTrash('Bitta o\'tkazma', [toDelete]);
            transactions = transactions.filter(t => Number(t.id) !== transId);
            saveToCloud();
            renderFinance();
            renderDashboardSummary();
        }
    });
}

function addToFinanceTrash(label, data) {
    financeTrashHistory.unshift({
        id: Date.now(),
        label: label,
        data: [...data],
        timestamp: new Date()
    });
    // Keep only last 3
    if (financeTrashHistory.length > 3) {
        financeTrashHistory.pop();
    }
}

function restoreFinanceTrash(historyId) {
    const record = financeTrashHistory.find(h => h.id === historyId);
    if (!record) return;

    // Add back to transactions
    transactions = [...record.data, ...transactions];
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Remove from trash
    financeTrashHistory = financeTrashHistory.filter(h => h.id !== historyId);

    saveToCloud();
    renderFinance();
    toggleRestoreDropdown();
}

function clearCurrentPeriodFinance() {
    let startTime, endTime;
    const year = currentFinanceDate.getFullYear();
    const month = currentFinanceDate.getMonth();
    const date = currentFinanceDate.getDate();

    if (currentFinanceView === 'daily') {
        startTime = new Date(year, month, date, 0, 0, 0);
        endTime = new Date(year, month, date, 23, 59, 59);
    } else if (currentFinanceView === 'weekly') {
        const day = currentFinanceDate.getDay();
        const diff = currentFinanceDate.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(currentFinanceDate);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        startTime = startOfWeek;
        endTime = endOfWeek;
    } else {
        startTime = new Date(year, month, 1, 0, 0, 0);
        endTime = new Date(year, month + 1, 0, 23, 59, 59);
    }

    const filteredToDelete = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= startTime && tDate <= endTime;
    });

    if (filteredToDelete.length === 0) {
        alert('Bu davrda o\'chirish uchun o\'tkazmalar yo\'q');
        return;
    }

    const periodLabel = currentFinanceView === 'daily' ? 'bugungi' : (currentFinanceView === 'weekly' ? 'ushbu haftalik' : 'ushbu oylik');

    showConfirmModal(`Rostdan ham barcha ${periodLabel} o'tkazmalarni o'chirmoqchimisiz?`, () => {
        addToFinanceTrash(`${periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)} tozalash`, filteredToDelete);
        transactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate < startTime || tDate > endTime;
        });
        saveToCloud();
        renderFinance();
    });
}

function renderFinance() {
    const list = document.getElementById('transaction-list');
    const totalIncEle = document.getElementById('total-income');
    const totalExpEle = document.getElementById('total-expense');
    const totalBalEle = document.getElementById('total-balance');
    const dateLabel = document.getElementById('finance-date-label');

    if (!list) return;

    list.innerHTML = '';

    // Variables for current view totals
    let windowIncome = 0;
    let windowExpense = 0;

    // Date Filtering Logic
    let startTime, endTime;
    const year = currentFinanceDate.getFullYear();
    const month = currentFinanceDate.getMonth();
    const date = currentFinanceDate.getDate();
    const uzbekMonths = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

    if (currentFinanceView === 'daily') {
        startTime = new Date(year, month, date, 0, 0, 0);
        endTime = new Date(year, month, date, 23, 59, 59);
        dateLabel.textContent = `${date} ${uzbekMonths[month]} ${year}`;
    } else if (currentFinanceView === 'weekly') {
        const day = currentFinanceDate.getDay();
        const diff = currentFinanceDate.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(currentFinanceDate);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        startTime = startOfWeek;
        endTime = endOfWeek;

        const startM = uzbekMonths[startOfWeek.getMonth()];
        const endM = uzbekMonths[endOfWeek.getMonth()];

        if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
            dateLabel.textContent = `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${startM} ${year}`;
        } else {
            dateLabel.textContent = `${startOfWeek.getDate()} ${startM} - ${endOfWeek.getDate()} ${endM} ${year}`;
        }
    } else {
        // Monthly
        startTime = new Date(year, month, 1, 0, 0, 0);
        endTime = new Date(year, month + 1, 0, 23, 59, 59);
        dateLabel.textContent = `${uzbekMonths[month]} ${year}`;
    }

    const filtered = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= startTime && tDate <= endTime;
    });

    if (filtered.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding: 20px; color: #888;">Bu davrda o\'tkazmalar yo\'q</div>';
    } else {
        filtered.forEach(t => {
            if (t.type === 'income') windowIncome += t.amount;
            else windowExpense += t.amount;

            const dateStr = t.date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

            const item = document.createElement('div');
            item.className = 'history-item';

            const icon = t.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle';
            const sign = t.type === 'income' ? '+' : '-';

            item.innerHTML = `
                <div class="h-info">
                    <div class="h-icon ${t.type}"><i data-lucide="${icon}"></i></div>
                    <div class="h-details">
                        <span class="h-title">${t.desc}</span>
                        <span class="h-meta">${dateStr}</span>
                    </div>
                </div>
                <div class="h-info">
                     <span class="h-amount ${t.type}">${sign} ${formatMoney(t.amount)}</span>
                     <button class="delete-trans-btn" onclick="deleteTransaction(${t.id})"><i data-lucide="trash-2" style="width:16px"></i></button>
                </div>
            `;
            list.appendChild(item);
        });
    }

    // Display Window Totals
    totalIncEle.textContent = formatMoney(windowIncome);
    totalExpEle.textContent = formatMoney(windowExpense);

    // Calculate All Time Balance for the Wallet Card
    let allTimeIncome = 0;
    let allTimeExpense = 0;
    transactions.forEach(t => {
        if (t.type === 'income') allTimeIncome += t.amount;
        else allTimeExpense += t.amount;
    });
    const balance = allTimeIncome - allTimeExpense;

    if (totalBalEle) {
        totalBalEle.textContent = formatMoney(balance);
        totalBalEle.style.color = balance >= 0 ? '#3B82F6' : '#EF5C91';
    }

    lucide.createIcons();
    renderDashboard();
    renderRestoreDropdown();
}

function toggleRestoreDropdown() {
    const dropdown = document.getElementById('restore-dropdown');
    const msgDropdown = document.getElementById('messages-dropdown');
    const notifDropdown = document.getElementById('notifications-dropdown');
    const profileDropdown = document.getElementById('profile-menu');

    if (msgDropdown) msgDropdown.style.display = 'none';
    if (notifDropdown) notifDropdown.style.display = 'none';
    if (profileDropdown) profileDropdown.style.display = 'none';

    if (!dropdown) return;

    if (dropdown.style.display === 'flex') {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'flex';
        renderRestoreDropdown();
    }
    event.stopPropagation();
}

function renderRestoreDropdown() {
    const list = document.getElementById('restore-history-list');
    const badge = document.getElementById('restore-badge');
    if (!list) return;

    list.innerHTML = '';
    if (financeTrashHistory.length === 0) {
        list.innerHTML = '<div style="padding:15px; text-align:center; color:#888; font-size:0.85rem;">Hech narsa o\'chirilmagan</div>';
        if (badge) badge.style.display = 'none';
    } else {
        if (badge) {
            badge.style.display = 'flex';
            badge.textContent = financeTrashHistory.length;
        }

        financeTrashHistory.forEach(record => {
            const time = new Date(record.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
            const item = document.createElement('div');
            item.className = 'restore-item';
            item.innerHTML = `
                <div class="restore-details">
                    <span class="restore-label">${record.label}</span>
                    <span class="restore-meta">${record.data.length} ta amal � ${time}</span>
                </div>
                <button class="restore-btn-action" onclick="restoreFinanceTrash(${record.id})">
                    <i data-lucide="rotate-ccw" style="width:14px"></i> Tiklash
                </button>
            `;
            list.appendChild(item);
        });
    }
    lucide.createIcons();
}

function downloadFinancePDF() {
    const element = document.getElementById('transaction-list').parentNode;
    // We want the whole section or just the list? The user said "download inputs and expenses *on that day*"
    // Probably the list view is most important. 
    // Let's clone the table or list to generate a clean PDF.
    // Or just screenshot the history section.

    // Creating a temporary element for PDF to ensure it looks good
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
        <h2 style="text-align:center; margin-bottom: 20px;">Moliya Hisoboti</h2>
        <h3 style="text-align:center; margin-bottom: 20px;">${document.getElementById('finance-date-label').textContent}</h3>
        <div style="margin-bottom: 20px;">
             ${document.getElementById('transaction-list').innerHTML}
        </div>
        <div style="text-align: right; margin-top: 20px;">
            <strong>Jami Kirim:</strong> ${document.getElementById('total-income').textContent}<br>
            <strong>Jami Chiqim:</strong> ${document.getElementById('total-expense').textContent}
        </div>
    `;
    // We need to apply some styles to tempDiv or it will look unstyled
    // Ideally we clone and use the styles. 
    // using html2pdf on the actual element is easier but might include buttons.

    // Simplest: Target the history list wrapper, hide buttons via CSS during generation? 
    // Let's try passing the 'transaction-history' element but we need to hide the buttons.
    // CSS-wise: .icon-btn { display: none } in opt? html2pdf doesn't support easy CSS injection like that.

    // Let's rely on constructing a simple HTML string for the PDF.

    const opt = {
        margin: 0.5,
        filename: `hisobot_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(tempDiv).save();
}

function formatMoney(amount) {
    return amount.toLocaleString('uz-UZ') + " so'm";
}

// Profile Menu Logic
function toggleProfileMenu() {
    const menu = document.getElementById('profile-menu');
    menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';

    // Stop propagation so the window click listener doesn't immediately close it
    event.stopPropagation();
}

function logout() {
    showLogoutConfirmModal('Tizimdan chiqmoqchimisiz?', () => {
        localStorage.removeItem('dashboard_current_user');
        window.location.href = 'index.html';
    }, 'Ha, Chiqish');
}

// Update global click listener to include profile menu
window.addEventListener('click', function (event) {
    const profileMenu = document.getElementById('profile-menu');
    if (profileMenu && !event.target.closest('.user-profile')) {
        profileMenu.style.display = 'none';
    }

    const restoreDropdown = document.getElementById('restore-dropdown');
    if (restoreDropdown && !event.target.closest('.action-wrapper')) {
        restoreDropdown.style.display = 'none';
    }

    // Toggle dropdowns (like the one in Notes)
    const allDropdowns = document.querySelectorAll('.dropdown');
    allDropdowns.forEach(dd => {
        if (event.target.closest('.dropdown-toggle') && dd.contains(event.target)) {
            dd.classList.toggle('open');
        } else if (!dd.contains(event.target)) {
            dd.classList.remove('open');
        }
    });

    // Existing modal logic
    const modal = document.getElementById('task-modal');
    if (event.target == modal) {
        closeTaskModal();
    }
    const eModal = document.getElementById('event-modal');
    if (event.target == eModal) {
        closeEventModal();
    }
});

// --- DASHBOARD RENDERING ---
function renderDashboard() {
    renderDashBalance();
    renderDashTasks();
    renderMiniCalendar();
    renderDashEvents();
    renderFocusBlock(); // Add Focus Block

    // Update completed task count and efficiency
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;

    // Efficiency calculation
    const efficiency = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const taskCountEle = document.getElementById('dash-task-count');
    if (taskCountEle) taskCountEle.textContent = doneTasks;

    const efficiencyEle = document.getElementById('dash-efficiency');
    if (efficiencyEle) efficiencyEle.textContent = efficiency + '%';
}

function renderFocusBlock() {
    const block = document.getElementById('focus-block');
    if (!block) return;

    // Ensure block is visible
    block.style.display = 'block';

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    // 1. Today's Tasks
    const todayTasks = tasks.filter(t => t.deadline === todayStr && t.status !== 'done');
    const todayTasksCount = todayTasks.length;

    // 2. Overdue Tasks
    const overdueTasks = tasks.filter(t => {
        if (!t.deadline || t.status === 'done' || t.status === 'archived') return false;
        return t.deadline < todayStr;
    });
    const overdueCount = overdueTasks.length;

    // 3. Next Event Logic
    // Convert current time to string "HH:MM" for comparison
    const currentHH = String(now.getHours()).padStart(2, '0');
    const currentMM = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHH}:${currentMM}`;

    // Filter events for today and time > now
    const todayEvents = events.filter(e => e.date === todayStr);
    const nextEvents = todayEvents.filter(e => e.time > currentTimeStr);

    // Sort by time
    nextEvents.sort((a, b) => a.time.localeCompare(b.time));
    const nextEvent = nextEvents.length > 0 ? nextEvents[0] : null;

    // Check for next urgent task within today if no events
    let nextTask = null;
    if (!nextEvent && todayTasksCount > 0) {
        // Just pick the first todo task
        nextTask = todayTasks[0];
    }

    // Update UI elements
    const countEl = document.getElementById('focus-today-count');
    const overdueEl = document.getElementById('focus-overdue-count');
    const nextEl = document.getElementById('focus-next-time');

    if (countEl) {
        if (todayTasksCount === 0) {
            // Check if there were any tasks for today that are now 'done'
            const finishedToday = tasks.filter(t => t.deadline === todayStr && t.status === 'done').length;
            if (finishedToday > 0) {
                countEl.innerHTML = `<span class="focus-badge success"><i data-lucide="check-circle"></i> Barcha vazifalar bajarildi</span>`;
            } else {
                countEl.innerHTML = `<span class="focus-badge default"><i data-lucide="coffee"></i> Bugun vazifalar yo'q</span>`;
            }
        } else {
            countEl.innerHTML = `<span class="focus-badge warning"><i data-lucide="list"></i> Bugun ${todayTasksCount} ta vazifa</span>`;
        }
    }

    if (overdueEl) {
        // Handle Previous Sibling (Dot) visibility - No longer valid as we removed dots, but logic kept safe
        const prevDot = overdueEl.previousElementSibling;
        if (prevDot && prevDot.classList.contains('focus-dot')) prevDot.style.display = 'none';

        if (overdueCount > 0) {
            overdueEl.innerHTML = `<span class="focus-badge warning"><i data-lucide="alert-circle"></i> ${overdueCount} tasi kechikkan</span>`;
            overdueEl.style.display = 'inline';
        } else {
            overdueEl.style.display = 'none';
        }
    }

    if (nextEl) {
        // Handle Previous Sibling (Dot) - remove if present
        const prevDot = nextEl.previousElementSibling;
        if (prevDot && prevDot.classList.contains('focus-dot')) prevDot.style.display = 'none';

        if (nextEvent) {
            nextEl.innerHTML = `<span class="focus-badge info"><i data-lucide="clock"></i> ${nextEvent.time} ${nextEvent.title}</span>`;
            nextEl.className = '';
        } else if (todayTasksCount > 0) {
            nextEl.innerHTML = `<span class="focus-badge info"><i data-lucide="zap"></i> Vazifalarni bajaring!</span>`;
            nextEl.className = '';
        } else {
            nextEl.innerHTML = `<span class="focus-badge default"><i data-lucide="check-check"></i> Barchasi bajarildi</span>`;
            nextEl.className = '';
        }
    }

    if (window.lucide) window.lucide.createIcons();
}

let isBalancePrivate = localStorage.getItem('planpro_balance_private') !== 'false';

function toggleBalancePrivacy() {
    isBalancePrivate = !isBalancePrivate;
    localStorage.setItem('planpro_balance_private', isBalancePrivate);
    renderDashBalance();
}

function renderDashBalance() {
    let allTimeIncome = 0;
    let allTimeExpense = 0;
    transactions.forEach(t => {
        if (t.type === 'income') allTimeIncome += t.amount;
        else allTimeExpense += t.amount;
    });
    const balance = allTimeIncome - allTimeExpense;
    const dashBalEle = document.getElementById('dash-balance');
    const eyeIcon = document.getElementById('balance-eye-icon');

    if (dashBalEle) {
        // Subtle fade transition for the value
        dashBalEle.style.opacity = '0';

        setTimeout(() => {
            if (isBalancePrivate) {
                dashBalEle.textContent = "********* so'm";
                if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye-off');
            } else {
                dashBalEle.textContent = formatMoney(balance);
                if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye');
            }
            dashBalEle.style.opacity = '1';
            if (window.lucide) window.lucide.createIcons();
        }, 120);
    }
}

function renderDashTasks() {
    const list = document.getElementById('dash-ongoing-tasks');
    if (!list) return;

    list.innerHTML = '';
    const ongoing = tasks.filter(t => t.status === 'in-progress');

    if (ongoing.length === 0) {
        list.innerHTML = '<p style="color:#999;font-size:0.9rem;">Hozirda bajarilayotgan vazifalar yo\'q.</p>';
        return;
    }

    ongoing.forEach(task => {
        const item = document.createElement('div');
        item.className = 'dash-task-item';
        item.style.cursor = 'pointer';
        item.onclick = () => openEditTaskModal(task.id);
        item.innerHTML = `
            <div class="task-status-dot" style="background: #F4B846;"></div>
            <div class="dash-task-info">
                <div class="dash-task-title">${task.title}</div>
                <div class="dash-task-desc">${task.desc || ''}</div>
            </div>
        `;
        list.appendChild(item);
    });
}



let miniCalDate = new Date();

function changeMiniCalMonth(delta) {
    miniCalDate.setMonth(miniCalDate.getMonth() + delta);
    renderMiniCalendar();
    lucide.createIcons();
}

// --- DASHBOARD LOGIC ---
let selectedDashboardDate = new Date();

function selectDashboardDate(y, m, d) {
    console.log('Selecting Dashboard Date:', y, m, d);
    selectedDashboardDate = new Date(y, m, d);
    renderMiniCalendar();
    renderDashboardSummary();
}

function openFinanceForDate() {
    console.log('Opening Finance for:', selectedDashboardDate);
    const financeBtn = document.getElementById('nav-finance');
    if (financeBtn) switchTab('finance', financeBtn);
    setFinanceView('daily');
    currentFinanceDate = new Date(selectedDashboardDate);
    renderFinance();
}

function openCalendarForDate() {
    console.log('Opening Calendar for:', selectedDashboardDate);
    const calendarBtn = document.getElementById('nav-calendar');
    if (calendarBtn) switchTab('calendar', calendarBtn);
    currentDate = new Date(selectedDashboardDate);
    renderCalendar();
}

function openNotesForDate() {
    console.log('Opening Notes');
    const notesBtn = document.getElementById('nav-notes');
    if (notesBtn) switchTab('notes', notesBtn);
}

function renderMiniCalendar() {
    const grid = document.getElementById('mini-cal-grid');
    const monthLabel = document.getElementById('mini-cal-month');
    if (!grid) return;

    grid.innerHTML = '';
    const year = miniCalDate.getFullYear();
    const month = miniCalDate.getMonth();

    const now = new Date();
    // highlight today if current month view matches real current month
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
    const today = now.getDate();

    const uzbekMonths = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
    monthLabel.textContent = `${uzbekMonths[month]} ${year}`;

    // Get first day of month
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    // Shift for Monday start (0=Sun, 1=Mon... in JS) -> (0=Mon, 1=Tue... 6=Sun)
    let startOffset = firstDay === 0 ? 6 : firstDay - 1;

    // Fill empty slots
    for (let i = 0; i < startOffset; i++) {
        const span = document.createElement('span');
        span.className = 'mini-cal-day other-month';
        grid.appendChild(span);
    }

    // Fill days
    for (let d = 1; d <= lastDate; d++) {
        const span = document.createElement('span');
        span.className = 'mini-cal-day';

        // Check if selected
        const isSelected = selectedDashboardDate.getFullYear() === year && selectedDashboardDate.getMonth() === month && selectedDashboardDate.getDate() === d;

        if (isSelected) {
            span.classList.add('selected');
        } else if (isCurrentMonth && d === today) {
            span.classList.add('today');
        }

        // Check if this day has any events
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hasEvent = events.some(e => e.date === dStr);
        if (hasEvent) span.classList.add('has-event');

        span.textContent = d;
        span.onclick = () => selectDashboardDate(year, month, d);
        grid.appendChild(span);
    }
}

// Replaces old renderDashEvents
function renderDashEvents() {
    renderDashboardSummary();
}

function renderDashboardSummary() {
    const list = document.getElementById('dash-today-events');
    const header = document.getElementById('quick-stats-header');
    if (!list || !header) return;

    list.innerHTML = '';

    // Format Date Header: e.g. "18 Fevral — Tanlangan kun"
    const monthIndex = selectedDashboardDate.getMonth();
    const day = selectedDashboardDate.getDate();
    const uzbekMonths = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
    const dateStr = `${day} ${uzbekMonths[monthIndex]}`;
    header.innerHTML = `<span class="day-highlight">${dateStr}</span> — Tanlangan kun`;

    // 1. Filter Data
    const year = selectedDashboardDate.getFullYear();
    const month = selectedDashboardDate.getMonth();
    const date = selectedDashboardDate.getDate();

    const dateYMD = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.date === dateYMD);
    const dayNotes = notes.filter(n => {
        const nd = new Date(n.date);
        return nd.getFullYear() === year && nd.getMonth() === month && nd.getDate() === date;
    });

    let inc = 0, exp = 0;
    const dayTrans = transactions.filter(t => {
        const td = new Date(t.date);
        const match = td.getFullYear() === year && td.getMonth() === month && td.getDate() === date;
        if (match) {
            if (t.type === 'income') inc += t.amount;
            else exp += t.amount;
        }
        return match;
    });

    // 2. Render Mini KPI Badges
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'day-mini-kpi-container';

    const dayTasks = tasks.filter(t => t.deadline === dateYMD && t.status !== 'done' && t.status !== 'archived');
    const totalPlans = dayEvents.length + dayTasks.length;

    summaryDiv.innerHTML = `
        <div class="mini-kpi-badge" onclick="openCalendarForDate()" title="Rejalar">
            <div class="mini-kpi-icon plans"><i data-lucide="calendar"></i></div>
            <div class="mini-kpi-info">
                <span class="count">${totalPlans}</span>
                <span class="label">Reja</span>
            </div>
        </div>
        <div class="mini-kpi-badge" onclick="openNotesForDate()" title="Qaydlar">
            <div class="mini-kpi-icon notes"><i data-lucide="edit-3"></i></div>
            <div class="mini-kpi-info">
                <span class="count">${dayNotes.length}</span>
                <span class="label">Qayd</span>
            </div>
        </div>
        <div class="mini-kpi-badge" onclick="openFinanceForDate()" title="Moliya">
            <div class="mini-kpi-icon finance"><i data-lucide="dollar-sign"></i></div>
            <div class="mini-kpi-info">
                <span class="count">${dayTrans.length}</span>
                <span class="label">Moliya</span>
            </div>
        </div>
    `;
    list.appendChild(summaryDiv);

    // 3. Render Timeline List
    const allItems = [
        ...dayEvents.map(e => ({ ...e, _type: 'event' })),
        ...dayTasks.map(t => ({ ...t, _type: 'task' }))
    ];

    if (allItems.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'timeline-empty-state';
        empty.textContent = 'Bu kunga rejalar yo\'q.';
        list.appendChild(empty);
    } else {
        const timeline = document.createElement('div');
        timeline.className = 'day-timeline';

        allItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'timeline-item';

            let title = item.title;
            let meta = item._type === 'event' ? item.time : 'Vazifa';
            let statusClass = item._type === 'task' ? 'task-tag' : 'event-tag';

            el.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-title">${title}</div>
                    <div class="timeline-meta ${statusClass}">${meta}</div>
                </div>
            `;
            timeline.appendChild(el);
        });
        list.appendChild(timeline);
    }
    if (window.lucide) window.lucide.createIcons();
}



// --- NOTES LOGIC ---
function renderNotesList() {
    const list = document.getElementById('notes-list');
    const container = document.querySelector('.notes-container');
    if (container) container.style.display = 'grid'; // Base desktop style, overridden by CSS for mobile
    if (!list) return;

    list.innerHTML = '';

    // Safety check for notes
    if (!Array.isArray(notes)) {
        console.warn('Notes is not an array, resetting...');
        notes = [];
    }

    if (notes.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i data-lucide="edit-3" style="width:24px; color:#A0AEC0; margin-bottom: 8px;"></i>
                <p>Hozircha qaydlar yo'q</p>
                <button class="primary-btn" onclick="createNewNote()" style="margin-top: 10px; font-size: 0.8rem; padding: 6px 12px;">
                    <i data-lucide="plus" style="width:14px; height:14px"></i> Yangi yaratish
                </button>
            </div>`;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    // Sort notes by date (newest first)
    const sortedNotes = [...notes].sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date.getTime() : (Number(a.date) || 0);
        const dateB = b.date instanceof Date ? b.date.getTime() : (Number(b.date) || 0);
        return dateB - dateA;
    });

    sortedNotes.forEach(note => {
        const item = document.createElement('div');
        item.className = `note-item ${currentNoteId === note.id ? 'active' : ''}`;

        // Use a more generic click handler for mobile compatibility
        item.setAttribute('onclick', `openNoteOnMobile(${note.id})`);
        item.style.cursor = 'pointer';

        let dateDisplay = 'Noma\'lum';
        try {
            const d = note.date instanceof Date ? note.date : new Date(note.date);
            if (!isNaN(d.getTime())) {
                dateDisplay = d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' });
            }
        } catch (e) { }

        item.innerHTML = `
            <div class="note-item-title">${note.title || 'Sarlavhasiz qayd'}</div>
            <div class="note-item-date">${dateDisplay}</div>
        `;
        list.appendChild(item);
    });
}

function createNewNote() {
    const newNote = {
        id: Date.now(),
        title: '',
        content: '',
        date: new Date()
    };
    notes.push(newNote);
    currentNoteId = newNote.id;

    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';

    saveToCloud();
    renderNotesList();
    renderDashboardSummary();

    // Mobile: Show editor
    const container = document.querySelector('.notes-container');
    if (container && window.innerWidth <= 1024) {
        container.classList.add('editor-visible');
    }
}

function loadNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    currentNoteId = id;
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').value = note.content;

    renderNotesList();
}

async function saveCurrentNote() {
    if (!currentNoteId) {
        // If no note selected, create a new one
        const title = document.getElementById('note-title').value.trim();
        const content = document.getElementById('note-content').value.trim();
        if (!title && !content) return;

        const newNote = {
            id: Date.now(),
            title: title,
            content: content,
            date: new Date()
        };
        notes.push(newNote);
        currentNoteId = newNote.id;
    } else {
        const note = notes.find(n => n.id === currentNoteId);
        if (note) {
            note.title = document.getElementById('note-title').value;
            note.content = document.getElementById('note-content').value;
            note.date = new Date(); // Update last modified
        }
    }

    saveToCloud();
    renderNotesList();
    renderDashboardSummary();
}

// --- Note Helper Tools ---
function insertHorizontalLine() {
    const textarea = document.getElementById('note-content');
    if (!textarea) return;
    textarea.value += "\n────────────────────────────────────────\n";
    saveCurrentNote();
}

function deleteCurrentNote() {
    if (!currentNoteId) return;

    showConfirmModal('Ushbu qaydni o\'chirmoqchimisiz?', () => {
        notes = notes.filter(n => n.id !== currentNoteId);
        currentNoteId = null;
        document.getElementById('note-title').value = '';
        document.getElementById('note-content').value = '';
        saveToCloud();
        renderNotesList();
        renderDashboardSummary();
        showNotesList(); // Close editor on mobile
    });
}

function downloadNotePDF() {
    const title = document.getElementById('note-title').value.trim() || 'Qayd';
    const content = document.getElementById('note-content').value;

    if (!content && !title) {
        alert('Hujjat bo\'sh!');
        return;
    }

    const element = document.createElement('div');
    element.style.padding = '40px';
    element.innerHTML = `
        <h1 style="font-family: Arial, sans-serif; color: #333; margin-bottom: 20px;">${title}</h1>
        <div style="font-family: Georgia, serif; line-height: 1.6; color: #444; white-space: pre-wrap;">${content}</div>
        <div style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 10px; font-size: 12px; color: #999;">
            Yaratilgan sana: ${new Date().toLocaleString('uz-UZ')}
        </div>
    `;

    const opt = {
        margin: 1,
        filename: `${title.replace(/\s+/g, '_')}_qayd.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
}

function downloadNoteWord() {
    const title = document.getElementById('note-title').value.trim() || 'Qayd';
    const content = document.getElementById('note-content').value;

    if (!content && !title) {
        alert('Hujjat bo\'sh!');
        return;
    }

    const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${title}</title></head>
        <body>
            <h1 style="font-family: Arial; font-size: 24pt;">${title}</h1>
            <p style="font-family: Calibri; font-size: 11pt; white-space: pre-wrap;">${content.replace(/\n/g, '<br>')}</p>
            <hr>
            <p style="font-size: 9pt; color: #888;">Yaratilgan sana: ${new Date().toLocaleString('uz-UZ')}</p>
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_qayd.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- Online Tracking Logic (Firebase Integration) ---
function updateOnlineStatus() {
    if (!currentUser || !window.firebaseDB) return;

    try {
        const userStatusRef = window.firebaseRef(window.firebaseDB, 'online_users/' + currentUser.login);

        // Mark user as online
        const statusData = {
            login: currentUser.login,
            name: currentUser.name,
            lastSeen: window.firebaseServerTimestamp()
        };

        window.firebaseSet(userStatusRef, statusData);

        // Also update lastSeen in the persistent user record
        const persistentUserRef = window.firebaseRef(window.firebaseDB, 'users/' + currentUser.login + '/lastSeen');
        window.firebaseSet(persistentUserRef, window.firebaseServerTimestamp());

        // When user disconnects (closes tab), remove them from the online list
        window.firebaseOnDisconnect(userStatusRef).remove();

    } catch (e) {
        console.error('Firebase online status xatosi:', e);
    }
}

function startHeartbeat() {
    // In Firebase, we don't need a 10s interval for heartbeat anymore
    // because onDisconnect handles it. But we call once at start.
    updateOnlineStatus();

    // Subscribe to online users globally
    if (window.firebaseDB) {
        const onlineRef = window.firebaseRef(window.firebaseDB, 'online_users');
        window.firebaseOnValue(onlineRef, (snapshot) => {
            const onlineData = snapshot.val() || {};
            // Save to a global variable for renderAdminPanel to use
            window.globalOnlineUsers = onlineData;

            // If the admin panel is open, refresh it
            const adminView = document.getElementById('view-admin');
            if (adminView && adminView.style.display === 'block') {
                renderAdminPanel();
            }
        });
    }
}

// --- Admin Panel Logic ---
// --- Admin Panel Logic (Firebase Integrated) ---
async function renderAdminPanel() {
    const list = document.getElementById('admin-users-list');
    const totalUsersEle = document.getElementById('admin-total-users');
    const onlineUsersEle = document.getElementById('admin-online-users');
    if (!list || !window.firebaseDB) return;

    try {
        const usersRef = window.firebaseRef(window.firebaseDB, 'users');
        window.firebaseGet(usersRef).then((snapshot) => {
            const registeredUsersMap = snapshot.val() || {};
            const registeredUsers = Object.values(registeredUsersMap);
            const onlineData = window.globalOnlineUsers || {};

            const allUsers = [
                { name: 'Administrator', login: 'admin', phone: '-', email: 'admin@pitch.io', isAdmin: true, isSuper: true, location: 'Toshkent, Uzbekistan' },
                ...registeredUsers
            ];

            totalUsersEle.textContent = registeredUsers.length;
            let onlineCount = Object.keys(onlineData).length;
            list.innerHTML = '';

            allUsers.forEach(user => {
                const card = document.createElement('div');
                card.className = 'admin-user-card';
                const initials = (user.name || '??').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                const isOnline = !!onlineData[user.login];

                const avatarContent = user.avatar
                    ? `<img src="${user.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`
                    : initials;
                const avatarStyle = user.avatar ? 'background: none;' : '';

                card.innerHTML = `
                    <div class="user-card-header">
                        <div class="user-info-cell">
                            <div class="user-avatar-sm" style="${avatarStyle}">${avatarContent}</div>
                            <div class="user-name-clickable" onclick="showUserDetails('${user.login}')">
                                ${user.name || 'Noma\'lum'}
                            </div>
                        </div>
                        <div class="admin-actions">
                            ${!user.isSuper ? `
                                <button class="admin-action-btn ${user.isAdmin ? 'demote' : 'promote'}" 
                                        onclick="window.toggleUserAdmin('${user.login}')" 
                                        title="${user.isAdmin ? 'Adminlikni olish' : 'Admin qilish'}">
                                    <i data-lucide="${user.isAdmin ? 'user-minus' : 'user-plus'}"></i>
                                </button>
                                <button class="admin-action-btn delete" 
                                        onclick="window.deleteUserByAdmin('${user.login}')" 
                                        title="O'chirish">
                                    <i data-lucide="user-x"></i>
                                </button>
                            ` : '<span style="color: var(--text-muted); font-size: 0.7rem;">Cheklov</span>'}
                        </div>
                    </div>
                    <div class="user-card-body">
                        <div class="card-status-info">
                            <span class="badge ${user.isAdmin ? 'badge-admin' : 'badge-user'}">
                                ${user.isAdmin ? 'Admin' : 'Foydalanuvchi'}
                            </span>
                            <div class="status-badge-inline ${isOnline ? 'online' : ''}">
                                <div class="dot"></div>
                                <span>${isOnline ? 'Onlayn' : 'Offlayn'}</span>
                            </div>
                        </div>
                        <div class="card-login-info" style="font-size: 0.8rem; color: #a0aec0; margin-top: 8px;">
                            ID: ${user.login}
                        </div>
                    </div>
                `;
                list.appendChild(card);
            });

            if (onlineUsersEle) onlineUsersEle.textContent = onlineCount;
            if (window.lucide) window.lucide.createIcons();
        }).catch((err) => {
            console.error('Admin panelni yuklashda xatolik:', err);
        });
    } catch (err) {
        console.error('Admin panelni yuklashda xatolik (tashqi):', err);
    }
}

async function showUserDetails(login) {
    if (!window.firebaseDB) return;
    try {
        const userRef = window.firebaseRef(window.firebaseDB, 'users/' + login);
        const snapshot = await window.firebaseGet(userRef);
        const user = snapshot.val();

        // Handle Admin (not in DB)
        const displayUser = login === 'admin' ? {
            name: 'Administrator', login: 'admin', phone: '-', email: 'admin@pitch.io',
            isAdmin: true, isSuper: true, location: 'Toshkent, Uzbekistan', password: '*****'
        } : user;

        if (!displayUser) return;

        // Populate Modal
        document.getElementById('det-full-name').textContent = displayUser.name || 'Noma\'lum';
        document.getElementById('det-login').textContent = displayUser.login;
        document.getElementById('det-pass').textContent = displayUser.password || 'Mavjud emas';
        document.getElementById('det-email').textContent = displayUser.email || '-';
        document.getElementById('det-phone').textContent = displayUser.phone || '-';
        document.getElementById('det-location').textContent = displayUser.location || '-';

        // Avatar
        const initials = (displayUser.name || displayUser.login).split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        const detAvatar = document.getElementById('det-avatar');
        if (displayUser.avatar) {
            detAvatar.innerHTML = `<img src="${displayUser.avatar}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            detAvatar.style.background = 'none';
        } else {
            detAvatar.textContent = initials;
            detAvatar.style.background = '';
        }

        // Status Badge
        const badge = document.getElementById('det-status-badge');
        badge.textContent = displayUser.isAdmin ? 'Admin' : 'Foydalanuvchi';
        badge.className = 'badge ' + (displayUser.isAdmin ? 'badge-admin' : 'badge-user');

        // Last Seen
        let lastSeenText = 'Noma\'lum';
        if (displayUser.lastSeen) {
            lastSeenText = new Date(displayUser.lastSeen).toLocaleString('uz-UZ');
        }
        document.getElementById('det-last-seen').textContent = lastSeenText;

        // Reset Password visibility
        const passStars = document.querySelector('.pass-stars');
        const passText = document.getElementById('det-pass');
        passStars.style.display = 'inline';
        passText.style.display = 'none';

        document.getElementById('user-details-modal').style.display = 'flex';
        if (window.lucide) lucide.createIcons();
    } catch (e) {
        console.error('User details load error:', e);
    }
}

function closeUserDetailsModal() {
    document.getElementById('user-details-modal').style.display = 'none';
}

function togglePasswordVisibility(container) {
    const stars = container.querySelector('.pass-stars');
    const text = container.querySelector('.pass-text');
    if (stars.style.display === 'none') {
        stars.style.display = 'inline';
        text.style.display = 'none';
    } else {
        stars.style.display = 'none';
        text.style.display = 'inline';
    }
}

window.toggleUserAdmin = async function (login) {
    if (!login || login === 'admin' || !window.firebaseDB) return;
    try {
        const userRef = window.firebaseRef(window.firebaseDB, `users/${login}`);
        const snapshot = await window.firebaseOnValue(userRef, (s) => {
            const user = s.val();
            if (user) {
                window.firebaseSet(userRef, { ...user, isAdmin: !user.isAdmin });
                renderAdminPanel();
            }
        }, { onlyOnce: true });
    } catch (e) {
        console.error('Admin status o\'zgarishida xatolik:', e);
    }
}

window.deleteUserByAdmin = function (login) {
    if (!login || login === 'admin' || !window.firebaseDB) return;

    const confirmMsg = `"${login}" profilini va unga tegishli barcha ma'lumotlarni BUTUNLAY o'chirib tashlamoqchimisiz? Ma'lumotlar serverdan ham o'chiriladi.`;

    showConfirmModal(confirmMsg, async () => {
        try {
            await window.firebaseRemove(window.firebaseRef(window.firebaseDB, `users/${login}`));
            await window.firebaseRemove(window.firebaseRef(window.firebaseDB, `online_users/${login}`));

            console.log('Foydalanuvchi serverdan o\'chirildi:', login);
            renderAdminPanel();
        } catch (e) {
            console.error('O\'chirishda xatolik:', e);
        }
    }, 'Ha, O\'chirilsin');
}

/* --- Notifications & Messages --- */
let userMessages = []; // Dynamic messages from Firebase

// Listen for messages for current user
function initializeMessagesListener() {
    if (!currentUser || !window.firebaseDB) return;

    const messagesRef = window.firebaseRef(window.firebaseDB, 'users/' + currentUser.login + '/messages');

    window.firebaseOnValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            // Convert object to array
            userMessages = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));

            // Sort by time (newest first)
            userMessages.sort((a, b) => b.timestamp - a.timestamp);
        } else {
            userMessages = [];
        }
        renderMessages();
    });
}

function openMessageModal() {
    const modal = document.getElementById('message-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('msg-title').value = '';
        document.getElementById('msg-body').value = '';
    }
}

function closeMessageModal() {
    const modal = document.getElementById('message-modal');
    if (modal) modal.style.display = 'none';
}

let currentBroadcastPage = 1;
const broadcastPageSize = 5;
let allBroadcasts = [];

function initializeBroadcastsListener() {
    if (!currentUser || currentUser.login !== 'admin' || !window.firebaseDB) return;
    const broadcastsRef = window.firebaseRef(window.firebaseDB, 'broadcasts');
    window.firebaseOnValue(broadcastsRef, (snapshot) => {
        const data = snapshot.val() || {};
        allBroadcasts = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        allBroadcasts.sort((a, b) => b.timestamp - a.timestamp);
        renderAdminBroadcasts();
    });
}

function renderAdminBroadcasts() {
    const container = document.getElementById('broadcast-history-list');
    const pagination = document.getElementById('history-pagination');
    if (!container || !pagination) return;

    const start = (currentBroadcastPage - 1) * broadcastPageSize;
    const end = start + broadcastPageSize;
    const pageItems = allBroadcasts.slice(start, end);

    container.innerHTML = pageItems.length === 0 ? '<p style="color:#888; font-size:0.8rem; text-align:center; padding:10px;">Hali xabarlar yuborilmagan.</p>' : '';

    pageItems.forEach(b => {
        const item = document.createElement('div');
        item.className = 'broadcast-admin-item';
        item.style.padding = '12px';
        item.innerHTML = `
            <div class="bc-info">
                <strong style="font-size: 0.95rem;">${b.title}</strong>
                <span style="font-size: 0.75rem; color: #a0aec0; margin-top: 4px;">${b.time} | Turi: ${b.type}</span>
            </div>
            <button class="bc-delete-btn" onclick="deleteOneBroadcast('${b.id}', '${b.title}')" title="O'chirish">
                <i data-lucide="trash-2" style="width:16px"></i>
            </button>
        `;
        container.appendChild(item);
    });

    // Render Pagination
    const totalPages = Math.ceil(allBroadcasts.length / broadcastPageSize);
    pagination.innerHTML = '';

    if (totalPages > 1) {
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.style.cssText = `
                padding: 5px 10px;
                border: 1px solid ${i === currentBroadcastPage ? 'var(--primary)' : '#ddd'};
                background: ${i === currentBroadcastPage ? 'var(--primary)' : 'white'};
                color: ${i === currentBroadcastPage ? 'white' : '#555'};
                border-radius: 4px;
                cursor: pointer;
            `;
            btn.onclick = () => {
                currentBroadcastPage = i;
                renderAdminBroadcasts();
            };
            pagination.appendChild(btn);
        }
    }

    if (window.lucide) lucide.createIcons();
}

function openBroadcastHistoryModal() {
    currentBroadcastPage = 1;
    renderAdminBroadcasts();
    document.getElementById('broadcast-history-modal').style.display = 'flex';
}

function closeBroadcastHistoryModal() {
    document.getElementById('broadcast-history-modal').style.display = 'none';
}

async function deleteOneBroadcast(id, title) {
    showConfirmModal(`"${title}" xabarini barcha foydalanuvchi xabarnomalaridan o'chirmoqchimisiz?`, async () => {
        try {
            const bRef = window.firebaseRef(window.firebaseDB, 'broadcasts/' + id);
            const bSnap = await window.firebaseGet(bRef);
            if (!bSnap.exists()) return;

            const updates = {};
            updates['broadcasts/' + id] = null;

            const usersRef = window.firebaseRef(window.firebaseDB, 'users');
            const usersSnap = await window.firebaseGet(usersRef);

            if (usersSnap.exists()) {
                const allUsers = usersSnap.val();
                Object.keys(allUsers).forEach(login => {
                    const userMsgs = allUsers[login].messages || {};
                    Object.keys(userMsgs).forEach(msgKey => {
                        const msg = userMsgs[msgKey];
                        if (msg.broadcastId === id) {
                            updates[`users/${login}/messages/${msgKey}`] = null;
                        }
                    });
                });
            }

            await window.firebaseUpdate(window.firebaseRef(window.firebaseDB), updates);
            alert('Xabar o\'chirildi! ?');
        } catch (e) {
            console.error('Xabarni o\'chirishda xatolik:', e);
        }
    }, 'Ha, O\'chirilsin');
}

async function deleteAllBroadcastMessages() {
    showConfirmModal('BUTUN TIZIMDAGI barcha foydalanuvchi xabarlarini va bildirishnomalarini butunlay o\'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo\'lmaydi.', async () => {
        try {
            const updates = {};
            updates['broadcasts'] = null;

            const usersRef = window.firebaseRef(window.firebaseDB, 'users');
            const usersSnap = await window.firebaseGet(usersRef);

            if (usersSnap.exists()) {
                const allUsers = usersSnap.val();
                Object.keys(allUsers).forEach(login => {
                    updates[`users/${login}/messages`] = null;
                });
            }

            await window.firebaseUpdate(window.firebaseRef(window.firebaseDB), updates);
            alert('Butun tizim xabarlardan tozalandi! ??');
        } catch (e) {
            console.error('Tozalashda xatolik:', e);
            alert('Xatolik yuz berdi.');
        }
    });
}

async function sendGlobalMessage() {
    const title = document.getElementById('msg-title').value;
    const body = document.getElementById('msg-body').value;
    const type = document.getElementById('msg-type').value;

    if (!title || !body) {
        alert("Iltimos, mavzu va matnni yozing!");
        return;
    }

    if (!window.firebaseDB) {
        alert("Bazaga ulanishda xatolik!");
        return;
    }

    try {
        // 1. Get all users
        const usersRef = window.firebaseRef(window.firebaseDB, 'users');
        const snapshot = await window.firebaseGet(usersRef);

        if (snapshot.exists()) {
            const allUsers = snapshot.val();
            let count = 0;

            const iconMap = {
                'info': 'info',
                'warning': 'alert-triangle',
                'success': 'party-popper'
            };

            const newMessage = {
                title: title,
                desc: body,
                type: type, // info, warning, success
                icon: iconMap[type] || 'mail',
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
                read: false
            };

            // 2. Loop and push message to everyone
            const updates = {};
            const broadcastId = Date.now().toString();
            const newMessageWithId = { ...newMessage, broadcastId: broadcastId };

            // Add to global broadcasts for Admin control
            updates['broadcasts/' + broadcastId] = newMessageWithId;

            Object.keys(allUsers).forEach(login => {
                const rootRef = window.firebaseRef(window.firebaseDB);
                const msgsRef = window.firebaseChild(rootRef, 'users/' + login + '/messages');
                const newMsgKey = window.push(msgsRef).key;

                updates['users/' + login + '/messages/' + newMsgKey] = newMessageWithId;
                count++;
            });

            await window.firebaseUpdate(window.firebaseRef(window.firebaseDB), updates);

            alert(`Xabar ${count} ta foydalanuvchiga muvaffaqiyatli yuborildi! ✅`);
            document.getElementById('msg-title').value = '';
            document.getElementById('msg-body').value = '';
        }
    } catch (e) {
        console.error("Xabar yuborishda xatolik:", e);
        alert("Xatolik: " + e.message);
    }
}

function toggleMessages() {
    const dropdown = document.getElementById('messages-dropdown');
    const notifDropdown = document.getElementById('notifications-dropdown');

    if (notifDropdown) notifDropdown.style.display = 'none';
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (profileDropdown) profileDropdown.style.display = 'none';

    if (dropdown.style.display === 'flex') {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'flex';
        renderMessages();
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('notifications-dropdown');
    const msgDropdown = document.getElementById('messages-dropdown');

    if (msgDropdown) msgDropdown.style.display = 'none';
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (profileDropdown) profileDropdown.style.display = 'none';

    if (dropdown.style.display === 'flex') {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'flex';
        generateNotifications();
        renderNotifications();
    }
}

function renderMessages() {
    const list = document.getElementById('messages-list');
    if (!list) return;

    const unreadMessages = userMessages.filter(m => !m.read);

    if (unreadMessages.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i data-lucide="inbox" style="width:24px; color:#A0AEC0; margin-bottom: 8px;"></i>
                <p>Yangi xabarlar yo'q</p>
            </div>`;
    } else {
        list.innerHTML = unreadMessages.map(m => `
            <div class="dropdown-item unread" onclick="markMessageRead('${m.id}')">
                <div class="item-icon item-icon-dynamic" style="background: ${getBgColor(m.type)}; color: ${getTextColor(m.type)}">
                    <i data-lucide="${m.icon || 'mail'}"></i>
                </div>
                <div class="item-content">
                    <div class="item-title">${m.title}</div>
                    <div class="item-desc">${m.desc}</div>
                    <span class="item-time">${m.time}</span>
                </div>
            </div>
        `).join('');
    }

    updateMsgBadge();
    if (window.lucide) window.lucide.createIcons();
}

function getBgColor(type) {
    if (type === 'success') return '#E8F5E9';
    if (type === 'warning') return '#FFF4E6';
    return '#E3F2FD';
}

function getTextColor(type) {
    if (type === 'success') return '#4CAF50';
    if (type === 'warning') return '#F4B846';
    return '#2196F3';
}

function markMessageRead(id) {
    const msg = userMessages.find(m => m.id === id);
    if (msg && !msg.read) {
        const msgRef = window.firebaseRef(window.firebaseDB, 'users/' + currentUser.login + '/messages/' + id);
        window.firebaseUpdate(msgRef, { read: true });
    }
}

function markAllMessagesRead() {
    if (userMessages.length === 0) return;
    const updates = {};
    userMessages.forEach(m => {
        if (!m.read) {
            updates['users/' + currentUser.login + '/messages/' + m.id + '/read'] = true;
        }
    });

    // Locally hide them for this session
    userMessages = userMessages.map(m => ({ ...m, read: true }));
    renderMessages();

    if (Object.keys(updates).length > 0) {
        const rootRef = window.firebaseRef(window.firebaseDB);
        window.firebaseUpdate(rootRef, updates);
    }
}

let notificationsDismissed = false;

function updateMsgBadge() {
    const badge = document.getElementById('msg-badge');
    const unreadCount = userMessages.filter(m => !m.read).length;
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function generateNotifications() {
    if (notificationsDismissed) {
        systemNotifications = [];
        return;
    }
    systemNotifications = [];

    // Check Tasks
    const todoTasks = typeof tasks !== 'undefined' ? tasks.filter(t => t.status === 'todo').length : 0;
    if (todoTasks > 0) {
        systemNotifications.push({
            title: "Vazifalar kutmoqda",
            desc: `Sizda ${todoTasks} ta bajarilmagan vazifa bor.`,
            type: "warning",
            icon: "alert-circle",
            time: "Doimiy"
        });
    }

    systemNotifications.push({
        title: "Tizim holati",
        desc: "Siz muvaffaqiyatli onlayn bo'ldingiz.",
        type: "success",
        icon: "wifi",
        time: "Hozir"
    });
}

function renderNotifications() {
    const list = document.getElementById('notifications-list');
    if (!list) return;

    if (systemNotifications.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i data-lucide="bell-off" style="width:24px; color:#A0AEC0; margin-bottom: 8px;"></i>
                <p>Yangi bildirishnomalar yo'q</p>
            </div>`;
    } else {
        list.innerHTML = systemNotifications.map(n => `
            <div class="dropdown-item unread">
                <div class="item-icon item-icon-dynamic" style="background: ${n.type === 'success' ? '#E8F5E9' : '#FFF4E6'}; color: ${n.type === 'success' ? '#4CAF50' : '#F4B846'}">
                    <i data-lucide="${n.icon}"></i>
                </div>
                <div class="item-content">
                    <div class="item-title">${n.title}</div>
                    <div class="item-desc">${n.desc}</div>
                    <span class="item-time">${n.time}</span>
                </div>
            </div>
        `).join('');
    }

    const badge = document.getElementById('notif-badge');
    if (badge) {
        if (systemNotifications.length > 0) {
            badge.textContent = systemNotifications.length;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    if (window.lucide) window.lucide.createIcons();
}

function clearNotifications() {
    notificationsDismissed = true;
    systemNotifications = [];
    renderNotifications();

    // Force badge hide
    const badge = document.getElementById('notif-badge');
    if (badge) badge.style.display = 'none';
}

window.onclick = function (event) {
    if (!event.target.closest('.user-profile') &&
        !event.target.closest('.action-wrapper')) {

        const dropdowns = document.querySelectorAll('.profile-dropdown, .action-dropdown');
        dropdowns.forEach(d => {
            if (d) d.style.display = 'none';
        });
    }
}

// --- Mobile Sidebar Toggle ---
// --- Mobile Notes Helpers ---
function showNotesList() {
    const container = document.querySelector('.notes-container');
    if (container) {
        container.classList.remove('editor-visible');
    }
}

function openNoteOnMobile(id) {
    if (typeof loadNote === 'function') {
        loadNote(id);
    }
    const container = document.querySelector('.notes-container');
    if (container && window.innerWidth <= 1024) {
        container.classList.add('editor-visible');
    }
}

// Direct style manipulation for guaranteed toggle
function toggleSidebar() {
    console.log('Toggle Sidebar Triggered');
    const sidebar = document.querySelector('.sidebar');
    let overlay = document.querySelector('.sidebar-overlay');

    if (!sidebar) {
        console.error('Sidebar element missing!');
        return;
    }

    if (!overlay) {
        console.warn('Creating missing overlay');
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.onclick = toggleSidebar;
        document.body.appendChild(overlay);
    }

    // Check if open by class OR style
    const isOpen = sidebar.classList.contains('mobile-open') || sidebar.style.transform === 'translateX(0px)';

    if (isOpen) {
        // Close
        sidebar.classList.remove('mobile-open');
        sidebar.style.transform = ''; // Clear inline style to revert to CSS
        overlay.classList.remove('active');
        overlay.style.display = '';
        document.body.style.overflow = '';
    } else {
        // Open
        sidebar.classList.add('mobile-open');
        sidebar.style.transform = 'translateX(0)'; // Force inline style
        overlay.classList.add('active');
        overlay.style.display = 'block'; // Force visible
        document.body.style.overflow = 'hidden';
    }
}

// Explicitly re-bind menu button on load to ensure it works
// Ensure toggleSidebar is global
window.toggleSidebar = toggleSidebar;

// Explicitly re-bind menu button on load to ensure it works
document.addEventListener('DOMContentLoaded', () => {
    // Check for overlay
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.onclick = toggleSidebar;
        document.body.prepend(overlay);
    }

    console.log('Mobile menu logic initialized (Inline handler active)');

    // Header Scroll Effect - Optimized for Apple-level smoothness
    const mainContent = document.querySelector('.main-content');
    const topBar = document.querySelector('.top-bar');

    if (mainContent && topBar) {
        let lastScrolled = false;

        mainContent.addEventListener('scroll', () => {
            const isScrolled = mainContent.scrollTop > 10;

            if (isScrolled !== lastScrolled) {
                lastScrolled = isScrolled;
                requestAnimationFrame(() => {
                    topBar.classList.toggle('scrolled', isScrolled);
                });
            }
        }, { passive: true });
    }
});

// --- Settings Logic ---
function loadSettings() {
    if (!currentUser) return;

    // Load profile sidebar info
    const fullName = currentUser.name || currentUser.login;
    document.getElementById('settings-user-fullname').textContent = fullName;
    document.getElementById('settings-user-role').textContent = currentUser.isAdmin ? 'Administrator' : 'Foydalanuvchi';

    if (currentUser.avatar) {
        document.getElementById('settings-avatar-img').src = currentUser.avatar;
    } else {
        document.getElementById('settings-avatar-img').src = 'assets/default-avatar.png';
    }

    // Load form data
    document.getElementById('s-fullname').value = currentUser.name || '';
    document.getElementById('s-login').value = currentUser.login || '';
    document.getElementById('s-email').value = currentUser.email || '';
    document.getElementById('s-phone').value = currentUser.phone || '';
    document.getElementById('s-location').value = currentUser.location || '';

    // Clear security tab
    document.getElementById('s-current-password').value = '';
    document.getElementById('s-new-password').value = '';
    document.getElementById('s-confirm-password').value = '';
}

function showSettingsTab(tabName) {
    // Update nav active state
    document.querySelectorAll('.settings-nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById('set-nav-' + tabName).classList.add('active');

    // Show selected tab content
    document.querySelectorAll('.settings-tab-content').forEach(tab => tab.style.display = 'none');
    document.getElementById('settings-tab-' + tabName).style.display = 'block';
}

function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 500000) { // 500KB limit for base64 roughly
        alert('Rasm hajmi juda katta (max 500KB). Iltimos, kichikroq rasm tanlang.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const base64Image = e.target.result;
        document.getElementById('settings-avatar-img').src = base64Image;

        // Save avatar immediately to state
        currentUser.avatar = base64Image;
        saveUserSettings(true); // silent save for avatar
    };
    reader.readAsDataURL(file);
}

async function saveUserSettings(silent = false) {
    const name = document.getElementById('s-fullname').value.trim();
    const email = document.getElementById('s-email').value.trim();
    const phone = document.getElementById('s-phone').value.trim();
    const location = document.getElementById('s-location').value.trim();

    if (!name || !email || !phone) {
        if (!silent) alert('Iltimos, asosiy maydonlarni to\'ldiring!');
        return;
    }

    // Update local state
    currentUser.name = name;
    currentUser.email = email;
    currentUser.phone = phone;
    currentUser.location = location;

    try {
        // Save to Firebase
        const userRef = window.firebaseRef(window.firebaseDB, 'users/' + currentUser.login);
        await window.firebaseUpdate(userRef, {
            name: currentUser.name,
            email: currentUser.email,
            phone: currentUser.phone,
            location: currentUser.location,
            avatar: currentUser.avatar || null
        });

        // Update localStorage
        localStorage.setItem('dashboard_current_user', JSON.stringify(currentUser));

        // Update Header UI
        document.querySelector('.username').textContent = currentUser.name || currentUser.login;
        if (currentUser.avatar) {
            const avatarEl = document.querySelector('.avatar');
            avatarEl.innerHTML = '<img src=\"' + currentUser.avatar + '\" style=\"width:100%; height:100%; border-radius:50%; object-fit:cover;\">';
            avatarEl.style.background = 'none';
        }

        if (!silent) alert('Ma\'lumotlar muvaffaqiyatli saqlandi! ?');
        loadSettings(); // Refresh sidebar info
    } catch (e) {
        console.error('Sozlamalarni saqlashda xatolik:', e);
        if (!silent) alert('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.');
    }
}

async function updatePassword() {
    const currentPass = document.getElementById('s-current-password').value;
    const newPass = document.getElementById('s-new-password').value;
    const confirmPass = document.getElementById('s-confirm-password').value;

    if (!currentPass || !newPass || !confirmPass) {
        alert('Iltimos, barcha parollarni kiriting!');
        return;
    }

    if (currentPass !== currentUser.password) {
        alert('Amaldagi parol noto\'g\'ri!');
        return;
    }

    if (newPass.length < 4) {
        alert('Yangi parol kamida 4 ta belgidan iborat bo\'lishi kerak!');
        return;
    }

    if (newPass !== confirmPass) {
        alert('Yangi parollar bir-biriga mos kelmadi!');
        return;
    }

    try {
        const userRef = window.firebaseRef(window.firebaseDB, 'users/' + currentUser.login);
        await window.firebaseUpdate(userRef, { password: newPass });

        currentUser.password = newPass;
        localStorage.setItem('dashboard_current_user', JSON.stringify(currentUser));

        alert('Parol muvaffaqiyatli o\'zgartirildi! ?');

        // Clear inputs
        document.getElementById('s-current-password').value = '';
        document.getElementById('s-new-password').value = '';
        document.getElementById('s-confirm-password').value = '';

        showSettingsTab('personal');
    } catch (e) {
        console.error('Parol yangilashda xatolik:', e);
        alert('Xatolik yuz berdi.');
    }
}

function resetSettingsForm() {
    loadSettings();
    showSettingsTab('personal');
}

/* --- Missing UI Functions (Restored) --- */

function closeAllDropdowns() {
    document.querySelectorAll('.action-dropdown, .profile-dropdown').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });
}

// Toggle Messages
function toggleMessages(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('messages-dropdown');
    if (!dropdown) return;

    const isActive = dropdown.classList.contains('active');
    closeAllDropdowns();

    // Toggle
    if (!isActive) {
        dropdown.classList.add('active');
        dropdown.style.display = 'flex';
    }
}

// Toggle Notifications
function toggleNotifications(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('notifications-dropdown');
    if (!dropdown) return;

    const isActive = dropdown.classList.contains('active');
    closeAllDropdowns();

    if (!isActive) {
        dropdown.classList.add('active');
        dropdown.style.display = 'flex';
    }
}

// Toggle Profile
function toggleProfileMenu(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('profile-menu');
    if (!dropdown) return;

    const isActive = dropdown.classList.contains('active');
    closeAllDropdowns();

    if (!isActive) {
        dropdown.classList.add('active');
        dropdown.style.display = 'flex';
    }
}

// Click Outside to Close
document.addEventListener('click', (e) => {
    if (!e.target.closest('.action-wrapper') && !e.target.closest('.user-profile')) {
        closeAllDropdowns();
    }
});

// Mock Data Generators for UI
function generateNotifications() {
    if (!window.notifications) window.notifications = [
        { id: 1, title: 'Yangi vazifa', desc: 'Sizga yangi "Dizayn" vazifasi yuklatildi.', time: '5 daqiqa oldin', read: false },
        { id: 2, title: 'Tizim xabari', desc: 'Tizimda texnik ishlar yakunlandi.', time: '1 soat oldin', read: false },
        { id: 3, title: 'Xavfsizlik', desc: 'Yangi qurilmadan kirildi.', time: 'Kecha', read: true }
    ];
}

function renderNotifications() {
    const list = document.getElementById('notifications-list');
    const badge = document.getElementById('notif-badge');
    if (!list) return;

    list.innerHTML = '';
    const notifs = window.notifications || [];

    if (notifs.length === 0) {
        list.innerHTML = `
            <div class="empty-dropdown">
                <i data-lucide="bell-off"></i>
                <span>Bildirishnomalar yo'q</span>
            </div>`;
    } else {
        notifs.forEach(n => {
            const item = document.createElement('div');
            item.className = `dropdown-item ${n.read ? '' : 'unread'}`;
            item.innerHTML = `
                <div class="dropdown-item-icon"><i data-lucide="bell"></i></div>
                <div class="dropdown-item-content">
                    <div class="dropdown-item-title">${n.title}</div>
                    <div class="dropdown-item-desc">${n.desc}</div>
                    <span class="dropdown-item-time">${n.time}</span>
                </div>
            `;
            list.appendChild(item);
        });
    }

    // Update badge
    const unreadCount = notifs.filter(n => !n.read).length;
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        badge.style.background = '#EF5C91';
        badge.style.color = 'white';
        badge.style.position = 'absolute';
        badge.style.top = '-2px';
        badge.style.right = '-2px';
        badge.style.minWidth = '18px';
        badge.style.height = '18px';
        badge.style.borderRadius = '9px';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        badge.style.fontSize = '10px';
        badge.style.padding = '0 4px';
    }

    if (window.lucide) window.lucide.createIcons();
}

function renderMessages() {
    const list = document.getElementById('messages-list');
    const badge = document.getElementById('msg-badge');
    if (!list) return;

    list.innerHTML = '';
    // Mock messages
    const msgs = [
        { id: 1, title: 'Admin', desc: 'Xush kelibsiz! Tizimdan foydalanishni boshlang.', time: 'Hozirgina', read: false }
    ];

    msgs.forEach(m => {
        const item = document.createElement('div');
        item.className = `dropdown-item ${m.read ? '' : 'unread'}`;
        item.innerHTML = `
            <div class="dropdown-item-icon" style="background: #EBF5FF; color: #3B82F6;"><i data-lucide="mail"></i></div>
            <div class="dropdown-item-content">
                <div class="dropdown-item-title">${m.title}</div>
                <div class="dropdown-item-desc">${m.desc}</div>
                <span class="dropdown-item-time">${m.time}</span>
            </div>
        `;
        list.appendChild(item);
    });

    if (badge) {
        badge.textContent = msgs.filter(m => !m.read).length;
        badge.style.display = 'flex';
        badge.style.position = 'absolute';
        badge.style.top = '-2px';
        badge.style.right = '-2px';
        badge.style.minWidth = '18px';
        badge.style.height = '18px';
        badge.style.borderRadius = '9px';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        badge.style.fontSize = '10px';
        badge.style.padding = '0 4px';
        badge.style.background = '#3B82F6';
        badge.style.color = 'white';
    }

    if (window.lucide) window.lucide.createIcons();
}

function markAllMessagesRead() {
    alert('Barcha xabarlar o\'qildi.');
    const badge = document.getElementById('msg-badge');
    if (badge) badge.style.display = 'none';
}

function clearNotifications() {
    window.notifications = [];
    renderNotifications();
}

function logout() {
    showLogoutConfirmModal('Tizimdan chiqmoqchimisiz?', () => {
        localStorage.removeItem('dashboard_current_user');
        window.location.href = 'index.html';
    });
}

