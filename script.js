<<<<<<< HEAD
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
    } catch (e) {
        console.error("System Error: Session Initialization failed:", e);
    }

    try {
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
        console.error('System Error: Component rendering failed:', e);
    }
}


// --- Global State ---
let currentUser = null;
let tasks = [];
let events = [];
let transactions = [];
let notes = [];
let currentNoteId = null;

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
            await new Promise((resolve) => {
                window.firebaseOnValue(userRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        tasks = data.tasks || [];
                        events = data.events || [];
                        transactions = (data.transactions || []).map(t => ({ ...t, date: new Date(t.date) }));
                        notes = (data.notes || []).map(n => ({ ...n, date: new Date(n.date) }));
                    }
                    resolve();
                }, { onlyOnce: true });
            });
        } catch (e) {
            console.error('Cloud Load xatosi:', e);
        }
    }

    // Initialize Messages Listener (Calls for everyone)
    initializeMessagesListener();

    updateUserUI();
}

function updateUserUI() {
    if (!currentUser) return;
    const usernameEle = document.querySelector('.user-profile .username');
    const avatarEle = document.querySelector('.user-profile .avatar');

    if (usernameEle) usernameEle.textContent = currentUser.name || currentUser.login;
    if (avatarEle) {
        const nameParts = (currentUser.name || currentUser.login || "U").split(' ');
        const initials = nameParts.length > 1
            ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
            : nameParts[0].substring(0, 2).toUpperCase();
        avatarEle.textContent = initials;
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
        const ss = String(today.getSeconds()).padStart(2, '0');
        clockElement.textContent = `${hh}:${mm}:${ss}`;
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

    document.getElementById(`view-${tabId}`).style.display = 'block';

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    element.classList.add('active');

    const headings = {
        'dashboard': 'Bosh sahifa',
        'tasks': 'Vazifalar',
        'calendar': 'Kalendar',
        'finance': 'Moliya',
        'notes': 'Qaydlar',
        'admin': 'Admin Panel'
    };
    if (tabId === 'dashboard') renderDashboard();
    if (tabId === 'calendar') initCalendar();
    if (tabId === 'finance') initFinance();
    if (tabId === 'notes') renderNotesList();
    if (tabId === 'admin') renderAdminPanel();
    document.getElementById('page-heading').textContent = headings[tabId];
}

// --- Kanban Logic ---
function renderKanbanTasks() {
    // Clear lists
    document.getElementById('list-todo').innerHTML = '';
    document.getElementById('list-in-progress').innerHTML = '';
    document.getElementById('list-done').innerHTML = '';

    // Reset counts
    let counts = { 'todo': 0, 'in-progress': 0, 'done': 0 };

    tasks.forEach(task => {
        counts[task.status]++;
        const card = createKanbanCard(task);
        document.getElementById(`list-${task.status}`).appendChild(card);
    });

    // Update counts
    document.getElementById('count-todo').textContent = counts['todo'];
    document.getElementById('count-in-progress').textContent = counts['in-progress'];
    document.getElementById('count-done').textContent = counts['done'];

    lucide.createIcons();
    renderDashboard();
}

function createKanbanCard(task) {
    const div = document.createElement('div');
    div.className = `kanban-card status-${task.status}`;
    div.setAttribute('draggable', true);
    // Add drag attribute for functionality
    div.setAttribute('ondragstart', `drag(event, ${task.id})`);

    div.innerHTML = `
        <div class="card-title">${task.title}</div>
        <div class="card-desc">${task.desc || ''}</div>
        <div class="card-footer">
            <button class="card-delete-btn" onclick="deleteTask(${task.id})" title="O'chirish">
                <i data-lucide="trash-2" style="width:16px"></i>
            </button>
        </div>
    `;
    return div;
}

// --- Drag and Drop Logic ---

function drag(ev, taskId) {
    // Ensure we are setting data correctly. taskId is number, convert to string just in case
    ev.dataTransfer.setData("text", taskId);
    ev.dataTransfer.effectAllowed = "move";
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
    ev.currentTarget.classList.remove('drag-over');

    const taskId = parseInt(ev.dataTransfer.getData("text"));
    const task = tasks.find(t => t.id === taskId);

    if (task && task.status !== newStatus) {
        task.status = newStatus;
        saveToCloud();
        renderKanbanTasks();
    }
}


// Modal Functions
function toggleTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal.style.display === 'none' || modal.style.display === '') {
        modal.style.display = 'flex';
    } else {
        modal.style.display = 'none';
    }
}

function openTaskModal() {
    document.getElementById('task-modal').style.display = 'flex';
}

function closeTaskModal() {
    document.getElementById('task-modal').style.display = 'none';
}

function addKanbanTask() {
    const titleEle = document.getElementById('k-title');
    const descEle = document.getElementById('k-desc');

    const title = titleEle.value.trim();
    const desc = descEle.value.trim();

    if (!title) {
        alert('Iltimos, vazifa nomini kiriting');
        return;
    }

    const newTask = {
        id: Date.now(),
        title: title,
        desc: desc,
        status: 'todo', // Default status is always TODO
    };

    tasks.push(newTask);
    saveToCloud();
    renderKanbanTasks();
    closeTaskModal();

    // Reset inputs
    titleEle.value = '';
    descEle.value = '';
}

function deleteTask(id) {
    showConfirmModal('Ushbu vazifani o\'chirmoqchimisiz?', () => {
        const taskId = Number(id);
        tasks = tasks.filter(t => Number(t.id) !== taskId);
        saveToCloud();
        renderKanbanTasks();
    });
}



// --- CALENDAR LOGIC ---
let currentDate = new Date();
let calendarView = 'week'; // 'week' or 'month'

// Initialize Calendar
function initCalendar() {
    renderCalendar();
}

// Switch View
function setCalendarView(view, btn) {
    calendarView = view;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderCalendar();
}

// Change Date
function changeCalendarDate(delta) {
    if (calendarView === 'week') {
        currentDate.setDate(currentDate.getDate() + (delta * 7));
    } else {
        currentDate.setMonth(currentDate.getMonth() + delta);
    }
    renderCalendar();
}

function goToToday() {
    currentDate = new Date();
    renderCalendar();
}

// Render Calendar Dispatcher
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const label = document.getElementById('current-period-label');
    if (!grid || !label) return;

    // Uzbek Month Names
    const monthNames = [
        "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
        "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    ];

    if (calendarView === 'week') {
        grid.className = 'calendar-grid week-view';
        renderWeekView(grid);

        // Label Logic for Week
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        const startMonth = monthNames[startOfWeek.getMonth()];
        const endMonth = monthNames[endOfWeek.getMonth()];
        const year = startOfWeek.getFullYear();

        if (startMonth === endMonth) {
            label.textContent = `${startMonth} ${year}`;
        } else {
            label.textContent = `${startMonth} - ${endMonth} ${year}`;
        }

    } else {
        grid.className = 'calendar-grid month-view';
        renderMonthView(grid);
        label.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
}

// Helper: Get Monday of the current week
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

// Render Week View
function renderWeekView(container) {
    container.innerHTML = '';

    // 1. Create Headers (Empty corner + 7 days)
    const corner = document.createElement('div');
    corner.className = 'week-header';
    container.appendChild(corner); // Top-left empty slot

    const startOfWeek = getStartOfWeek(currentDate);
    const uzbekDays = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);

        const header = document.createElement('div');
        header.className = 'week-header';

        // Check if today
        const today = new Date();
        if (dayDate.toDateString() === today.toDateString()) {
            header.classList.add('today');
        }

        header.innerHTML = `
            <span>${uzbekDays[i]}</span>
            <div class="day-num">${dayDate.getDate()}</div>
        `;
        container.appendChild(header);
    }

    // 2. Create Time Slots (from 07:00 to 24:00)
    for (let hour = 7; hour < 24; hour++) {
        // Time Label
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-slot-label';
        timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
        container.appendChild(timeLabel);

        // 7 Days Columns for this hour
        for (let day = 0; day < 7; day++) {
            const cellDate = new Date(startOfWeek);
            cellDate.setDate(startOfWeek.getDate() + day);
            const dateStr = cellDate.toISOString().split('T')[0];
            const timeStr = `${hour.toString().padStart(2, '0')}:00`;

            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.dataset.date = dateStr;
            cell.dataset.time = timeStr;
            cell.onclick = (e) => {
                if (e.target === cell) openEventModalWithDate(dateStr, timeStr);
            };

            // Find and Place Events
            const cellEvents = events.filter(e => e.date === dateStr && e.time.startsWith(hour.toString().padStart(2, '0')));

            cellEvents.forEach(ev => {
                const eventDiv = document.createElement('div');
                eventDiv.className = 'calendar-event';
                eventDiv.style.backgroundColor = ev.color;
                eventDiv.innerHTML = `<span class="event-time">${ev.time}</span> ${ev.title}`;
                eventDiv.title = "O'chirish uchun bosing va ushlab turing";

                let pressTimer;
                eventDiv.onmousedown = () => {
                    pressTimer = window.setTimeout(() => {
                        deleteEvent(ev.id);
                    }, 500);
                };
                eventDiv.onmouseup = () => clearTimeout(pressTimer);

                cell.appendChild(eventDiv);
            });

            container.appendChild(cell);
        }
    }
}

// Render Month View
function renderMonthView(container) {
    container.innerHTML = '';

    // Headers
    const uzbekDaysShort = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha', 'Ya'];
    uzbekDaysShort.forEach(day => {
        const header = document.createElement('div');
        header.className = 'week-header';
        header.textContent = day;
        container.appendChild(header);
    });

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Adjust for Monday start (0=Sun, 1=Mon... in JS getDay())
    // We want Mon=0, Sun=6
    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    // Empty cells before first day
    for (let i = 0; i < startDayIndex; i++) {
        const empty = document.createElement('div');
        empty.className = 'month-cell empty';
        container.appendChild(empty);
    }

    // Days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const dateStr = cellDate.toISOString().split('T')[0];

        const cell = document.createElement('div');
        cell.className = 'month-cell';

        const today = new Date();
        if (dateStr === today.toISOString().split('T')[0]) {
            cell.classList.add('today');
        }

        // Header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'month-cell-header';
        headerDiv.innerHTML = `<div class="month-day-num">${i}</div>`;
        cell.appendChild(headerDiv);

        // Events
        const dayEvents = events.filter(e => e.date === dateStr);
        dayEvents.forEach(ev => {
            const evDiv = document.createElement('div');
            evDiv.className = 'month-event';
            evDiv.style.backgroundColor = ev.color;
            evDiv.textContent = ev.time + ' ' + ev.title;

            // Simple click to delete
            evDiv.onclick = (e) => {
                e.stopPropagation(); // Prevent opening the add modal
                deleteEvent(ev.id);
            };

            cell.appendChild(evDiv);
        });

        cell.onclick = (e) => {
            if (e.target === cell || e.target === headerDiv) openEventModalWithDate(dateStr, '09:00');
        };

        container.appendChild(cell);
    }
}

// --- Event Modal Functions ---
function openEventModal() {
    // Set default date/time
    const now = new Date();
    document.getElementById('e-date').valueAsDate = now;
    document.getElementById('e-time').value = '09:00';
    document.getElementById('e-color').value = '#3B82F6'; // Default color

    // Select default color visually
    const options = document.querySelectorAll('.color-option');
    options.forEach(el => el.classList.remove('selected'));
    if (options.length > 0) options[options.length - 1].classList.add('selected'); // Select the last one (Blue)

    document.getElementById('event-modal').style.display = 'flex';
}

function openEventModalWithDate(dateStr, timeStr) {
    document.getElementById('e-date').value = dateStr;
    document.getElementById('e-time').value = timeStr;
    document.getElementById('e-color').value = '#3B82F6'; // Default

    // Select default color visually
    const options = document.querySelectorAll('.color-option');
    options.forEach(el => el.classList.remove('selected'));
    if (options.length > 0) options[options.length - 1].classList.add('selected');

    document.getElementById('event-modal').style.display = 'flex';
}

function closeEventModal() {
    document.getElementById('event-modal').style.display = 'none';
    document.getElementById('e-title').value = '';
}

function selectColor(element, color) {
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    document.getElementById('e-color').value = color;
}

function addEvent() {
    const title = document.getElementById('e-title').value.trim();
    const dateVal = document.getElementById('e-date').value;
    const time = document.getElementById('e-time').value;
    const color = document.getElementById('e-color').value;

    if (!title || !dateVal || !time) {
        alert('Iltimos, barcha maydonlarni to\'ldiring');
        return;
    }

    events.push({
        id: Date.now(),
        groupId: null,
        title,
        date: dateVal,
        time,
        color
    });

    saveToCloud();
    renderCalendar();
    closeEventModal();
}

function deleteEvent(id) {
    showConfirmModal('Rejani o\'chirmoqchimisiz?', () => {
        const eventId = Number(id);
        events = events.filter(e => Number(e.id) !== eventId);
        saveToCloud();
        renderCalendar();
    });
}



// --- FINANCE LOGIC ---
let currentFinanceView = 'daily'; // 'daily' or 'weekly'
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
    } else {
        currentFinanceDate.setDate(currentFinanceDate.getDate() + (delta * 7));
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
}

function deleteTransaction(id) {
    showConfirmModal('Ushbu o\'tkazmani o\'chirmoqchimisiz?', () => {
        const transId = Number(id);
        transactions = transactions.filter(t => Number(t.id) !== transId);
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
    } else {
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
    showConfirmModal('Tizimdan chiqmoqchimisiz?', () => {
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

function renderDashBalance() {
    let allTimeIncome = 0;
    let allTimeExpense = 0;
    transactions.forEach(t => {
        if (t.type === 'income') allTimeIncome += t.amount;
        else allTimeExpense += t.amount;
    });
    const balance = allTimeIncome - allTimeExpense;
    const dashBalEle = document.getElementById('dash-balance');
    if (dashBalEle) dashBalEle.textContent = formatMoney(balance);
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
        item.innerHTML = `
            <div class="task-status-dot" style="background: #F4B846;"></div>
            <div class="dash-task-info">
                <div style="font-weight:600; font-size:0.95rem;">${task.title}</div>
                <div style="font-size:0.8rem; color:#888;">${task.desc}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderDashEvents() {
    const list = document.getElementById('dash-today-events');
    if (!list) return;

    list.innerHTML = '';
    const todayStr = new Date().toISOString().split('T')[0];
    const todays = events.filter(e => e.date === todayStr);

    if (todays.length === 0) {
        list.innerHTML = '<p style="color:#999;font-size:0.85rem;">Bugunga rejalar yo\'q.</p>';
        return;
    }

    todays.forEach(ev => {
        const item = document.createElement('div');
        item.className = 'dash-event-item';
        item.style.borderLeftColor = ev.color;
        item.innerHTML = `
            <strong>${ev.title}</strong>
            <span class="dash-event-time">${ev.time}</span>
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

function renderMiniCalendar() {
    const grid = document.getElementById('mini-cal-grid');
    const monthLabel = document.getElementById('mini-cal-month');
    if (!grid) return;

    grid.innerHTML = '';
    const year = miniCalDate.getFullYear();
    const month = miniCalDate.getMonth();

    const now = new Date();
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
        if (isCurrentMonth && d === today) span.classList.add('today');
        span.textContent = d;
        grid.appendChild(span);
    }
}

// --- NOTES LOGIC ---
function renderNotesList() {
    const list = document.getElementById('notes-list');
    if (!list) return;

    list.innerHTML = '';

    // Sort notes by date (newest first)
    const sortedNotes = [...notes].sort((a, b) => b.date - a.date);

    sortedNotes.forEach(note => {
        const item = document.createElement('div');
        item.className = `note-item ${currentNoteId === note.id ? 'active' : ''}`;
        item.onclick = () => openNoteOnMobile(note.id);

        const dateStr = note.date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });

        item.innerHTML = `
            <div class="note-item-title">${note.title || 'Sarlavhasiz qayd'}</div>
            <div class="note-item-date">${dateStr}</div>
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

function saveCurrentNote() {
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
        window.firebaseOnValue(usersRef, (snapshot) => {
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
                const row = document.createElement('tr');
                const initials = (user.name || '??').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

                const isOnline = !!onlineData[user.login];

                row.innerHTML = `
                    <td>
                        <div class="user-info-cell">
                            <div class="user-avatar-sm">${initials}</div>
                            <div>
                                <div style="font-weight: 600;">${user.name || 'Noma\'lum'}</div>
                                <div class="status-indicator">
                                    <div class="${isOnline ? 'online-dot' : 'offline-dot'}"></div>
                                    <span style="font-size: 0.75rem; color: ${isOnline ? '#4CAF50' : '#718096'};">
                                        ${isOnline ? 'Onlayn' : 'Offlayn'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>${user.login}</td>
                    <td style="font-size: 0.85rem; color: var(--text-muted);">
                        <i data-lucide="map-pin" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;"></i>
                        ${user.location || 'Noma\'lum'}
                    </td>
                    <td>${user.phone || '-'}</td>
                    <td>${user.email || '-'}</td>
                    <td>
                        <span class="badge ${user.isAdmin ? 'badge-admin' : 'badge-user'}">
                            ${user.isAdmin ? 'Admin' : 'Foydalanuvchi'}
                        </span>
                    </td>
                    <td>
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
                            ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Cheklov</span>'}
                        </div>
                    </td>
                `;
                list.appendChild(row);
            });

            if (onlineUsersEle) onlineUsersEle.textContent = onlineCount;
            if (window.lucide) window.lucide.createIcons();
        }, { onlyOnce: true });
    } catch (err) {
        console.error('Admin panelni yuklashda xatolik:', err);
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
            Object.keys(allUsers).forEach(login => {
                // Use firebaseRef and firebaseChild explicitly
                const rootRef = window.firebaseRef(window.firebaseDB);
                const msgsRef = window.firebaseChild(rootRef, 'users/' + login + '/messages');
                const newMsgKey = window.push(msgsRef).key;

                updates['users/' + login + '/messages/' + newMsgKey] = newMessage;
                count++;
            });

            await window.firebaseUpdate(window.firebaseRef(window.firebaseDB), updates);

            alert(`Xabar ${count} ta foydalanuvchiga muvaffaqiyatli yuborildi! ✅`);
            closeMessageModal();
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

    if (userMessages.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i data-lucide="inbox" style="width:24px; color:#A0AEC0; margin-bottom: 8px;"></i>
                <p>Xabarlar yo'q</p>
            </div>`;
    } else {
        list.innerHTML = userMessages.map(m => `
            <div class="dropdown-item ${m.read ? '' : 'unread'}" onclick="markMessageRead('${m.id}')">
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
    if (Object.keys(updates).length > 0) {
        window.firebaseUpdate(window.ref(window.firebaseDB), updates);
    }
}

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
    systemNotifications = [];
    renderNotifications();
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

    // Fallback: Bind to class selector too
    // REMOVED to prevent double-toggle interference with inline safeToggleSidebar
    // The HTML onclick="safeToggleSidebar()" is the primary handler now.
    console.log('Mobile menu logic initialized (Inline handler active)');
});
=======
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
    } catch (e) {
        console.error("System Error: Session Initialization failed:", e);
    }

    try {
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
        console.error('System Error: Component rendering failed:', e);
    }
}


// --- Global State ---
let currentUser = null;
let tasks = [];
let events = [];
let transactions = [];
let notes = [];
let currentNoteId = null;

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
            await new Promise((resolve) => {
                window.firebaseOnValue(userRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        tasks = data.tasks || [];
                        events = data.events || [];
                        transactions = (data.transactions || []).map(t => ({ ...t, date: new Date(t.date) }));
                        notes = (data.notes || []).map(n => ({ ...n, date: new Date(n.date) }));
                    }
                    resolve();
                }, { onlyOnce: true });
            });
        } catch (e) {
            console.error('Cloud Load xatosi:', e);
        }
    }

    // Initialize Messages Listener (Calls for everyone)
    initializeMessagesListener();

    updateUserUI();
}

function updateUserUI() {
    if (!currentUser) return;
    const usernameEle = document.querySelector('.user-profile .username');
    const avatarEle = document.querySelector('.user-profile .avatar');

    if (usernameEle) usernameEle.textContent = currentUser.name || currentUser.login;
    if (avatarEle) {
        const nameParts = (currentUser.name || currentUser.login || "U").split(' ');
        const initials = nameParts.length > 1
            ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
            : nameParts[0].substring(0, 2).toUpperCase();
        avatarEle.textContent = initials;
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
        const ss = String(today.getSeconds()).padStart(2, '0');
        clockElement.textContent = `${hh}:${mm}:${ss}`;
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

    document.getElementById(`view-${tabId}`).style.display = 'block';

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    element.classList.add('active');

    const headings = {
        'dashboard': 'Bosh sahifa',
        'tasks': 'Vazifalar',
        'calendar': 'Kalendar',
        'finance': 'Moliya',
        'notes': 'Qaydlar',
        'admin': 'Admin Panel'
    };
    if (tabId === 'dashboard') renderDashboard();
    if (tabId === 'calendar') initCalendar();
    if (tabId === 'finance') initFinance();
    if (tabId === 'notes') renderNotesList();
    if (tabId === 'admin') renderAdminPanel();
    document.getElementById('page-heading').textContent = headings[tabId];
}

// --- Kanban Logic ---
function renderKanbanTasks() {
    // Clear lists
    document.getElementById('list-todo').innerHTML = '';
    document.getElementById('list-in-progress').innerHTML = '';
    document.getElementById('list-done').innerHTML = '';

    // Reset counts
    let counts = { 'todo': 0, 'in-progress': 0, 'done': 0 };

    tasks.forEach(task => {
        counts[task.status]++;
        const card = createKanbanCard(task);
        document.getElementById(`list-${task.status}`).appendChild(card);
    });

    // Update counts
    document.getElementById('count-todo').textContent = counts['todo'];
    document.getElementById('count-in-progress').textContent = counts['in-progress'];
    document.getElementById('count-done').textContent = counts['done'];

    lucide.createIcons();
    renderDashboard();
}

function createKanbanCard(task) {
    const div = document.createElement('div');
    div.className = `kanban-card status-${task.status}`;
    div.setAttribute('draggable', true);
    // Add drag attribute for functionality
    div.setAttribute('ondragstart', `drag(event, ${task.id})`);

    div.innerHTML = `
        <div class="card-title">${task.title}</div>
        <div class="card-desc">${task.desc || ''}</div>
        <div class="card-footer">
            <button class="card-delete-btn" onclick="deleteTask(${task.id})" title="O'chirish">
                <i data-lucide="trash-2" style="width:16px"></i>
            </button>
        </div>
    `;
    return div;
}

// --- Drag and Drop Logic ---

function drag(ev, taskId) {
    // Ensure we are setting data correctly. taskId is number, convert to string just in case
    ev.dataTransfer.setData("text", taskId);
    ev.dataTransfer.effectAllowed = "move";
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
    ev.currentTarget.classList.remove('drag-over');

    const taskId = parseInt(ev.dataTransfer.getData("text"));
    const task = tasks.find(t => t.id === taskId);

    if (task && task.status !== newStatus) {
        task.status = newStatus;
        saveToCloud();
        renderKanbanTasks();
    }
}


// Modal Functions
function toggleTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal.style.display === 'none' || modal.style.display === '') {
        modal.style.display = 'flex';
    } else {
        modal.style.display = 'none';
    }
}

function openTaskModal() {
    document.getElementById('task-modal').style.display = 'flex';
}

function closeTaskModal() {
    document.getElementById('task-modal').style.display = 'none';
}

function addKanbanTask() {
    const titleEle = document.getElementById('k-title');
    const descEle = document.getElementById('k-desc');

    const title = titleEle.value.trim();
    const desc = descEle.value.trim();

    if (!title) {
        alert('Iltimos, vazifa nomini kiriting');
        return;
    }

    const newTask = {
        id: Date.now(),
        title: title,
        desc: desc,
        status: 'todo', // Default status is always TODO
    };

    tasks.push(newTask);
    saveToCloud();
    renderKanbanTasks();
    closeTaskModal();

    // Reset inputs
    titleEle.value = '';
    descEle.value = '';
}

function deleteTask(id) {
    showConfirmModal('Ushbu vazifani o\'chirmoqchimisiz?', () => {
        const taskId = Number(id);
        tasks = tasks.filter(t => Number(t.id) !== taskId);
        saveToCloud();
        renderKanbanTasks();
    });
}



// --- CALENDAR LOGIC ---
let currentDate = new Date();
let calendarView = 'week'; // 'week' or 'month'

// Initialize Calendar
function initCalendar() {
    renderCalendar();
}

// Switch View
function setCalendarView(view, btn) {
    calendarView = view;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderCalendar();
}

// Change Date
function changeCalendarDate(delta) {
    if (calendarView === 'week') {
        currentDate.setDate(currentDate.getDate() + (delta * 7));
    } else {
        currentDate.setMonth(currentDate.getMonth() + delta);
    }
    renderCalendar();
}

function goToToday() {
    currentDate = new Date();
    renderCalendar();
}

// Render Calendar Dispatcher
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const label = document.getElementById('current-period-label');
    if (!grid || !label) return;

    // Uzbek Month Names
    const monthNames = [
        "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
        "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    ];

    if (calendarView === 'week') {
        grid.className = 'calendar-grid week-view';
        renderWeekView(grid);

        // Label Logic for Week
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);

        const startMonth = monthNames[startOfWeek.getMonth()];
        const endMonth = monthNames[endOfWeek.getMonth()];
        const year = startOfWeek.getFullYear();

        if (startMonth === endMonth) {
            label.textContent = `${startMonth} ${year}`;
        } else {
            label.textContent = `${startMonth} - ${endMonth} ${year}`;
        }

    } else {
        grid.className = 'calendar-grid month-view';
        renderMonthView(grid);
        label.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
}

// Helper: Get Monday of the current week
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

// Render Week View
function renderWeekView(container) {
    container.innerHTML = '';

    // 1. Create Headers (Empty corner + 7 days)
    const corner = document.createElement('div');
    corner.className = 'week-header';
    container.appendChild(corner); // Top-left empty slot

    const startOfWeek = getStartOfWeek(currentDate);
    const uzbekDays = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);

        const header = document.createElement('div');
        header.className = 'week-header';

        // Check if today
        const today = new Date();
        if (dayDate.toDateString() === today.toDateString()) {
            header.classList.add('today');
        }

        header.innerHTML = `
            <span>${uzbekDays[i]}</span>
            <div class="day-num">${dayDate.getDate()}</div>
        `;
        container.appendChild(header);
    }

    // 2. Create Time Slots (from 07:00 to 24:00)
    for (let hour = 7; hour < 24; hour++) {
        // Time Label
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-slot-label';
        timeLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;
        container.appendChild(timeLabel);

        // 7 Days Columns for this hour
        for (let day = 0; day < 7; day++) {
            const cellDate = new Date(startOfWeek);
            cellDate.setDate(startOfWeek.getDate() + day);
            const dateStr = cellDate.toISOString().split('T')[0];
            const timeStr = `${hour.toString().padStart(2, '0')}:00`;

            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            cell.dataset.date = dateStr;
            cell.dataset.time = timeStr;
            cell.onclick = (e) => {
                if (e.target === cell) openEventModalWithDate(dateStr, timeStr);
            };

            // Find and Place Events
            const cellEvents = events.filter(e => e.date === dateStr && e.time.startsWith(hour.toString().padStart(2, '0')));

            cellEvents.forEach(ev => {
                const eventDiv = document.createElement('div');
                eventDiv.className = 'calendar-event';
                eventDiv.style.backgroundColor = ev.color;
                eventDiv.innerHTML = `<span class="event-time">${ev.time}</span> ${ev.title}`;
                eventDiv.title = "O'chirish uchun bosing va ushlab turing";

                let pressTimer;
                eventDiv.onmousedown = () => {
                    pressTimer = window.setTimeout(() => {
                        deleteEvent(ev.id);
                    }, 500);
                };
                eventDiv.onmouseup = () => clearTimeout(pressTimer);

                cell.appendChild(eventDiv);
            });

            container.appendChild(cell);
        }
    }
}

// Render Month View
function renderMonthView(container) {
    container.innerHTML = '';

    // Headers
    const uzbekDaysShort = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha', 'Ya'];
    uzbekDaysShort.forEach(day => {
        const header = document.createElement('div');
        header.className = 'week-header';
        header.textContent = day;
        container.appendChild(header);
    });

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Adjust for Monday start (0=Sun, 1=Mon... in JS getDay())
    // We want Mon=0, Sun=6
    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    // Empty cells before first day
    for (let i = 0; i < startDayIndex; i++) {
        const empty = document.createElement('div');
        empty.className = 'month-cell empty';
        container.appendChild(empty);
    }

    // Days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const dateStr = cellDate.toISOString().split('T')[0];

        const cell = document.createElement('div');
        cell.className = 'month-cell';

        const today = new Date();
        if (dateStr === today.toISOString().split('T')[0]) {
            cell.classList.add('today');
        }

        // Header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'month-cell-header';
        headerDiv.innerHTML = `<div class="month-day-num">${i}</div>`;
        cell.appendChild(headerDiv);

        // Events
        const dayEvents = events.filter(e => e.date === dateStr);
        dayEvents.forEach(ev => {
            const evDiv = document.createElement('div');
            evDiv.className = 'month-event';
            evDiv.style.backgroundColor = ev.color;
            evDiv.textContent = ev.time + ' ' + ev.title;

            // Simple click to delete
            evDiv.onclick = (e) => {
                e.stopPropagation(); // Prevent opening the add modal
                deleteEvent(ev.id);
            };

            cell.appendChild(evDiv);
        });

        cell.onclick = (e) => {
            if (e.target === cell || e.target === headerDiv) openEventModalWithDate(dateStr, '09:00');
        };

        container.appendChild(cell);
    }
}

// --- Event Modal Functions ---
function openEventModal() {
    // Set default date/time
    const now = new Date();
    document.getElementById('e-date').valueAsDate = now;
    document.getElementById('e-time').value = '09:00';
    document.getElementById('e-color').value = '#3B82F6'; // Default color

    // Select default color visually
    const options = document.querySelectorAll('.color-option');
    options.forEach(el => el.classList.remove('selected'));
    if (options.length > 0) options[options.length - 1].classList.add('selected'); // Select the last one (Blue)

    document.getElementById('event-modal').style.display = 'flex';
}

function openEventModalWithDate(dateStr, timeStr) {
    document.getElementById('e-date').value = dateStr;
    document.getElementById('e-time').value = timeStr;
    document.getElementById('e-color').value = '#3B82F6'; // Default

    // Select default color visually
    const options = document.querySelectorAll('.color-option');
    options.forEach(el => el.classList.remove('selected'));
    if (options.length > 0) options[options.length - 1].classList.add('selected');

    document.getElementById('event-modal').style.display = 'flex';
}

function closeEventModal() {
    document.getElementById('event-modal').style.display = 'none';
    document.getElementById('e-title').value = '';
}

function selectColor(element, color) {
    document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    document.getElementById('e-color').value = color;
}

function addEvent() {
    const title = document.getElementById('e-title').value.trim();
    const dateVal = document.getElementById('e-date').value;
    const time = document.getElementById('e-time').value;
    const color = document.getElementById('e-color').value;

    if (!title || !dateVal || !time) {
        alert('Iltimos, barcha maydonlarni to\'ldiring');
        return;
    }

    events.push({
        id: Date.now(),
        groupId: null,
        title,
        date: dateVal,
        time,
        color
    });

    saveToCloud();
    renderCalendar();
    closeEventModal();
}

function deleteEvent(id) {
    showConfirmModal('Rejani o\'chirmoqchimisiz?', () => {
        const eventId = Number(id);
        events = events.filter(e => Number(e.id) !== eventId);
        saveToCloud();
        renderCalendar();
    });
}



// --- FINANCE LOGIC ---
let currentFinanceView = 'daily'; // 'daily' or 'weekly'
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
    } else {
        currentFinanceDate.setDate(currentFinanceDate.getDate() + (delta * 7));
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
}

function deleteTransaction(id) {
    showConfirmModal('Ushbu o\'tkazmani o\'chirmoqchimisiz?', () => {
        const transId = Number(id);
        transactions = transactions.filter(t => Number(t.id) !== transId);
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
    } else {
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
    showConfirmModal('Tizimdan chiqmoqchimisiz?', () => {
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

function renderDashBalance() {
    let allTimeIncome = 0;
    let allTimeExpense = 0;
    transactions.forEach(t => {
        if (t.type === 'income') allTimeIncome += t.amount;
        else allTimeExpense += t.amount;
    });
    const balance = allTimeIncome - allTimeExpense;
    const dashBalEle = document.getElementById('dash-balance');
    if (dashBalEle) dashBalEle.textContent = formatMoney(balance);
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
        item.innerHTML = `
            <div class="task-status-dot" style="background: #F4B846;"></div>
            <div class="dash-task-info">
                <div style="font-weight:600; font-size:0.95rem;">${task.title}</div>
                <div style="font-size:0.8rem; color:#888;">${task.desc}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderDashEvents() {
    const list = document.getElementById('dash-today-events');
    if (!list) return;

    list.innerHTML = '';
    const todayStr = new Date().toISOString().split('T')[0];
    const todays = events.filter(e => e.date === todayStr);

    if (todays.length === 0) {
        list.innerHTML = '<p style="color:#999;font-size:0.85rem;">Bugunga rejalar yo\'q.</p>';
        return;
    }

    todays.forEach(ev => {
        const item = document.createElement('div');
        item.className = 'dash-event-item';
        item.style.borderLeftColor = ev.color;
        item.innerHTML = `
            <strong>${ev.title}</strong>
            <span class="dash-event-time">${ev.time}</span>
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

function renderMiniCalendar() {
    const grid = document.getElementById('mini-cal-grid');
    const monthLabel = document.getElementById('mini-cal-month');
    if (!grid) return;

    grid.innerHTML = '';
    const year = miniCalDate.getFullYear();
    const month = miniCalDate.getMonth();

    const now = new Date();
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
        if (isCurrentMonth && d === today) span.classList.add('today');
        span.textContent = d;
        grid.appendChild(span);
    }
}

// --- NOTES LOGIC ---
function renderNotesList() {
    const list = document.getElementById('notes-list');
    if (!list) return;

    list.innerHTML = '';

    // Sort notes by date (newest first)
    const sortedNotes = [...notes].sort((a, b) => b.date - a.date);

    sortedNotes.forEach(note => {
        const item = document.createElement('div');
        item.className = `note-item ${currentNoteId === note.id ? 'active' : ''}`;
        item.onclick = () => openNoteOnMobile(note.id);

        const dateStr = note.date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });

        item.innerHTML = `
            <div class="note-item-title">${note.title || 'Sarlavhasiz qayd'}</div>
            <div class="note-item-date">${dateStr}</div>
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

function saveCurrentNote() {
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
        window.firebaseOnValue(usersRef, (snapshot) => {
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
                const row = document.createElement('tr');
                const initials = (user.name || '??').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

                const isOnline = !!onlineData[user.login];

                row.innerHTML = `
                    <td>
                        <div class="user-info-cell">
                            <div class="user-avatar-sm">${initials}</div>
                            <div>
                                <div style="font-weight: 600;">${user.name || 'Noma\'lum'}</div>
                                <div class="status-indicator">
                                    <div class="${isOnline ? 'online-dot' : 'offline-dot'}"></div>
                                    <span style="font-size: 0.75rem; color: ${isOnline ? '#4CAF50' : '#718096'};">
                                        ${isOnline ? 'Onlayn' : 'Offlayn'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>${user.login}</td>
                    <td style="font-size: 0.85rem; color: var(--text-muted);">
                        <i data-lucide="map-pin" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;"></i>
                        ${user.location || 'Noma\'lum'}
                    </td>
                    <td>${user.phone || '-'}</td>
                    <td>${user.email || '-'}</td>
                    <td>
                        <span class="badge ${user.isAdmin ? 'badge-admin' : 'badge-user'}">
                            ${user.isAdmin ? 'Admin' : 'Foydalanuvchi'}
                        </span>
                    </td>
                    <td>
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
                            ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Cheklov</span>'}
                        </div>
                    </td>
                `;
                list.appendChild(row);
            });

            if (onlineUsersEle) onlineUsersEle.textContent = onlineCount;
            if (window.lucide) window.lucide.createIcons();
        }, { onlyOnce: true });
    } catch (err) {
        console.error('Admin panelni yuklashda xatolik:', err);
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
            Object.keys(allUsers).forEach(login => {
                // Use firebaseRef and firebaseChild explicitly
                const rootRef = window.firebaseRef(window.firebaseDB);
                const msgsRef = window.firebaseChild(rootRef, 'users/' + login + '/messages');
                const newMsgKey = window.push(msgsRef).key;

                updates['users/' + login + '/messages/' + newMsgKey] = newMessage;
                count++;
            });

            await window.firebaseUpdate(window.firebaseRef(window.firebaseDB), updates);

            alert(`Xabar ${count} ta foydalanuvchiga muvaffaqiyatli yuborildi! ✅`);
            closeMessageModal();
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

    if (userMessages.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i data-lucide="inbox" style="width:24px; color:#A0AEC0; margin-bottom: 8px;"></i>
                <p>Xabarlar yo'q</p>
            </div>`;
    } else {
        list.innerHTML = userMessages.map(m => `
            <div class="dropdown-item ${m.read ? '' : 'unread'}" onclick="markMessageRead('${m.id}')">
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
    if (Object.keys(updates).length > 0) {
        window.firebaseUpdate(window.ref(window.firebaseDB), updates);
    }
}

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
    systemNotifications = [];
    renderNotifications();
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

    // Fallback: Bind to class selector too
    // REMOVED to prevent double-toggle interference with inline safeToggleSidebar
    // The HTML onclick="safeToggleSidebar()" is the primary handler now.
    console.log('Mobile menu logic initialized (Inline handler active)');
});
>>>>>>> 6a0a7362ac79aa615b34211b46a9da6707b26085
