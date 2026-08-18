// EduPlan Pro - Core Application Logic

const firebaseConfig = {
  apiKey: "AIzaSyDkEZUKxzzmVvfYfruDoz6xtlT4IEIp8Js",
  authDomain: "myplans-62ccd.firebaseapp.com",
  projectId: "myplans-62ccd",
  storageBucket: "myplans-62ccd.firebasestorage.app",
  messagingSenderId: "1039549942106",
  appId: "1:1039549942106:web:46dfe1255d4e10bff7cb63",
  measurementId: "G-QQZ8M9RHP7"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();


// Curriculum Constants
const COMPUTER_TOPICS = [
    "Dasturiy ta'minot va ish stolida ishlash",
    "Brouzerda ishlash",
    "Microsoft word dasturi bilan tanishish",
    "Matnni tekislash, ro‘yxatlar va ramkalar bilan ishlash",
    "Microsoft word dasturida rasmlar bilan ishlash",
    "Word rasmlar bilan ishlash (Amaliyot)",
    "Microsoft word dasturida jadvallar bilan ishlash",
    "Word jadvallar bilan ishlash (Amaliyot)",
    "micrisift word vstavka bo'limi (figure, smart object)",
    "Konstruktor, maket, havolalar va ko‘rinish (View) bo‘limlari",
    "MS Word bo‘yicha imtihon va amaliy topshiriqlar",
    "Excel dasturiga kirish: formatlash va tezkor klavishlar",
    "Son formatlari, yacheykalar, avtosumma va stillar",
    "Ma’lumotlarni saralash, filtrlash",
    "Diagrammalar bilan ishlash",
    "Diagrammalar bilan ishlash (Amaliyot)",
    "Formula (oylik, sum esli, sumproizv)",
    "Formula (Esli, Sum esli, Razrabotchik)",
    "Formula (Listlar bilan ishlash)",
    "Microsoft power point 1-dars",
    "Microasoft power point 2-dars",
    "Google disk (Sorovnoma)",
    "Google disk (sheets, docs)",
    "windows ustanovka (canva, AI )"
];

const GRAPHIC_TOPICS = [
    "Grafik dizayn sohasiga kirish", "Photoshop interfeysi va asboblar", "Layerlar (sloylar) va xususiyatlari",
    "Maskalar bilan ishlash asoslari", "Photoshopda tanlash (selection) asboblari", "Tasvirlarni retush qilish",
    "Ranglarni korreksiya qilish va filtrlar", "Smart obyektlar va ularning ahamiyati", "Photoshopda matnlar bilan ishlash",
    "Banner yaratish amaliyoti", "Murakkab kollajlar tayyorlash", "Pen tool (pero) bilan ishlash sirlari",
    "Brush (mo'yqalam) sozlamalari va amaliyoti", "Vector va Rastor grafikasi farqlari", "Adobe Illustrator interfeysi",
    "Illustrator shakllar (shapes) bilan ishlash", "Pathfinder paneli va murakkab shakllar", "Gradientlar va ranglar bilan ishlash",
    "Illustratorda tekstura va naqshlar (patterns)", "Tipografika sirlari va shriftlar", "Logotip yaratish bosqichlari",
    "Brending va korporativ stil (brandbook)", "Vizitka va flayer dizayni", "Ijtimoiy tarmoqlar uchun dizayn (SMM)",
    "Mockup nima va undan qanday foydalaniladi?", "Vektorli illyustratsiya yaratish", "Qadoq (packaging) dizayni asoslari",
    "Adobe InDesign interfeysi bilan tanishuv", "InDesignda ko'p sahifali hujjatlar", "Grid tizimi (setkalar) va kompozitsiya",
    "Ranglar nazariyasi (RGB, CMYK, Pantone)", "Ranglar psixologiyasi dizaynda", "UI/UX dizayn asoslariga kirish",
    "Figma dasturi va uning afzalliklari", "Figma frame, auto-layout va komponentlar", "Figma prototiplash (prototyping)",
    "Veb-sayt dizayni (Landing Page)", "Mobil ilova interfeysi dizayni", "Dizaynerlar uchun portfoliyo yaratish (Behance)",
    "Mijozlar bilan ishlash va frilans platformalar", "3D effektlar yaratish Illustratorda", "AI (Sun'iy intellekt) dizayndagi o'rni",
    "Animatsiyalangan bannerlar tayyorlash", "Murakkab loyihalarni Figma-da yakunlash", "Mijoz portfelini tayyorlash sirlari",
    "Shaxsiy brend yaratish sirlari", "Dizaynlarni chop etishga tayyorlash (prepress)", "Yakuniy imtihon va taqdimot"
];

// State Management
let state = {
    groups: JSON.parse(localStorage.getItem('edu_groups')) || [],
    notes: JSON.parse(localStorage.getItem('edu_notes')) || [],
    reminders: JSON.parse(localStorage.getItem('edu_reminders')) || [],
    tasks: JSON.parse(localStorage.getItem('edu_tasks')) || [
        { id: '1', text: "Dars materiallarini tayyorlash", type: 'today', category: 'edu', completed: false },
        { id: '2', text: "Testlarni tekshirish", type: 'weekly', category: 'edu', completed: false },
        { id: '3', text: "Haftalik o'quv hisoboti", type: 'weekly', category: 'edu', completed: true },
        { id: '4', text: "Yangi SMM post dizaynini tayyorlash", type: 'today', category: 'marketing', completed: false },
        { id: '5', text: "Telegram kanalga yangi kontent yuklash", type: 'weekly', category: 'marketing', completed: false }
    ],
    courses: JSON.parse(localStorage.getItem('edu_courses')) || [
        {
            id: 'computer_literacy',
            name: "Kompyuter savodxonligi",
            durationMonths: 2,
            totalLessons: 24,
            lessons: COMPUTER_TOPICS.map((topic, i) => ({
                index: i + 1,
                topic: topic,
                hours: "2 soat",
                materials: [
                    { name: "dars_taqdimot.pdf", type: "pdf", size: "2.4 MB" },
                    { name: "amaliy_vazifa.docx", type: "word", size: "1.1 MB" }
                ]
            }))
        },
        {
            id: 'graphic_design',
            name: "Grafik dizayn",
            durationMonths: 4,
            totalLessons: 48,
            lessons: GRAPHIC_TOPICS.map((topic, i) => ({
                index: i + 1,
                topic: topic,
                hours: "2 soat",
                materials: [
                    { name: "dizayn_asoslari.pdf", type: "pdf", size: "3.5 MB" }
                ]
            }))
        }
    ],
    smm: JSON.parse(localStorage.getItem('edu_smm')) || [
        {
            id: 'smm-1',
            title: "Photoshopda Banner Yaratish Sirlari",
            content: "Banner yaratish bo'yicha content plan, ranglar uyg'unligi va kompozitsiya haqida dars.",
            datetime: "2026-05-15T18:00",
            published: false,
            link: ""
        },
        {
            id: 'smm-2',
            title: "Grafik Dizayner Portfoliosi (Behance)",
            content: "Behance-da shaxsiy profil va ishlarni joylash bo'yicha qadam-baqadam vizual qo'llanma post.",
            datetime: "2026-05-12T11:00",
            published: true,
            link: "https://t.me/eduplan_graphic/24"
        }
    ],
    moodboard: JSON.parse(localStorage.getItem('edu_moodboard')) || [
        {
            id: 'mb-1',
            src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60",
            x: 50,
            y: 50,
            width: 250,
            height: 180
        },
        {
            id: 'mb-2',
            src: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&auto=format&fit=crop&q=60",
            x: 350,
            y: 80,
            width: 280,
            height: 200
        }
    ],
    moodboardZoom: 1.0,
    moodboardTool: 'select',
    selectedMoodboardId: null,
    moodboardHistoryUndo: [],
    moodboardHistoryRedo: [],
    currentView: 'dashboard',
    selectedNote: null
};

// Constants
const LESSON_TOPICS = [
    "Dastur bilan tanishish", "Asboblar va panellar", "Ranglar nazariyasi", "Kompozitsiya asoslari",
    "Tipografika", "Logotip yaratish", "Brending asoslari", "Ijtimoiy tarmoq dizayni",
    "Bannerlar bilan ishlash", "Retush va korreksiya", "Vektorli grafika", "Rastrli grafika",
    "Sloylar va maskalar", "Filtrlar va effektlar", "UI/UX asoslari", "Mobil ilova dizayni",
    "Veb-sayt dizayni", "Portfoliyo tayyorlash", "Mijoz bilan ishlash", "Frilans asoslari",
    "Murakkab kollajlar", "3D effektlar", "Animatsiya asoslari", "Yig'indi va imtihon"
];



// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    const isAuthenticated = localStorage.getItem('edu_authenticated') === 'true';
    const overlay = document.getElementById('login-overlay');
    
    if (isAuthenticated) {
        if (overlay) overlay.style.display = 'none';
        initAppFull();
    } else {
        if (overlay) overlay.style.display = 'flex';
        // Only load icon assets for login form, do not populate application data
        initIcons();
    }
});

// ==========================================
// OFF-LINE DATABASE STORAGE FOR MULTIPLE LARGE MOODBOARD IMAGES
// ==========================================
const DB_NAME = 'EduPlannerDB_V1';
const STORE_NAME = 'moodboard_store';

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

function saveMoodboardToDB(moodboardArray) {
    return initDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            store.clear();
            moodboardArray.forEach(item => {
                store.put(item);
            });
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = (e) => reject(e.target.error);
        });
    });
}

function loadMoodboardFromDB() {
    return initDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    });
}

function migrateCourses() {
    if (state.courses && state.courses.length > 0) {
        const compLit = state.courses.find(c => c.id === 'computer_literacy');
        if (compLit) {
            const firstLesson = compLit.lessons[0];
            if (!firstLesson || firstLesson.topic !== COMPUTER_TOPICS[0] || compLit.lessons.length !== COMPUTER_TOPICS.length) {
                const updatedLessons = COMPUTER_TOPICS.map((topic, i) => {
                    const existing = compLit.lessons.find(l => l.index === i + 1) || {};
                    
                    let materials = existing.materials || [
                        { name: "dars_taqdimot.pdf", type: "pdf", size: "2.4 MB" },
                        { name: "amaliy_vazifa.docx", type: "word", size: "1.1 MB" }
                    ];
                    
                    if (i === 0) {
                        const hasTestFile = materials.some(m => m.name === "eduplan_test_fayli.txt");
                        if (!hasTestFile) {
                            materials.push({
                                name: "eduplan_test_fayli.txt",
                                type: "text",
                                size: "154 B",
                                data: "data:text/plain;base64,VGFicmlybGF5bWl6ISBFZHVQbGFuIFBybyB0aXppbWlkYSBmYXlsIHl1a2xhc2ggdmEgeXVrbGFiIG9saXNoIHRpemltaSBtdXZhZmZhcWl5YXRsaSBpc2hsYXZlcmRpLiBDb21wdXRlciBMaXRlcmFjeSBjb3Vyc2UgdGVzdCBkb2N1bWVudC4="
                            });
                        }
                    }

                    let homeworkFiles = existing.homeworkFiles || [];
                    if (i === 0) {
                        const hasHwFile = homeworkFiles.some(f => f.name === "uyga_vazifa_test_topshiriq.txt");
                        if (!hasHwFile) {
                            homeworkFiles.push({
                                name: "uyga_vazifa_test_topshiriq.txt",
                                size: "185 B",
                                data: "data:text/plain;base64,VGFicmlybGF5bWl6ISBFZHVQbGFuIFBybyB0aXppbWlkYSB1eWdhIHZhemlmYSBmYXlsbGFyaW5pIHl1a2xhc2ggdmEgeXVrbGFiIG9saXNoIHRpemltaSBoYW0gYWxvSGlkYSBtdXZhZmZhcWl5YXRsaSBpc2hsYXlhYmRpLg=="
                            });
                        }
                    }

                    return {
                        index: i + 1,
                        topic: topic,
                        hours: existing.hours || "2 soat",
                        materials: materials,
                        homeworkFiles: homeworkFiles,
                        infoText: existing.infoText || '',
                        homework: existing.homework || '',
                        quiz: existing.quiz || []
                    };
                });
                compLit.lessons = updatedLessons;
                compLit.totalLessons = COMPUTER_TOPICS.length;
                saveState();
            } else {
                const l1 = compLit.lessons[0];
                if (l1) {
                    let changed = false;
                    if (!l1.materials) {
                        l1.materials = [];
                        changed = true;
                    }
                    if (!l1.materials.some(m => m.name === "eduplan_test_fayli.txt")) {
                        l1.materials.push({
                            name: "eduplan_test_fayli.txt",
                            type: "text",
                            size: "154 B",
                            data: "data:text/plain;base64,VGFicmlybGF5bWl6ISBFZHVQbGFuIFBybyB0aXppbWlkYSBmYXlsIHl1a2xhc2ggdmEgeXVrbGFiIG9saXNoIHRpemltaSBtdXZhZmZhcWl5YXRsaSBpc2hsYXZlcmRpLiBDb21wdXRlciBMaXRlcmFjeSBjb3Vyc2UgdGVzdCBkb2N1bWVudC4="
                        });
                        changed = true;
                    }
                    if (!l1.homeworkFiles) {
                        l1.homeworkFiles = [];
                        changed = true;
                    }
                    if (!l1.homeworkFiles.some(f => f.name === "uyga_vazifa_test_topshiriq.txt")) {
                        l1.homeworkFiles.push({
                            name: "uyga_vazifa_test_topshiriq.txt",
                            size: "185 B",
                            data: "data:text/plain;base64,VGFicmlybGF5bWl6ISBFZHVQbGFuIFBybyB0aXppbWlkYSB1eWdhIHZhemlmYSBmYXlsbGFyaW5pIHl1a2xhc2ggdmEgeXVrbGFiIG9saXNoIHRpemltaSBoYW0gYWxvSGlkYSBtdXZhZmZhcWl5YXRsaSBpc2hsYXlhYmRpLg=="
                        });
                        changed = true;
                    }
                    if (changed) {
                        saveState();
                    }
                }
            }
        }
    }
}

function createDefaultGroups() {
    const course = state.courses.find(c => c.id === 'computer_literacy');
    if (!course) return;

    const defaultGroupsData = [
        {
            name: "Kompyuter savodxonligi 1-guruh",
            code: "192/2026-102",
            time: "11:00",
            freq: "2-4-6",
            start: "2026-07-02"
        },
        {
            name: "Kompyuter savodxonligi 2-guruh",
            code: "192/2026-108",
            time: "09:00",
            freq: "2-4-6",
            start: "2026-07-02"
        },
        {
            name: "Kompyuter savodxonligi 4-guruh",
            code: "192/2026-119",
            time: "09:00",
            freq: "1-3-5",
            start: "2026-07-01"
        },
        {
            name: "Kompyuter savodxonligi 3-guruh",
            code: "192/2026-110",
            time: "18:00",
            freq: "1-3-5",
            start: "2026-07-01"
        },
        {
            name: "Kompyuter savodxonligi 5-guruh",
            code: "192/2026-122",
            time: "11:00",
            freq: "2-4-6",
            start: "2026-07-02"
        }
    ];

    const newGroupsList = defaultGroupsData.map((data, index) => {
        return {
            id: `default-g-${index + 1}`,
            name: data.name,
            code: data.code,
            courseId: "computer_literacy",
            courseName: course.name,
            color: "#3b82f6",
            duration: 2,
            time: data.time,
            frequency: data.freq,
            startDate: data.start,
            skippedDates: [],
            lessons: calculateSchedule(data.start, 2, data.freq, "computer_literacy")
        };
    });

    state.groups = newGroupsList;
    saveState();
}

async function initAppFull() {
    try {
        await loadStateFromFirestore();
    } catch (fsError) {
        console.error("Firestore data load failed, using local storage state:", fsError);
    }
    
    // Auto-create default 5 groups if there are none or only test groups
    if (!state.groups || state.groups.length <= 1) {
        createDefaultGroups();
    }
    
    migrateCourses();
    initIcons();
    initViewNavigation();
    switchView('dashboard');
    renderDashboard();
    renderCalendar();
    renderReminders();
    renderCategoryTasks('edu');
    renderCategoryTasks('marketing');
    updateSidebarBadges();
    setupEventListeners();

    // Load moodboard from IndexedDB asynchronously at startup
    loadMoodboardFromDB().then(dbMoodboard => {
        if (dbMoodboard && dbMoodboard.length > 0) {
            state.moodboard = dbMoodboard;
        }
    }).catch(err => {
        console.error("IndexedDB error loading moodboard, falling back to local memory:", err);
    });

    // Request HTML5 desktop notification permission
    if (window.Notification && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    // Set background task checker for reminders (every 10 seconds)
    setInterval(checkActiveReminders, 10000);
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const usernameEl = document.getElementById('login-username');
    const passwordEl = document.getElementById('login-password');
    const errorEl = document.getElementById('login-error-message');
    
    const emailOrUser = usernameEl ? usernameEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    
    // Mahalliy fallback (Maverick login/parol)
    if (emailOrUser.toLowerCase() === 'maverick' && password === 'maverick5715') {
        localStorage.setItem('edu_authenticated', 'true');
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                initAppFull();
                showToast("Xush kelibsiz, Maverick! 👋", "success");
            }, 400);
        }
        return;
    }
    
    try {
        let loginEmail = emailOrUser;
        // Agar kiritilgan foydalanuvchi nomi email bo'lmasa, taxminiy email formatiga o'tkazish
        if (!loginEmail.includes('@')) {
            loginEmail = `${emailOrUser}@gmail.com`;
        }
        
        await auth.signInWithEmailAndPassword(loginEmail, password);
        localStorage.setItem('edu_authenticated', 'true');
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                initAppFull();
                showToast("Xush kelibsiz! 👋", "success");
            }, 400);
        }
    } catch (error) {
        console.error("Firebase Login Error:", error);
        if (errorEl) {
            errorEl.textContent = 'Login (Email) yoki parol xato kiritildi!';
            errorEl.style.display = 'block';
        }
        if (passwordEl) passwordEl.value = '';
    }
}

async function handleLogout() {
    try {
        await auth.signOut();
    } catch(e) {
        console.error("Logout error", e);
    }
    localStorage.removeItem('edu_authenticated');
    const overlay = document.getElementById('login-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
        
        // Reset fields
        const usernameEl = document.getElementById('login-username');
        const passwordEl = document.getElementById('login-password');
        const errorEl = document.getElementById('login-error-message');
        if (usernameEl) usernameEl.value = '';
        if (passwordEl) passwordEl.value = '';
        if (errorEl) errorEl.style.display = 'none';
        
        initIcons();
    }
    showToast("Tizimdan chiqildi", "warning");
    // Reload page to purge any remaining state from memory
    setTimeout(() => {
        window.location.reload();
    }, 600);
}

window.handleLoginSubmit = handleLoginSubmit;
window.handleLogout = handleLogout;

async function saveStateToFirestore() {
    try {
        await db.collection("app_data").doc("main").set({
            groups: state.groups,
            notes: state.notes,
            reminders: state.reminders,
            tasks: state.tasks,
            courses: state.courses,
            smm: state.smm
        });
    } catch (e) {
        console.error("Error saving to Firestore", e);
    }
}

async function loadStateFromFirestore() {
    try {
        const docSnap = await db.collection("app_data").doc("main").get();
        if (docSnap.exists()) {
            const data = docSnap.data();
            let merged = false;
            
            // Robust merge logic to prevent database wiping and merge local/cloud data
            if (data.groups && data.groups.length > 0) {
                const localGroups = state.groups || [];
                const mergedGroups = [...data.groups];
                localGroups.forEach(localG => {
                    if (!mergedGroups.some(cloudG => cloudG.id === localG.id || cloudG.name === localG.name)) {
                        mergedGroups.push(localG);
                        merged = true;
                    }
                });
                state.groups = mergedGroups;
            } else if (state.groups && state.groups.length > 0) {
                merged = true;
            }
            
            if (data.notes && data.notes.length > 0) {
                const localNotes = state.notes || [];
                const mergedNotes = [...data.notes];
                localNotes.forEach(localN => {
                    if (!mergedNotes.some(cloudN => cloudN.id === localN.id)) {
                        mergedNotes.push(localN);
                        merged = true;
                    }
                });
                state.notes = mergedNotes;
            } else if (state.notes && state.notes.length > 0) {
                merged = true;
            }
            
            if (data.reminders && data.reminders.length > 0) {
                const localReminders = state.reminders || [];
                const mergedReminders = [...data.reminders];
                localReminders.forEach(localR => {
                    if (!mergedReminders.some(cloudR => cloudR.id === localR.id)) {
                        mergedReminders.push(localR);
                        merged = true;
                    }
                });
                state.reminders = mergedReminders;
            } else if (state.reminders && state.reminders.length > 0) {
                merged = true;
            }
            
            if (data.tasks && data.tasks.length > 0) {
                const localTasks = state.tasks || [];
                const mergedTasks = [...data.tasks];
                localTasks.forEach(localT => {
                    if (!mergedTasks.some(cloudT => cloudT.id === localT.id)) {
                        mergedTasks.push(localT);
                        merged = true;
                    }
                });
                state.tasks = mergedTasks;
            } else if (state.tasks && state.tasks.length > 0) {
                merged = true;
            }
            
            if (data.courses && data.courses.length > 0) {
                state.courses = data.courses;
            } else if (state.courses && state.courses.length > 0) {
                merged = true;
            }
            
            if (data.smm && data.smm.length > 0) {
                const localSmm = state.smm || [];
                const mergedSmm = [...data.smm];
                localSmm.forEach(localS => {
                    if (!mergedSmm.some(cloudS => cloudS.id === localS.id)) {
                        mergedSmm.push(localS);
                        merged = true;
                    }
                });
                state.smm = mergedSmm;
            } else if (state.smm && state.smm.length > 0) {
                merged = true;
            }
            
            if (merged) {
                saveState(); // sync merged state back to Firebase
            }
            
            // Re-render everything after cloud load
            renderDashboard();
            if (typeof renderGroupsView === 'function') renderGroupsView();
            if (typeof renderCoursesView === 'function') renderCoursesView();
            updateSidebarBadges();
        } else {
            // New database setup - upload local state
            saveState();
        }
    } catch (e) {
        console.error("Error loading from Firestore", e);
    }
}

function saveState() {
    localStorage.setItem('edu_groups', JSON.stringify(state.groups));
    localStorage.setItem('edu_notes', JSON.stringify(state.notes));
    localStorage.setItem('edu_reminders', JSON.stringify(state.reminders));
    localStorage.setItem('edu_tasks', JSON.stringify(state.tasks));
    localStorage.setItem('edu_courses', JSON.stringify(state.courses));
    localStorage.setItem('edu_smm', JSON.stringify(state.smm));
    
    // Sync with Firebase
    saveStateToFirestore();
    
    // Save moodboard to IndexedDB instead of LocalStorage to prevent 5MB storage limit crashes!
    saveMoodboardToDB(state.moodboard || []).catch(err => {
        console.error("IndexedDB error saving moodboard:", err);
    });
    
    updateSidebarBadges();
}

function initIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Navigation
function initViewNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');
            switchView(view);
        });
    });
}

function switchView(viewId) {
    state.currentView = viewId;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const targetView = document.getElementById(`${viewId}-view`);
    const targetNav = document.querySelector(`.nav-item[data-view="${viewId}"]`);
    
    if (targetView) targetView.classList.add('active');
    if (targetNav) targetNav.classList.add('active');

    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        if (viewId === 'dashboard') {
            appContainer.classList.remove('right-panel-hidden');
            renderRightPanel();
        } else {
            appContainer.classList.add('right-panel-hidden');
        }
    }

    // Dynamic Top Header Action Button
    const headerBtn = document.getElementById('global-header-action-btn');
    const headerIcon = document.getElementById('global-header-icon');
    const headerText = document.getElementById('global-header-text');

    if (headerBtn && headerIcon && headerText) {
        if (viewId === 'groups') {
            headerBtn.style.display = 'flex';
            headerIcon.setAttribute('data-lucide', 'plus');
            headerText.textContent = "Guruh Qo'shish";
            headerBtn.onclick = () => showAddGroupModal();
        } else if (viewId === 'courses') {
            headerBtn.style.display = 'flex';
            headerIcon.setAttribute('data-lucide', 'plus');
            headerText.textContent = "Darslik Qo'shish";
            headerBtn.onclick = () => showAddCourseModal();
        } else if (viewId === 'marketing') {
            headerBtn.style.display = 'flex';
            headerIcon.setAttribute('data-lucide', 'plus');
            headerText.textContent = "Yangi post qo'shish";
            headerBtn.onclick = () => showAddSmmPostModal();
        } else if (viewId === 'edu-tasks') {
            headerBtn.style.display = 'flex';
            headerIcon.setAttribute('data-lucide', 'plus');
            headerText.textContent = "Yangi vazifa qo'shish";
            headerBtn.onclick = () => openAddCategoryTaskModal('edu');
        } else if (viewId === 'marketing-tasks') {
            headerBtn.style.display = 'flex';
            headerIcon.setAttribute('data-lucide', 'plus');
            headerText.textContent = "Yangi vazifa qo'shish";
            headerBtn.onclick = () => openAddCategoryTaskModal('marketing');
        } else {
            // Hide for dashboard, moodboard, etc.
            headerBtn.style.display = 'none';
        }
    }

    // View specific renders
    if (viewId === 'dashboard') renderDashboard();
    if (viewId === 'groups') renderGroupsView();
    if (viewId === 'notes') renderNotesView();
    if (viewId === 'reminders') renderRemindersView();
    if (viewId === 'courses') { renderCoursesView(); }
    if (viewId === 'marketing') { renderMarketingView(); }
    if (viewId === 'edu-tasks') { renderCategoryTasks('edu'); }
    if (viewId === 'marketing-tasks') { renderCategoryTasks('marketing'); }
    if (viewId === 'moodboard') renderMoodboardView();

    initIcons();
}

// Scheduling Logic
function calculateSchedule(startDate, durationMonths, frequency, courseId, skippedDates = []) {
    let lessons = [];
    let currentDate = new Date(startDate);
    
    // Fallback to computer_literacy if not found
    const course = state.courses.find(c => c.id === courseId) || state.courses[0];
    const totalLessons = course.totalLessons;
    
    const allowedDays = frequency === '1-3-5' ? [1, 3, 5] : [2, 4, 6];
    
    let count = 0;
    while (count < totalLessons) {
        let dayOfWeek = currentDate.getDay();
        
        // Convert currentDate to a consistent string format for comparison (YYYY-M-D)
        const dateKey = currentDate.getFullYear() + '-' + (currentDate.getMonth()+1) + '-' + currentDate.getDate();
        
        if (allowedDays.includes(dayOfWeek)) {
            // Check if this date was skipped
            if (skippedDates.includes(dateKey)) {
                // If it's a skipped date, we just move to the next day without counting a lesson
            } else {
                const courseLesson = course.lessons[count] || { topic: `Mavzu: ${count + 1}-dars`, hours: "2 soat", materials: [] };
                
                // Remove time logic from date comparison so it purely checks days safely
                const today = new Date();
                today.setHours(0,0,0,0);
                const lessonDate = new Date(currentDate);
                lessonDate.setHours(0,0,0,0);
                
                lessons.push({
                    index: count + 1,
                    date: new Date(currentDate),
                    topic: courseLesson.topic,
                    hours: courseLesson.hours || "2 soat",
                    materials: JSON.parse(JSON.stringify(courseLesson.materials || [])), // deep copy
                    completed: today > lessonDate // completed if today is strictly past the lesson date
                });
                count++;
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return lessons;
}

function isGroupLive(group) {
    if (!group || !group.lessons || !group.time) return false;
    const today = new Date();
    const todayDateStr = today.toDateString();
    
    // Guruhning bugun darsi bormi?
    const hasLessonToday = group.lessons.some(lesson => {
        const lessonDate = new Date(lesson.date);
        const dateKey = lessonDate.getFullYear() + '-' + (lessonDate.getMonth()+1) + '-' + lessonDate.getDate();
        const hasDateMatch = lessonDate.toDateString() === todayDateStr;
        const isSkipped = group.skippedDates && (group.skippedDates.includes(dateKey) || group.skippedDates.includes(lesson.date));
        return hasDateMatch && !isSkipped;
    });
    
    if (!hasLessonToday) return false;
    
    // Dars vaqtini tekshirish, masalan group.time = "11:00"
    const [startHours, startMinutes] = group.time.split(':').map(Number);
    const startDateTime = new Date(today);
    startDateTime.setHours(startHours, startMinutes, 0, 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(startDateTime.getHours() + 2); // 2 soat davom etadi
    
    return today >= startDateTime && today <= endDateTime;
}

// Rendering Functions
function renderDashboard() {
    // === Render Stats Cards ===
    const statsGrid = document.getElementById('dash-stats-grid');
    if (statsGrid) {
        const totalGroups = (state.groups || []).length;
        const allTasks = (state.tasks || []);
        const pendingTasks = allTasks.filter(t => !t.completed).length;
        const completedTasks = allTasks.filter(t => t.completed).length;
        
        statsGrid.innerHTML = `
            <div class="dash-stat-card">
                <div class="dash-stat-icon" style="background: #eff6ff; color: #3b82f6;">
                    <i data-lucide="users"></i>
                </div>
                <div>
                    <div class="dash-stat-value">${totalGroups}</div>
                    <div class="dash-stat-label">Jami guruhlar</div>
                </div>
            </div>
            <div class="dash-stat-card">
                <div class="dash-stat-icon" style="background: #fef3c7; color: #f59e0b;">
                    <i data-lucide="clock"></i>
                </div>
                <div>
                    <div class="dash-stat-value">${pendingTasks}</div>
                    <div class="dash-stat-label">Jarayondagi vazifalar</div>
                </div>
            </div>
            <div class="dash-stat-card">
                <div class="dash-stat-icon" style="background: #dcfce7; color: #22c55e;">
                    <i data-lucide="check-circle"></i>
                </div>
                <div>
                    <div class="dash-stat-value">${completedTasks}</div>
                    <div class="dash-stat-label">Bajarilgan vazifalar</div>
                </div>
            </div>
        `;
    }

    const coursesGrid = document.getElementById('dash-my-courses-grid');
    if (coursesGrid) {
        coursesGrid.innerHTML = '';
        
        const today = new Date().toDateString();
        
        // Filter groups to ONLY those that have a lesson scheduled for today
        const todayGroups = state.groups.filter(group => {
            return group.lessons.some(lesson => new Date(lesson.date).toDateString() === today && !group.skippedDates?.includes(lesson.date));
        });
        
        if (todayGroups.length === 0) {
            coursesGrid.innerHTML = '<div style="padding: 20px; color: var(--text-muted); font-size: 14px;">Bugun dars o\'tiladigan guruhlar yo\'q. 🎉 Hordiq chiqaring!</div>';
        }

        let completedTotal = 0;
        let lessonsToday = todayGroups.length;

        coursesGrid.style.cssText = "display: flex; gap: 20px; overflow-x: auto; padding-bottom: 16px; scrollbar-width: none;";

        todayGroups.forEach(group => {
            const nextLesson = group.lessons.find(l => !l.completed) || group.lessons[group.lessons.length-1];
            const progress = group.lessons.length > 0 ? Math.round((group.lessons.filter(l => l.completed).length / group.lessons.length) * 100) : 0;
            completedTotal += progress;

            const card = document.createElement('div');
            card.style.cssText = "min-width: 260px; background: white; border-radius: 16px; padding: 20px; box-shadow: var(--shadow-sm); border: 1px solid var(--border); flex-shrink: 0; cursor: pointer; transition: transform 0.2s;";
            card.onmouseenter = () => card.style.transform = 'translateY(-4px)';
            card.onmouseleave = () => card.style.transform = 'translateY(0)';
            card.onclick = () => switchView('groups');

            const isDesign = group.color === '#a855f7' || group.courseId === 'graphic_design';
            
            // Get today's lesson details
            const todaysLesson = group.lessons.find(l => new Date(l.date).toDateString() === today && !group.skippedDates?.includes(l.date));
            const lessonInfoHtml = todaysLesson ? `
                <div style="font-size: 12px; font-weight: 700; color: ${isDesign ? '#8b5cf6' : '#2563eb'}; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 8px; flex-direction: column;">
                    <span style="background: ${isDesign ? '#f3e8ff' : '#eff6ff'}; padding: 4px 8px; border-radius: 6px; font-size: 11px;">${todaysLesson.index}-dars</span>
                    <span style="color: var(--text-main); font-weight: 600; line-height: 1.4;" title="${todaysLesson.topic}">${todaysLesson.topic}</span>
                </div>
            ` : `
                <div style="font-size: 12px; font-weight: 700; color: ${isDesign ? '#8b5cf6' : '#2563eb'}; margin-bottom: 16px;">
                    ${group.duration} oylik kurs
                </div>
            `;
            
            const isLive = isGroupLive(group);
            const liveBadgeHtml = isLive ? `
                <div class="live-badge" style="margin-left: auto; flex-shrink: 0;">
                    <span class="live-dot"></span> LIVE
                </div>
            ` : '';
            
            card.innerHTML = `
                <div style="display: flex; gap: 12px; margin-bottom: 16px; align-items: center; justify-content: space-between;">
                    <div style="width: 44px; height: 44px; border-radius: 10px; background: ${isDesign ? '#f3e8ff' : '#eff6ff'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <span style="font-size: 22px;">${isDesign ? '🎨' : '💻'}</span>
                    </div>
                    <div style="flex: 1; min-width: 0; padding-right: 4px;">
                        <h3 style="font-size: 14px; font-weight: 800; color: var(--text-main); margin-bottom: 2px; line-height: 1.3;" title="${group.courseName || group.name}">${group.courseName || group.name}</h3>
                        <p style="font-size: 11px; color: var(--text-muted); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${group.name}</p>
                    </div>
                    ${liveBadgeHtml}
                </div>
                ${lessonInfoHtml}
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); font-weight: 600; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 4px;"><i data-lucide="calendar" style="width: 14px; height: 14px;"></i> ${group.frequency === '1-3-5' ? 'Toq' : 'Juft'}</div>
                    <div style="display: flex; align-items: center; gap: 4px;"><i data-lucide="clock" style="width: 14px; height: 14px;"></i> ${group.time}</div>
                    <div style="display: flex; align-items: center; gap: 4px;"><i data-lucide="book-open" style="width: 14px; height: 14px;"></i> ${group.lessons.length}</div>
                </div>
                <div style="width: 100%; height: 4px; background: #f1f5f9; border-radius: 2px; margin-bottom: 8px; overflow: hidden;">
                    <div style="width: ${progress}%; height: 100%; background: ${group.color || 'var(--primary)'}; border-radius: 2px;"></div>
                </div>
                <div style="font-size: 12px; color: var(--text-muted); font-weight: 700;">
                    Completed: ${progress}%
                </div>
            `;
            coursesGrid.appendChild(card);
        });
    }

    // Render SMM items in Dashboard (List style)
    const dashSmmGrid = document.getElementById('dash-smm-grid');
    if (dashSmmGrid) {
        dashSmmGrid.innerHTML = '';
        // Change from grid to flex column for vertical list
        dashSmmGrid.style.display = 'flex';
        dashSmmGrid.style.flexDirection = 'column';
        dashSmmGrid.style.gap = '12px';

        const inProgressSmm = (state.smm || []).filter(p => p.status === 'progress' || (!p.status && !p.published));
        
        if (inProgressSmm.length === 0) {
            dashSmmGrid.innerHTML = `
                <div style="padding: 16px; color: var(--text-muted); font-size: 13px; font-style: italic;">
                    Jarayonda SMM postlar mavjud emas
                </div>
            `;
        } else {
            const icons = ['📢', '🎨', '🔥', '💡', '🚀'];
            const bgColors = ['#fefce8', '#f3e8ff', '#ffe4e6', '#e0f2fe', '#dcfce7'];

            inProgressSmm.slice(0, 4).forEach((post, i) => {
                const formattedTime = post.datetime ? formatSmmDateTime(post.datetime) : 'Muddat yo\'q';
                const icon = icons[i % icons.length];
                const bg = bgColors[i % bgColors.length];
                
                const div = document.createElement('div');
                div.style.cssText = "background: white; border-radius: 16px; padding: 16px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; transition: all 0.2s;";
                div.onmouseenter = () => { div.style.transform = 'translateY(-2px)'; div.style.boxShadow = '0 8px 16px rgba(0,0,0,0.06)'; };
                div.onmouseleave = () => { div.style.transform = 'translateY(0)'; div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; };

                div.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 16px; flex: 1;">
                        <div style="width: 48px; height: 48px; border-radius: 12px; background: ${bg}; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">
                            ${icon}
                        </div>
                        <div style="flex: 1;">
                            <h3 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">${post.title}</h3>
                            <div style="font-size: 12px; color: var(--text-muted); font-weight: 500; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; max-width: 300px;">
                                ${post.content ? post.content : 'Tavsif yo\'q'}
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 40px; justify-content: flex-end; flex-shrink: 0;">
                        <div style="text-align: right;">
                            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-bottom: 4px;">Holati</div>
                            <div style="font-size: 13px; font-weight: 700; color: #f59e0b;">Jarayonda</div>
                        </div>
                        
                        <div style="text-align: right; min-width: 120px;">
                            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-bottom: 4px;">Deadline</div>
                            <div style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
                                <i data-lucide="calendar" style="width: 14px; height: 14px; color: var(--text-muted);"></i> ${formattedTime}
                            </div>
                        </div>
                        
                        <button onclick="switchView('marketing')" style="background: none; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 12px; font-weight: 600; color: var(--text-main); cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;" onmouseover="this.style.background='#f8fafc';" onmouseout="this.style.background='none';">
                            <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i> O'tish
                        </button>
                    </div>
                `;
                dashSmmGrid.appendChild(div);
            });
        }
    }

    renderTodayScheduleList();
}

function renderTodayScheduleList() {
    const list = document.getElementById('right-schedule-list');
    if (!list) return;
    list.innerHTML = '';

    const today = new Date().toDateString();
    let hasItems = false;

    // 1. Today's Scheduled Lessons
    state.groups.forEach(group => {
        group.lessons.forEach(lesson => {
            if (new Date(lesson.date).toDateString() === today) {
                hasItems = true;
                const div = document.createElement('div');
                div.style.cssText = "display: flex; align-items: stretch; gap: 16px; margin-bottom: 8px;";
                div.innerHTML = `
                    <div style="font-weight: 800; font-size: 13px; color: var(--text-main); min-width: 45px; text-align: right; padding-top: 4px;">
                        ${group.time}
                    </div>
                    <div style="width: 3px; background: ${group.color || '#a855f7'}; border-radius: 2px;"></div>
                    <div style="flex: 1; padding: 12px 16px; background: linear-gradient(90deg, #fefce8, #fdf4ff); border-radius: 0 12px 12px 0;">
                        <div style="font-weight: 700; font-size: 14px; color: var(--text-main);">${group.name}</div>
                        <div style="font-size: 12px; color: var(--text-muted); font-weight: 500; margin-top: 2px;">${lesson.topic}</div>
                    </div>
                `;
                list.appendChild(div);
            }
        });
    });

    // 2. Today's active tasks (which are not completed)
    const todayTasks = state.tasks.filter(t => t.type === 'today' && !t.completed);
    todayTasks.forEach(task => {
        hasItems = true;
        const div = document.createElement('div');
        div.style.cssText = "display: flex; align-items: stretch; gap: 16px; margin-bottom: 8px;";
        div.innerHTML = `
            <div style="font-weight: 800; font-size: 13px; color: var(--text-muted); min-width: 45px; text-align: right; padding-top: 4px;">
                Vazifa
            </div>
            <div style="width: 3px; background: #e2e8f0; border-radius: 2px;"></div>
            <div style="flex: 1; padding: 12px 16px; background: #f8fafc; border-radius: 0 12px 12px 0;">
                <div style="font-weight: 600; font-size: 13px; color: var(--text-main); display: flex; align-items: flex-start; gap: 8px;">
                    <input type="checkbox" id="dash-task-${task.id}" style="margin-top: 2px;" onchange="toggleTaskStatusFromDashboard('${task.id}')">
                    <label for="dash-task-${task.id}" style="cursor: pointer;">${task.text}</label>
                </div>
            </div>
        `;
        list.appendChild(div);
    });

    if (!hasItems) {
        list.innerHTML = `
            <div style="text-align: center; padding: 20px 0; color: var(--text-muted);">
                <div style="font-size: 13px; font-weight: 600;">Bugun uchun reja yo'q</div>
            </div>
        `;
    }

    initIcons();
}

window.toggleTaskStatusFromDashboard = function(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = true;
        saveState();
        renderDashboard();
        renderRightPanel();
        showToast("Vazifa bajarildi ro'yxatiga o'tkazildi!");
    }
};

function renderRightPanel() {
    // Set date
    const dateEl = document.getElementById('right-panel-date');
    if (dateEl) {
        const now = new Date();
        const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
        dateEl.textContent = `${now.getDate()} ${months[now.getMonth()]}`;
    }

    // Render today's schedule
    const scheduleContainer = document.getElementById('right-panel-today-schedule');
    if (scheduleContainer) {
        scheduleContainer.innerHTML = '';
        const today = new Date().toDateString();

        const todayGroups = state.groups.filter(group => {
            return group.lessons.some(lesson => new Date(lesson.date).toDateString() === today);
        });

        if (todayGroups.length === 0) {
            scheduleContainer.innerHTML = '<div style="padding: 16px 12px; color: var(--text-muted); font-size: 13px; text-align: center;">Bugun dars yo\'q 🎉</div>';
        } else {
            todayGroups.forEach(group => {
                const todaysLesson = group.lessons.find(l => new Date(l.date).toDateString() === today);
                const isDesign = group.courseId === 'graphic_design';
                const isLive = isGroupLive(group);
                
                const item = document.createElement('div');
                item.className = 'right-panel-item';
                item.onclick = () => switchView('groups');
                item.innerHTML = `
                    <div class="right-panel-item-icon" style="background: ${isDesign ? '#f3e8ff' : '#eff6ff'};">
                        ${isDesign ? '🎨' : '💻'}
                    </div>
                    <div class="right-panel-item-text">
                        <h4>${group.name}${isLive ? ' <span style="color:#ef4444;font-size:10px;">● LIVE</span>' : ''}</h4>
                        <p>${todaysLesson ? todaysLesson.topic : group.courseName}</p>
                    </div>
                    <div class="right-panel-item-time">${group.time}</div>
                `;
                scheduleContainer.appendChild(item);
            });
        }

        // Also show upcoming SMM posts
        const upcomingSmm = (state.smm || []).filter(p => p.status === 'progress' || (!p.status && !p.published));
        if (upcomingSmm.length > 0) {
            upcomingSmm.slice(0, 3).forEach(post => {
                const item = document.createElement('div');
                item.className = 'right-panel-item';
                item.onclick = () => switchView('marketing');
                item.innerHTML = `
                    <div class="right-panel-item-icon" style="background: #fef3c7;">📢</div>
                    <div class="right-panel-item-text">
                        <h4>${post.title}</h4>
                        <p>SMM Post</p>
                    </div>
                    <div class="right-panel-item-time" style="color: #f59e0b;">Jarayonda</div>
                `;
                scheduleContainer.appendChild(item);
            });
        }
    }

    // Render tasks
    const tasksContainer = document.getElementById('right-panel-tasks');
    if (tasksContainer) {
        tasksContainer.innerHTML = '';
        const pendingTasks = (state.tasks || []).filter(t => !t.completed);

        if (pendingTasks.length === 0) {
            tasksContainer.innerHTML = '<div style="padding: 16px 12px; color: var(--text-muted); font-size: 13px; text-align: center;">Barcha vazifalar bajarilgan ✅</div>';
        } else {
            pendingTasks.slice(0, 5).forEach(task => {
                const isEdu = task.category === 'edu';
                const item = document.createElement('div');
                item.className = 'right-panel-item';
                item.innerHTML = `
                    <div class="right-panel-item-icon" style="background: ${isEdu ? '#eff6ff' : '#f3e8ff'};">
                        ${isEdu ? '📚' : '📣'}
                    </div>
                    <div class="right-panel-item-text">
                        <h4>${task.text}</h4>
                        <p>${isEdu ? "O'quv vazifasi" : 'Marketing vazifasi'}</p>
                    </div>
                    <input type="checkbox" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary); flex-shrink: 0;" onchange="toggleTaskStatusFromDashboard('${task.id}')">
                `;
                tasksContainer.appendChild(item);
            });
        }
    }

    initIcons();
}

function renderGroupsView() {
    const grid = document.getElementById('all-groups-grid');
    grid.innerHTML = '';
    
    if (state.groups.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Hozircha guruhlar yo\'q. Yangi guruh qo\'shing!</div>';
        return;
    }

    const isGroupCompleted = (g) => g.lessons && g.lessons.length > 0 && g.lessons.every(l => l.completed);
    const completedGroups = state.groups.filter(g => isGroupCompleted(g));
    const activeGroups = state.groups.filter(g => !isGroupCompleted(g));
    
    // Backup & Restore control panel at the top of the grid
    const controlPanel = document.createElement('div');
    controlPanel.style.cssText = "grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid var(--border); padding: 14px 20px; border-radius: var(--radius-lg); margin-bottom: 8px; flex-wrap: wrap; gap: 12px; font-family: 'Outfit', sans-serif;";
    controlPanel.innerHTML = `
        <div style="font-size: 13px; font-weight: 600; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
            <span>🔐</span> Ma'lumotlar xavfsiz saqlanadi. Zahira nusxasi orqali qayta tiklashingiz mumkin.
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
            <button onclick="showCompletedGroupsModal()" class="btn-secondary" style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 8px 16px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: var(--shadow-sm); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.background='#dcfce7';" onmouseout="this.style.transform='none'; this.style.background='#f0fdf4';">
                <i data-lucide="graduation-cap" style="width: 15px; height: 15px; color: #16a34a;"></i> 🎓 Tugallangan guruhlar (${completedGroups.length})
            </button>
            <button onclick="exportSystemBackup()" class="btn-primary" style="background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: var(--shadow-sm); transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='none'">
                <i data-lucide="download" style="width: 14px; height: 14px;"></i> 💾 Zahira nusxa olish
            </button>
            <button onclick="document.getElementById('backup-file-input').click()" class="btn-secondary" style="background: white; border: 1px solid var(--border); padding: 8px 16px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='none'">
                <i data-lucide="upload" style="width: 14px; height: 14px;"></i> 📂 Zahiradan tiklash
            </button>
            <input type="file" id="backup-file-input" style="display: none;" onchange="importSystemBackup(event)" accept=".json">
        </div>
    `;
    grid.appendChild(controlPanel);
    
    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = "grid-column: 1 / -1; width: 100%; overflow-x: auto; background: white; border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow-sm);";
    
    let tableHtml = `
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-family: 'Outfit', sans-serif; font-size: 14px;">
            <thead>
                <tr style="border-bottom: 1px solid var(--border); background: #f8fafc;">
                    <th style="padding: 14px 20px; font-weight: 600; color: var(--text-muted); font-size: 12px; text-transform: uppercase;">Kurs nomi / Guruh</th>
                    <th style="padding: 14px 20px; font-weight: 600; color: var(--text-muted); font-size: 12px; text-transform: uppercase; text-align: center;">O'tilgan darslar</th>
                    <th style="padding: 14px 20px; font-weight: 600; color: var(--text-muted); font-size: 12px; text-transform: uppercase; text-align: center;">Dars kuni</th>
                    <th style="padding: 14px 20px; font-weight: 600; color: var(--text-muted); font-size: 12px; text-transform: uppercase; text-align: center;">Dars vaqti</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (activeGroups.length === 0) {
        tableHtml += `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                    <div style="font-size: 32px; margin-bottom: 8px;">🎉</div>
                    <div style="font-weight: 700; font-size: 15px; color: var(--text-main); margin-bottom: 4px;">Faol guruhlar mavjud emas</div>
                    <div style="font-size: 13px; color: var(--text-muted);">Barcha guruhlarning darslari to'liq o'tilgan va <b>Tugallangan guruhlar</b> bo'limiga o'tkazilgan.</div>
                    ${completedGroups.length > 0 ? `
                    <button onclick="showCompletedGroupsModal()" style="margin-top: 14px; background: #16a34a; color: white; border: none; padding: 8px 18px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: var(--shadow-sm);">
                        <i data-lucide="graduation-cap" style="width: 14px; height: 14px;"></i> Tugallangan guruhlarni ko'rish (${completedGroups.length})
                    </button>` : ''}
                </td>
            </tr>
        `;
    } else {
        activeGroups.forEach(group => {
            const completedCount = group.lessons.filter(l => l.completed).length;
            const totalCount = group.lessons.length;
            
            const isLive = isGroupLive(group);
            const liveIndicatorHtml = isLive ? `
                <span class="live-badge" style="margin-left: 8px; padding: 2px 6px; font-size: 9px; line-height: 1;">
                    <span class="live-dot" style="width: 5px; height: 5px;"></span> LIVE
                </span>
            ` : '';
            
            tableHtml += `
                <tr onclick="viewGroupDetails('${group.id}')" style="cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='#f8fafc';" onmouseout="this.style.background='transparent';">
                    <td style="padding: 14px 20px; display: flex; align-items: center; gap: 14px;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: ${group.color || '#3b82f6'}15; display: flex; align-items: center; justify-content: center; color: ${group.color || '#3b82f6'}; flex-shrink: 0;">
                            <i data-lucide="${group.courseId === 'graphic_design' ? 'palette' : 'monitor'}" style="width: 20px; height: 20px;"></i>
                        </div>
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                <span style="font-weight: 700; font-size: 14px; color: var(--text-main); line-height: 1.4;">${group.name}</span>
                                ${liveIndicatorHtml}
                            </div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px; font-family: monospace; font-weight: 600;">#${group.code || 'Kodsiz'}</div>
                        </div>
                    </td>
                    
                    <td style="padding: 14px 20px; text-align: center;">
                        <span style="font-size: 14px; font-weight: 700; color: var(--text-main);">${completedCount}</span>
                        <span style="font-size: 12px; color: var(--text-muted); font-weight: 500;"> / ${totalCount} ta dars</span>
                    </td>
                    
                    <td style="padding: 14px 20px; text-align: center;">
                        <span style="font-size: 11px; font-weight: 700; color: ${group.frequency === '1-3-5' ? '#c2410c' : '#15803d'}; background: ${group.frequency === '1-3-5' ? '#fff7ed' : '#f0fdf4'}; padding: 4px 10px; border-radius: 6px; display: inline-block;">
                            ${group.frequency === '1-3-5' ? 'Toq kunlar' : 'Juft kunlar'}
                        </span>
                    </td>
                    
                    <td style="padding: 14px 20px; text-align: center;">
                        <span style="font-size: 12px; font-weight: 700; color: #0369a1; background: #e0f2fe; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                            🕒 ${group.time}
                        </span>
                    </td>
                </tr>
            `;
        });
    }
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHtml;
    grid.appendChild(tableContainer);
    
    initIcons();
}

window.showCompletedGroupsModal = function() {
    const isGroupCompleted = (g) => g.lessons && g.lessons.length > 0 && g.lessons.every(l => l.completed);
    const completedGroups = state.groups.filter(g => isGroupCompleted(g));
    
    let contentHtml = `
        <div style="margin-bottom: 18px; border-bottom: 1px solid var(--border); padding-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 38px; height: 38px; border-radius: 10px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                    🎓
                </div>
                <div>
                    <h2 style="font-size: 18px; font-weight: 700; color: var(--text-main); margin: 0; font-family: 'Outfit', sans-serif;">Tugallangan Guruhlar</h2>
                    <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0; font-weight: 500;">Barcha darslari to'liq o'tilgan guruhlar (${completedGroups.length} ta)</p>
                </div>
            </div>
            <button onclick="closeModal()" style="background: none; border: none; font-size: 22px; color: var(--text-muted); cursor: pointer; padding: 4px 8px; border-radius: 6px; line-height: 1;">&times;</button>
        </div>
    `;
    
    if (completedGroups.length === 0) {
        contentHtml += `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <div style="font-size: 36px; margin-bottom: 8px;">📚</div>
                <div style="font-weight: 700; font-size: 15px; color: var(--text-main); margin-bottom: 4px;">Hozircha tugallangan guruhlar yo'q</div>
                <div style="font-size: 13px; max-width: 400px; margin: 0 auto; line-height: 1.5;">Guruhning barcha darslari to'liq o'tilganda (hamma darslarga belgilanganda), u avtomatik tarzda ushbu bo'limga tushadi.</div>
            </div>
            <div class="modal-footer" style="margin-top: 20px; padding-top: 12px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
                <button class="btn-secondary" onclick="closeModal()">Yopish</button>
            </div>
        `;
    } else {
        contentHtml += `
            <div style="max-height: 380px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius-md); background: white;">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-family: 'Outfit', sans-serif; font-size: 13px;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border); background: #f8fafc; position: sticky; top: 0; z-index: 1;">
                            <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); font-size: 11px; text-transform: uppercase;">Kurs / Guruh</th>
                            <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); font-size: 11px; text-transform: uppercase; text-align: center;">Darslar</th>
                            <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); font-size: 11px; text-transform: uppercase; text-align: center;">Kuni & Vaqti</th>
                            <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); font-size: 11px; text-transform: uppercase; text-align: center;">Holati</th>
                            <th style="padding: 12px 16px; font-weight: 600; color: var(--text-muted); font-size: 11px; text-transform: uppercase; text-align: right;">Amallar</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        completedGroups.forEach(group => {
            const completedCount = group.lessons.filter(l => l.completed).length;
            const totalCount = group.lessons.length;
            contentHtml += `
                <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='#f8fafc';" onmouseout="this.style.background='transparent';">
                    <td style="padding: 12px 16px; display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 8px; background: ${group.color || '#3b82f6'}15; display: flex; align-items: center; justify-content: center; color: ${group.color || '#3b82f6'}; flex-shrink: 0;">
                            <i data-lucide="${group.courseId === 'graphic_design' ? 'palette' : 'monitor'}" style="width: 16px; height: 16px;"></i>
                        </div>
                        <div>
                            <div style="font-weight: 700; font-size: 13px; color: var(--text-main);">${group.name}</div>
                            <div style="font-size: 11px; color: var(--text-muted); font-family: monospace;">#${group.code || 'Kodsiz'}</div>
                        </div>
                    </td>
                    <td style="padding: 12px 16px; text-align: center;">
                        <span style="font-size: 13px; font-weight: 700; color: #047857;">${completedCount} / ${totalCount}</span>
                        <div style="font-size: 10px; color: #059669; font-weight: 600;">To'liq o'tilgan</div>
                    </td>
                    <td style="padding: 12px 16px; text-align: center;">
                        <div style="font-size: 11px; font-weight: 600; color: var(--text-main);">${group.frequency === '1-3-5' ? 'Toq kunlar' : 'Juft kunlar'}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">${group.time}</div>
                    </td>
                    <td style="padding: 12px 16px; text-align: center;">
                        <span style="font-size: 11px; font-weight: 700; color: #047857; background: #ecfdf5; padding: 3px 8px; border-radius: 6px; border: 1px solid #a7f3d0; display: inline-flex; align-items: center; gap: 4px;">
                            <i data-lucide="check-check" style="width: 12px; height: 12px;"></i> Tugatilgan
                        </span>
                    </td>
                    <td style="padding: 12px 16px; text-align: right;">
                        <button onclick="closeModal(); viewGroupDetails('${group.id}')" style="background: #eff6ff; border: 1px solid #dbeafe; color: #2563eb; padding: 6px 12px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;">
                            <i data-lucide="eye" style="width: 12px; height: 12px;"></i> Ko'rish
                        </button>
                    </td>
                </tr>
            `;
        });
        
        contentHtml += `
                    </tbody>
                </table>
            </div>
            <div class="modal-footer" style="margin-top: 18px; padding-top: 12px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
                <button class="btn-secondary" onclick="closeModal()">Yopish</button>
            </div>
        `;
    }
    
    openModal(contentHtml);
    initIcons();
};

window.exportSystemBackup = async function() {
    try {
        const backupData = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            groups: state.groups,
            notes: state.notes,
            reminders: state.reminders,
            tasks: state.tasks,
            courses: state.courses,
            smm: state.smm,
            moodboard: []
        };
        
        // Load moodboard from DB first
        try {
            const dbMoodboard = await loadMoodboardFromDB();
            if (dbMoodboard && dbMoodboard.length > 0) {
                backupData.moodboard = dbMoodboard;
            }
        } catch (dbErr) {
            console.error("Moodboard read failed during backup, falling back:", dbErr);
            backupData.moodboard = state.moodboard || [];
        }

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        const formattedDate = new Date().toISOString().slice(0, 10);
        a.download = `eduplan_backup_${formattedDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast("Tizim ma'lumotlari zahira nusxasi yuklab olindi! 💾", "success");
    } catch (err) {
        console.error("Backup error:", err);
        showToast("Zahiralashda xatolik yuz berdi!", "danger");
    }
};

window.importSystemBackup = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);
            if (!backupData.groups || !backupData.courses) {
                throw new Error("Noto'g'ri zahira nusxa fayli.");
            }
            
            // Confirm restore
            openConfirmModal({
                title: "Ma'lumotlarni tiklash",
                message: `Zahira nusxasini (${new Date(backupData.timestamp).toLocaleString()}) tiklashni tasdiqlaysizmi? Amaldagi barcha ma'lumotlar o'rniga yoziladi.`,
                confirmText: "Tiklash",
                onConfirm: async () => {
                    // Update state
                    state.groups = backupData.groups || [];
                    state.notes = backupData.notes || [];
                    state.reminders = backupData.reminders || [];
                    state.tasks = backupData.tasks || [];
                    state.courses = backupData.courses || [];
                    state.smm = backupData.smm || [];
                    if (backupData.moodboard) {
                        state.moodboard = backupData.moodboard;
                    }
                    
                    // Save state
                    saveState();
                    
                    // Also save moodboard to IndexedDB
                    if (backupData.moodboard && backupData.moodboard.length > 0) {
                        try {
                            await saveMoodboardToDB(backupData.moodboard);
                        } catch (dbErr) {
                            console.error("IndexedDB restore error:", dbErr);
                        }
                    }
                    
                    showToast("Tizim ma'lumotlari muvaffaqiyatli tiklandi! 🎉", "success");
                    
                    // Refresh view
                    setTimeout(() => {
                        window.location.reload();
                    }, 800);
                }
            });
        } catch (err) {
            console.error("Import error:", err);
            showToast("Faylni o'qishda yoki tiklashda xatolik!", "danger");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
};

function renderAIView() {
    const container = document.getElementById('ai-tips-container');
    container.innerHTML = '';
    
    AI_INSIGHTS.forEach(tip => {
        const card = document.createElement('div');
        card.className = 'ai-tip-card';
        card.innerHTML = `
            <h3>${tip.title}</h3>
            <p>${tip.content}</p>
        `;
        container.appendChild(card);
    });
}

// Modal System
function openModal(contentHtml) {
    const overlay = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    body.innerHTML = contentHtml;
    overlay.classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

// Event Handlers
function setupEventListeners() {
    document.getElementById('add-group-btn-header').onclick = showAddGroupModal;
    if(document.getElementById('add-group-btn-main')) {
        document.getElementById('add-group-btn-main').onclick = showAddGroupModal;
    }
    document.getElementById('add-reminder-btn').onclick = showAddReminderModal;
    
    // Close modal on click outside
    document.getElementById('modal-overlay').onclick = (e) => {
        if(e.target.id === 'modal-overlay') closeModal();
    };
}

function showAddGroupModal() {
    const html = `
        <h2 style="margin-bottom:24px; font-size: 20px; font-weight: 700; color: var(--text-main); font-family: 'Outfit', sans-serif;">Yangi Guruh Qo'shish</h2>
        <form id="add-group-form">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                <div class="form-group">
                    <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Guruh Nomi</label>
                    <input type="text" id="g-name" placeholder="Masalan: 1-guruh" required style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none;">
                </div>
                <div class="form-group">
                    <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Guruh Kodi</label>
                    <input type="text" id="g-code" placeholder="Masalan: 192/2026-102" required style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none;">
                </div>
            </div>
            <div class="form-group" style="margin-top: 16px;">
                <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Kursni Tanlang</label>
                <select id="g-course-id" onchange="onCourseSelectedInForm()" style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none; height: 47px;">
                    <option value="computer_literacy">Kompyuter savodxonligi (2 oy / 24 dars)</option>
                    <option value="graphic_design">Grafik dizayn (4 oy / 48 dars)</option>
                </select>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-top: 16px;">
                <div class="form-group">
                    <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Davomiyligi (Oylarda)</label>
                    <input type="text" id="g-duration-display" value="2 oy (24 dars)" disabled style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); background: #f1f5f9; cursor: not-allowed; outline: none; height: 47px; font-weight: 600; color: var(--text-main);">
                    <input type="hidden" id="g-duration" value="2">
                </div>
                <div class="form-group">
                    <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Dars Vaqti</label>
                    <select id="g-time" style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none; height: 47px;">
                        <option value="09:00">09:00</option>
                        <option value="11:00">11:00</option>
                        <option value="14:00">14:00</option>
                        <option value="16:00">16:00</option>
                        <option value="18:00">18:00</option>
                    </select>
                </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-top: 16px;">
                <div class="form-group">
                    <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Dars kunlari</label>
                    <select id="g-freq" style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none; height: 47px;">
                        <option value="1-3-5">Toq kunlar (1-3-5)</option>
                        <option value="2-4-6">Juft kunlar (2-4-6)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Boshlanish sanasi</label>
                    <input type="date" id="g-start" value="${new Date().toISOString().split('T')[0]}" required style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none;">
                </div>
            </div>
            <div class="modal-footer" style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" class="btn-secondary" onclick="closeModal()">Bekor qilish</button>
                <button type="submit" class="add-new-btn">Saqlash</button>
            </div>
        </form>
    `;
    openModal(html);
    
    window.onCourseSelectedInForm = function() {
        const courseId = document.getElementById('g-course-id').value;
        const durationDisplay = document.getElementById('g-duration-display');
        const durationHidden = document.getElementById('g-duration');
        if (courseId === 'computer_literacy') {
            durationDisplay.value = "2 oy (24 dars)";
            durationHidden.value = "2";
        } else {
            durationDisplay.value = "4 oy (48 dars)";
            durationHidden.value = "4";
        }
    };

    document.getElementById('add-group-form').onsubmit = (e) => {
        e.preventDefault();
        const courseId = document.getElementById('g-course-id').value;
        const course = state.courses.find(c => c.id === courseId);
        const duration = parseInt(document.getElementById('g-duration').value);
        const freq = document.getElementById('g-freq').value;
        const start = document.getElementById('g-start').value;
        
        const newGroup = {
            id: Date.now().toString(),
            name: document.getElementById('g-name').value,
            code: document.getElementById('g-code').value || '',
            courseId: courseId,
            courseName: course.name,
            color: courseId === 'graphic_design' ? '#a855f7' : '#3b82f6',
            duration: duration,
            time: document.getElementById('g-time').value,
            frequency: freq,
            startDate: start,
            lessons: calculateSchedule(start, duration, freq, courseId)
        };
        state.groups.push(newGroup);
        saveState();
        closeModal();
        showToast("Yangi guruh muvaffaqiyatli qo'shildi!");
        switchView('groups');
    };
}

function showEditGroupModal(groupId) {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;

    const html = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
            <div>
                <h2 style="font-size: 22px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px;">✏️ Guruhni tahrirlash</h2>
                <p style="color: var(--text-muted); font-size: 13px; margin-top: 2px;">${group.name} · ${group.courseName || 'Kompyuter savodxonligi'}</p>
            </div>
            <button onclick="closeModal()" style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-muted); font-size: 14px;"><i data-lucide="x"></i></button>
        </div>
        
        <div class="modal-tabs-header" style="margin-top: 20px;">
            <button class="edit-tab-btn active" id="tab-btn-asosiy" onclick="switchEditTab('asosiy')">📋 Asosiy</button>
            <button class="edit-tab-btn" id="tab-btn-jadval" onclick="switchEditTab('jadval')">📅 Jadval</button>
            <button class="edit-tab-btn" id="tab-btn-mavzular" onclick="switchEditTab('mavzular')">📖 Mavzular</button>
        </div>
        
        <form id="edit-group-form">
            <!-- ASOSIY TAB -->
            <div class="edit-tab-content" id="tab-content-asosiy" style="display: block;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div class="form-group">
                        <label style="font-weight: 600; font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; display: block;">Guruh Nomi</label>
                        <input type="text" id="edit-g-name" value="${group.name}" required style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px; font-weight: 500; font-size: 15px; width: 100%; outline: none;">
                    </div>
                    <div class="form-group">
                        <label style="font-weight: 600; font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; display: block;">Guruh Kodi</label>
                        <input type="text" id="edit-g-code" value="${group.code || ''}" placeholder="Masalan: 192/2026-102" required style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px; font-weight: 500; font-size: 15px; width: 100%; outline: none;">
                    </div>
                </div>
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="font-weight: 600; font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; display: block;">Fan Nomi</label>
                    <input type="text" id="edit-g-course" value="${group.courseName || 'Kompyuter savodxonligi'}" required style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px; font-weight: 500; font-size: 15px; width: 100%; outline: none;">
                </div>
                <div class="form-group">
                    <label style="font-weight: 600; font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; display: block;">Rang</label>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        ${[
                            '#3b82f6', // Blue
                            '#10b981', // Green
                            '#f59e0b', // Yellow
                            '#ef4444', // Red
                            '#8b5cf6', // Purple
                            '#06b6d4', // Turquoise
                            '#f97316', // Orange
                            '#ec4899'  // Pink
                        ].map(color => `
                            <div class="color-picker-dot" data-color="${color}" onclick="selectEditColor('${color}')" style="width: 32px; height: 32px; border-radius: 50%; background: ${color}; cursor: pointer; transition: transform 0.2s; position: relative; ${group.color === color || (!group.color && color === '#3b82f6') ? 'box-shadow: 0 0 0 3px white, 0 0 0 5px #3b82f6;' : ''}"></div>
                        `).join('')}
                    </div>
                    <input type="hidden" id="edit-g-color" value="${group.color || '#3b82f6'}">
                </div>
            </div>
            
            <!-- JADVAL TAB -->
            <div class="edit-tab-content" id="tab-content-jadval" style="display: none;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div class="form-group">
                        <label style="font-weight: 600; font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; display: block;">Boshlanish sanasi</label>
                        <input type="date" id="edit-g-start" value="${group.startDate || ''}" required style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px; font-weight: 500; font-size: 15px; width: 100%; outline: none;">
                    </div>
                    <div class="form-group">
                        <label style="font-weight: 600; font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; display: block;">Davomiylik (Oy)</label>
                        <select id="edit-g-duration" style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px; font-weight: 500; font-size: 15px; width: 100%; outline: none; height: 47px;">
                            <option value="2" ${group.duration === 2 ? 'selected' : ''}>2 oy</option>
                            <option value="4" ${group.duration === 4 ? 'selected' : ''}>4 oy</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="font-weight: 600; font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; display: block;">Dars kunlari</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div id="freq-card-toq" class="freq-card ${group.frequency === '1-3-5' ? 'active' : ''}" onclick="selectEditFreq('1-3-5')" style="border: 2px solid ${group.frequency === '1-3-5' ? 'var(--primary)' : 'var(--border)'}; background: ${group.frequency === '1-3-5' ? '#eef2ff' : 'white'}; border-radius: var(--radius-md); padding: 16px; text-align: center; cursor: pointer; transition: all 0.2s;">
                            <div style="font-weight: 700; color: ${group.frequency === '1-3-5' ? 'var(--primary)' : 'var(--text-main)'}; font-size: 15px;">Toq kunlar</div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Du, Chor, Ju</div>
                        </div>
                        <div id="freq-card-juft" class="freq-card ${group.frequency === '2-4-6' ? 'active' : ''}" onclick="selectEditFreq('2-4-6')" style="border: 2px solid ${group.frequency === '2-4-6' ? 'var(--primary)' : 'var(--border)'}; background: ${group.frequency === '2-4-6' ? '#eef2ff' : 'white'}; border-radius: var(--radius-md); padding: 16px; text-align: center; cursor: pointer; transition: all 0.2s;">
                            <div style="font-weight: 700; color: ${group.frequency === '2-4-6' ? 'var(--primary)' : 'var(--text-main)'}; font-size: 15px;">Juft kunlar</div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Se, Pay, Sha</div>
                        </div>
                    </div>
                    <input type="hidden" id="edit-g-freq" value="${group.frequency || '1-3-5'}">
                </div>
                
                <div class="form-group" style="margin-bottom: 24px;">
                    <label style="font-weight: 600; font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; display: block;">Dars vaqti</label>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        ${['09:00', '11:00', '14:00', '16:00', '18:00'].map(time => `
                            <div class="time-badge-btn" data-time="${time}" onclick="selectEditTime('${time}')" style="flex: 1; min-width: 70px; border: 2px solid ${group.time === time ? 'var(--primary)' : 'var(--border)'}; background: ${group.time === time ? '#eef2ff' : 'white'}; color: ${group.time === time ? 'var(--primary)' : 'var(--text-main)'}; border-radius: var(--radius-md); padding: 10px; font-weight: 700; font-size: 14px; text-align: center; cursor: pointer; transition: all 0.2s;">${time}</div>
                        `).join('')}
                    </div>
                    <input type="hidden" id="edit-g-time" value="${group.time || '09:00'}">
                </div>
                
                <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; display: flex; align-items: flex-start; gap: 10px;">
                    <span style="color: var(--primary); font-size: 16px;">ℹ️</span>
                    <div>
                        <div style="font-size: 12px; font-weight: 500; color: var(--text-muted);">Jadval o'zgartirilsa dars sanalari qayta hisoblanadi.</div>
                        <div style="font-size: 13px; font-weight: 700; color: var(--primary); margin-top: 2px;" id="edit-schedule-stats-summary">
                            Jami ${group.lessons.length} ta dars · ${group.lessons.filter(l => l.topic && l.topic !== '').length} ta dars mavzusi kiritilgan
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- MAVZULAR TAB -->
            <div class="edit-tab-content" id="tab-content-mavzular" style="display: none;">
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">Har qatorda 1 ta mavzu. Dars raqamiga avtomatik birikadi.</p>
                <textarea id="edit-g-topics" oninput="updateTopicsCount()" style="width: 100%; height: 220px; font-family: inherit; font-size: 14px; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none; resize: none; line-height: 1.6;">${group.lessons.map(l => l.topic).join('\n')}</textarea>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-top: 8px;">
                    <span id="edit-topics-count-label">0 ta mavzu</span>
                    <span>${group.lessons.length} ta dars</span>
                </div>
            </div>
            
            <div class="modal-footer" style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border); padding-top: 20px;">
                <button type="button" class="btn-secondary" onclick="closeModal()" style="padding: 10px 24px; font-weight: 600;">Bekor</button>
                <button type="submit" class="add-new-btn" style="padding: 10px 24px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                    <span>💾</span> Saqlash
                </button>
            </div>
        </form>
    `;
    openModal(html);
    initIcons();
    updateTopicsCount();

    document.getElementById('edit-group-form').onsubmit = (e) => {
        e.preventDefault();
        
        const oldDuration = group.duration;
        const oldFreq = group.frequency;
        const oldStart = group.startDate;
        
        const newName = document.getElementById('edit-g-name').value;
        const newCode = document.getElementById('edit-g-code').value || '';
        const newCourse = document.getElementById('edit-g-course').value;
        const newColor = document.getElementById('edit-g-color').value;
        
        const newDuration = parseInt(document.getElementById('edit-g-duration').value);
        const newFreq = document.getElementById('edit-g-freq').value;
        const newStart = document.getElementById('edit-g-start').value;
        const newTime = document.getElementById('edit-g-time').value;
        
        const topicsText = document.getElementById('edit-g-topics').value;
        const inputTopics = topicsText.split('\n').map(l => l.trim()).filter(l => l !== '');
        
        group.name = newName;
        group.code = newCode;
        group.courseName = newCourse;
        group.color = newColor;
        group.time = newTime;
        
        let rescheduled = false;
        if (oldDuration !== newDuration || oldFreq !== newFreq || oldStart !== newStart) {
            group.duration = newDuration;
            group.frequency = newFreq;
            group.startDate = newStart;
            // Recalculate schedule preserving the skipped dates
            group.lessons = calculateSchedule(newStart, newDuration, newFreq, group.courseId, group.skippedDates);
            rescheduled = true;
        }
        
        // Map topics to lessons
        group.lessons.forEach((lesson, index) => {
            if (index < inputTopics.length) {
                lesson.topic = inputTopics[index];
            } else {
                lesson.topic = LESSON_TOPICS[index % LESSON_TOPICS.length];
            }
        });
        
        saveState();
        closeModal();
        
        // Refresh appropriate views
        renderDashboard();
        renderGroupsView();
        renderCalendar();
        
        if (rescheduled) {
            showToast("Guruh ma'lumotlari va dars jadvali yangilandi!");
        } else {
            showToast("Guruh ma'lumotlari muvaffaqiyatli o'zgartirildi!");
        }
    };
}

function deleteGroup(id) {
    state.groups = state.groups.filter(g => g.id !== id);
    saveState();
    closeModal();
    renderGroupsView();
    renderDashboard();
    renderCalendar();
    showToast("Guruh o'chirildi", "warning");
}

// Reminders
window.firedReminders = [];

function renderReminders() {
    const list = document.getElementById('reminders-list');
    if (list) {
        list.innerHTML = '';
        state.reminders.forEach(rem => {
            const div = document.createElement('div');
            div.className = 'reminder-item';
            div.innerHTML = `
                <div class="reminder-check" onclick="deleteReminderDirectly('${rem.id}')"></div>
                <div class="reminder-text">${rem.text}</div>
                <div class="reminder-time">${rem.time}</div>
            `;
            list.appendChild(div);
        });
    }

    if (state.currentView === 'reminders') {
        renderRemindersView();
    }
    
    // Always keep Bugungi Jadval checklist in sync on dashboard view
    renderTodayScheduleList();
}

function renderRemindersView() {
    const grid = document.getElementById('reminders-grid');
    if (!grid) return;
    
    grid.innerHTML = `
        <!-- Yangi eslatma card -->
        <div onclick="showAddReminderModal()" style="border: 2px dashed #cbd5e1; border-radius: var(--radius-lg); padding: 32px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; cursor: pointer; background: #f8fafc; transition: all 0.2s;" onmouseover="this.style.background='#f1f5f9'; this.style.borderColor='var(--primary)';" onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#cbd5e1';">
            <div style="width: 48px; height: 48px; background: #eef2ff; color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                <i data-lucide="plus"></i>
            </div>
            <span style="font-weight: 600; color: var(--text-main); font-size: 15px;">Yangi eslatma qo'shish</span>
        </div>
    `;

    state.reminders.forEach(rem => {
        const card = document.createElement('div');
        card.style.cssText = "background: white; border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); border: 1px solid var(--border); position: relative; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; border-top: 4px solid var(--primary); transition: all 0.2s;";
        card.onmouseover = () => {
            card.style.transform = "translateY(-3px)";
            card.style.boxShadow = "var(--shadow-md)";
        };
        card.onmouseout = () => {
            card.style.transform = "translateY(0)";
            card.style.boxShadow = "var(--shadow-sm)";
        };

        card.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
                    <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main);">Eslatma</h3>
                    <button onclick="deleteReminder('${rem.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='#fee2e2';" onmouseout="this.style.background='none';">
                        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
                <p style="color: #475569; font-size: 14px; line-height: 1.5; font-weight: 500;">${rem.text}</p>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 12px; margin-top: 4px;">
                <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Faol</span>
                <span style="font-size: 12px; color: var(--primary); font-weight: 700; display: flex; align-items: center; gap: 4px;">
                    <i data-lucide="clock" style="width: 12px; height: 12px;"></i>
                    ${rem.time || "Kun bo'yi"}
                </span>
            </div>
        `;
        grid.appendChild(card);
    });

    initIcons();
}

function showAddReminderModal() {
    const html = `
        <h2 style="margin-bottom:24px;">Yangi Eslatma</h2>
        <div class="form-group">
            <label>Matn</label>
            <input type="text" id="rem-text" placeholder="Nima qilish kerak?">
        </div>
        <div class="form-group">
            <label>Vaqt</label>
            <input type="time" id="rem-time">
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Bekor qilish</button>
            <button class="add-new-btn" onclick="saveReminder()">Saqlash</button>
        </div>
    `;
    openModal(html);
}

function saveReminder() {
    const text = document.getElementById('rem-text').value;
    const time = document.getElementById('rem-time').value;
    if(!text) return;
    
    state.reminders.push({ id: Date.now().toString(), text, time });
    saveState();
    closeModal();
    renderReminders();
    showToast("Eslatma saqlandi");
}

function deleteReminder(id) {
    const rem = state.reminders.find(r => r.id === id);
    const textStr = rem ? `"${rem.text}"` : "Ushbu eslatmani";
    openConfirmModal({
        title: "Eslatmani o'chirish",
        message: `${textStr} eslatmasini o'chirishni tasdiqlaysizmi?`,
        confirmText: "O'chirish",
        onConfirm: () => {
            state.reminders = state.reminders.filter(r => r.id !== id);
            saveState();
            closeModal();
            renderReminders();
            showToast("Eslatma o'chirildi", "success");
        }
    });
}

function deleteReminderDirectly(id) {
    state.reminders = state.reminders.filter(r => r.id !== id);
    saveState();
    renderReminders();
    showToast("Eslatma bajarildi", "success");
}

function checkActiveReminders() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${mins}`;

    state.reminders.forEach(rem => {
        if (rem.time === currentTimeStr && !window.firedReminders.includes(rem.id)) {
            window.firedReminders.push(rem.id);

            // 1. Desktop Notification
            if (Notification.permission === "granted") {
                try {
                    new Notification("EduPlanner Eslatma 🔔", {
                        body: rem.text,
                        icon: "https://cdn-icons-png.flaticon.com/512/3119/3119338.png"
                    });
                } catch (e) {
                    console.log("Push error: ", e);
                }
            }

            // 2. Play Audio Alert
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav");
            audio.volume = 0.8;
            audio.play().catch(e => console.log("Sound play block: ", e));

            // 3. Realtime Sliding Overlay Alert
            const overlay = document.createElement('div');
            overlay.style.cssText = "position: fixed; top: 24px; right: 24px; width: 360px; background: rgba(255, 255, 255, 0.95); border-left: 5px solid var(--primary); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); padding: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 8px; backdrop-filter: blur(8px); animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);";
            overlay.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-weight: 700; font-size: 14px; color: var(--primary); display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="bell" style="width: 16px; height: 16px;"></i>
                        TIZIM ESLATMASI
                    </span>
                    <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; color: var(--text-muted); cursor: pointer; padding: 2px;">&times;</button>
                </div>
                <div style="font-weight: 600; font-size: 15px; color: var(--text-main); line-height: 1.4;">${rem.text}</div>
                <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                    <i data-lucide="clock" style="width: 12px; height: 12px;"></i> Vaqti keldi: ${rem.time}
                </div>
            `;
            document.body.appendChild(overlay);
            if (window.lucide) lucide.createIcons();
            
            setTimeout(() => {
                if (overlay.parentNode) overlay.remove();
            }, 10000);
        }
    });
}

// Calendar State
let currentCalMonth = new Date().getMonth();
let currentCalYear = new Date().getFullYear();

// Set up calendar navigation listeners once
setTimeout(() => {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    if (prevBtn && nextBtn) {
        prevBtn.onclick = () => {
            currentCalMonth--;
            if (currentCalMonth < 0) { currentCalMonth = 11; currentCalYear--; }
            renderCalendar();
        };
        nextBtn.onclick = () => {
            currentCalMonth++;
            if (currentCalMonth > 11) { currentCalMonth = 0; currentCalYear++; }
            renderCalendar();
        };
    }
}, 500);

// Calendar
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('current-month');
    if (!grid || !title) return;
    
    const monthsUz = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
    title.textContent = `${monthsUz[currentCalMonth]} ${currentCalYear}`;
    
    grid.innerHTML = '';
    const now = new Date();
    
    const firstDay = new Date(currentCalYear, currentCalMonth, 1).getDay();
    const daysInMonth = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();
    
    // Empty slots for start
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    for(let i=0; i < startOffset; i++) {
        const div = document.createElement('div');
        div.className = 'day empty';
        grid.appendChild(div);
    }
    
    for(let d=1; d <= daysInMonth; d++) {
        const div = document.createElement('div');
        div.className = 'day';
        if(d === now.getDate() && currentCalMonth === now.getMonth() && currentCalYear === now.getFullYear()) {
            div.classList.add('today');
        }
        
        // Mark lessons
        const dayDate = new Date(currentCalYear, currentCalMonth, d).toDateString();
        const hasLesson = state.groups.some(g => g.lessons.some(l => new Date(l.date).toDateString() === dayDate));
        if(hasLesson) div.classList.add('has-lesson');
        
        div.textContent = d;
        div.onclick = () => showCalendarDayLessons(d, currentCalMonth, currentCalYear);
        grid.appendChild(div);
    }
}

// Interactive Calendar Lesson Details Modal
function showCalendarDayLessons(day, month, year) {
    const clickedDate = new Date(year, month, day);
    const clickedDateStr = clickedDate.toDateString();
    
    const dayLessons = [];
    state.groups.forEach(g => {
        g.lessons.forEach(l => {
            if (new Date(l.date).toDateString() === clickedDateStr) {
                dayLessons.push({ groupName: g.name, courseName: g.courseName, time: g.time, lesson: l });
            }
        });
    });
    
    const monthsUz = [
        "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
        "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    ];
    const dateFormatted = `${day}-${monthsUz[month]}, ${year}`;
    
    if (dayLessons.length === 0) {
        const html = `
            <div style="text-align: center; padding: 12px 0;">
                <div style="width: 56px; height: 56px; background: #f1f5f9; color: var(--text-muted); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; font-size: 24px;">
                    <i data-lucide="calendar"></i>
                </div>
                <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">${dateFormatted}</h2>
                <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px; padding: 0 16px;">
                    Bu kunda hech qanday dars rejalashtirilmagan.
                </p>
                <button class="add-new-btn" onclick="closeModal()" style="margin: 0 auto; padding: 10px 24px;">Yopish</button>
            </div>
        `;
        openModal(html);
        initIcons();
        return;
    }
    
    const html = `
        <div style="padding: 12px 0;">
            <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                📅 ${dateFormatted} darslari
            </h2>
            <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 20px;">Dars jadvali va joriy mavzular ro'yxati</p>
            
            <div style="display: flex; flex-direction: column; gap: 12px; max-height: 320px; overflow-y: auto;">
                ${dayLessons.map(dl => `
                    <div style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                        <div>
                            <div style="font-weight: 700; font-size: 15px; color: var(--text-main);">${dl.groupName}</div>
                            <div style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">${dl.courseName || 'Kompyuter Savodxonligi'}</div>
                            <div style="font-size: 12px; font-weight: 600; color: var(--primary); margin-top: 6px; display: flex; align-items: center; gap: 4px;">
                                <i data-lucide="book-open" style="width: 12px; height: 12px;"></i>
                                Dars ${dl.lesson.index}: ${dl.lesson.topic}
                            </div>
                        </div>
                        <div style="text-align: right; min-width: 90px;">
                            <div style="font-size: 14px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 4px; justify-content: flex-end;">
                                <i data-lucide="clock" style="width: 14px; height: 14px; color: var(--primary);"></i>
                                ${dl.time}
                            </div>
                            <div style="font-size: 11px; margin-top: 6px; font-weight: 600; padding: 3px 8px; border-radius: 10px; display: inline-block; ${dl.lesson.completed ? 'background: #d1fae5; color: #065f46;' : 'background: #fef3c7; color: #92400e;'}">
                                ${dl.lesson.completed ? "O'tildi" : "Kutilmoqda"}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
                <button class="add-new-btn" onclick="closeModal()" style="padding: 10px 24px;">Yopish</button>
            </div>
        </div>
    `;
    openModal(html);
    initIcons();
}

// Toast
function showToast(msg, type = "success") {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeft = `4px solid ${type === 'success' ? '#10b981' : '#ef4444'}`;
    toast.innerHTML = `<span>${msg}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Global functions for inline onclicks
window.deleteGroup = deleteGroup;
window.deleteReminder = deleteReminder;
window.deleteReminderDirectly = deleteReminderDirectly;
window.closeModal = closeModal;
window.saveReminder = saveReminder;
window.showCalendarDayLessons = showCalendarDayLessons;
window.showAddReminderModal = showAddReminderModal;
window.switchView = switchView;
window.renderTodayScheduleList = renderTodayScheduleList;
window.skipLessonDate = function(groupId, dateStr) {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;
    
    // Initialize skippedDates if it doesn't exist
    if (!group.skippedDates) {
        group.skippedDates = [];
    }
    
    openConfirmModal({
        title: "Dars kunini bekor qilish",
        message: `Ushbu sanadagi (${dateStr}) darsni o'tilmagan deb hisoblash va dasturni keyingi kunga surishni tasdiqlaysizmi?`,
        confirmText: "Surish",
        onConfirm: () => {
            const d = new Date(dateStr);
            const dateKey = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
            
            if (!group.skippedDates.includes(dateKey)) {
                group.skippedDates.push(dateKey);
            }
            
            // Recalculate lessons schedule with the skipped dates
            group.lessons = calculateSchedule(group.startDate, group.duration, group.frequency, group.courseId, group.skippedDates);
            saveState();
            closeModal(); // Close confirm modal
            
            // Re-open details to see updated schedule
            viewGroupDetails(groupId);
            
            // Refresh underlying views
            if (state.currentView === 'groups') renderGroupsView();
            if (state.currentView === 'dashboard') renderDashboard();
            
            showToast("Dars kuni bekor qilindi va qolgan darslar surildi!", "warning");
        }
    });
};

window.viewGroupDetails = (id) => {
    const group = state.groups.find(g => g.id === id);
    if (!group) return;
    
    const completedCount = group.lessons.filter(l => l.completed).length;
    const totalCount = group.lessons.length;
    const remainingCount = totalCount - completedCount;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    const nextLesson = group.lessons.find(l => !l.completed);
    const nextLessonDateStr = nextLesson ? formatDateUz(nextLesson.date) : 'Tugadi';
    const nextLessonTopic = nextLesson ? nextLesson.topic : 'Kurs muvaffaqiyatli yakunlandi! 🎉';

    const html = `
        <div style="margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex: 1;">
                    <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${group.color || '#3b82f6'}; flex-shrink: 0;"></span>
                    <h2 style="font-size: 20px; font-weight: 700; margin: 0; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${group.name}</h2>
                </div>
                <div style="display: flex; gap: 8px; flex-shrink: 0;">
                    <button onclick="closeModal(); showEditGroupModal('${group.id}')" style="background: #fff7ed; border: 1px solid #ffedd5; color: #ea580c; padding: 6px 12px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;"><i data-lucide="edit" style="width: 14px; height: 14px;"></i> Tahrirlash</button>
                    <button onclick="closeModal(); confirmDeleteGroup('${group.id}')" style="background: #fef2f2; border: 1px solid #fee2e2; color: #ef4444; padding: 6px 12px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> O'chirish</button>
                </div>
            </div>
            <p style="color: var(--text-muted); font-size: 13px; margin-top: 8px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 0;">
                📚 Kurs: ${group.courseName || 'Kompyuter savodxonligi'} &nbsp;|&nbsp; #️⃣ Kod: ${group.code || 'Kodsiz'} &nbsp;|&nbsp; 🕒 ${group.time} (${group.frequency === '1-3-5' ? 'Toq kunlar' : 'Juft kunlar'})
            </p>
        </div>

        ${totalCount > 0 && completedCount === totalCount ? `
        <div style="margin-bottom: 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--radius-md); padding: 12px 16px; display: flex; align-items: center; gap: 10px; color: #047857; font-size: 13px; font-weight: 600;">
            <span style="font-size: 18px;">🎓</span>
            <div>
                <div>Guruh kursi muvaffaqiyatli yakunlangan!</div>
                <div style="font-size: 11px; font-weight: 500; color: #059669; margin-top: 2px;">Barcha darslar to'liq o'tilganligi sababli, guruh avtomatik "Tugallangan guruhlar" bo'limiga kiritilgan.</div>
            </div>
        </div>
        ` : ''}

        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px;">
            <div style="background: #f8fafc; border: 1px solid var(--border); padding: 12px; border-radius: var(--radius-md); text-align: center;">
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Jami Darslar</div>
                <div style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-top: 4px;">${totalCount} ta</div>
            </div>
            <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 12px; border-radius: var(--radius-md); text-align: center;">
                <div style="font-size: 11px; color: #059669; font-weight: 600; text-transform: uppercase;">O'tildi</div>
                <div style="font-size: 20px; font-weight: 700; color: #047857; margin-top: 4px;">${completedCount} ta</div>
            </div>
            <div style="background: #fff7ed; border: 1px solid #ffedd5; padding: 12px; border-radius: var(--radius-md); text-align: center;">
                <div style="font-size: 11px; color: #d97706; font-weight: 600; text-transform: uppercase;">Qoldi</div>
                <div style="font-size: 20px; font-weight: 700; color: #b45309; margin-top: 4px;">${remainingCount} ta</div>
            </div>
        </div>

        <!-- Progress -->
        <div style="margin-bottom: 20px; background: #f8fafc; border: 1px solid var(--border); padding: 16px; border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">
                <span>Kurs progressi:</span>
                <span>${progressPercent}%</span>
            </div>
            <div style="width: 100%; background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 6px;">
                <div style="width: ${progressPercent}%; background: ${group.color || 'var(--primary)'}; height: 100%; border-radius: 4px; transition: width 0.3s;"></div>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 500;">
                Keyingi dars: <strong style="color: var(--text-main);">${nextLessonDateStr}</strong> (${nextLessonTopic})
            </div>
        </div>

        <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 12px; color: var(--text-main);">Darslar Jadvali</h3>
        <div style="max-height: 200px; overflow-y: auto; padding-right: 6px; border: 1px solid var(--border); border-radius: var(--radius-md); background: #f8fafc;">
            ${group.lessons.map(l => {
                const isPast = l.completed;
                return `
                    <div style="display:flex; align-items: center; padding:10px 14px; border-bottom:1px solid var(--border); background: ${isPast ? '#f0fdf4' : 'transparent'};">
                        <input type="checkbox" class="lesson-complete-checkbox" data-index="${l.index}" ${isPast ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer; flex-shrink: 0; margin-right: 12px;">
                        <div style="flex: 1; overflow: hidden;">
                            <div style="font-weight:600; font-size: 13px; color: var(--text-main); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">Dars ${l.index}: ${l.topic}</div>
                            <div style="font-size:11px; color:var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                                <i data-lucide="calendar" style="width: 11px; height: 11px;"></i> ${new Date(l.date).toLocaleDateString()}
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                            <button onclick="changeGroupLessonTopic('${group.id}', ${l.index})" style="background: #eff6ff; border: 1px solid #dbeafe; color: #2563eb; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 2px;" title="Mavzuni o'zgartirish">
                                <i data-lucide="edit-3" style="width: 10px; height: 10px;"></i> Sozlash
                            </button>
                            <button onclick="skipLessonDate('${group.id}', '${l.date}')" style="background: #fef2f2; border: 1px solid #fee2e2; color: #ef4444; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; font-weight: 600; display: flex; align-items: center; gap: 2px;" title="Dars bo'lmadi (Surish)">
                                <i data-lucide="calendar-x-2" style="width: 10px; height: 10px;"></i> Qoldirish
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="modal-footer" style="margin-top: 20px; padding-top: 12px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 12px;">
            <button class="btn-secondary" onclick="closeModal()">Yopish</button>
            <button class="btn-primary" onclick="saveGroupLessonCompletion('${group.id}')" style="padding: 10px 24px; font-weight: 600; background: var(--primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; display: flex; align-items: center; gap: 6px;">
                <span>💾</span> Saqlash
            </button>
        </div>
    `;
    openModal(html);
    initIcons();
};

window.saveGroupLessonCompletion = (groupId) => {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;
    
    const checkboxes = document.querySelectorAll('.lesson-complete-checkbox');
    checkboxes.forEach(cb => {
        const index = parseInt(cb.getAttribute('data-index'));
        const lesson = group.lessons.find(l => l.index === index);
        if (lesson) {
            lesson.completed = cb.checked;
        }
    });
    
    saveState();
    updateSidebarBadges();
    closeModal();
    viewGroupDetails(groupId);
    if (state.currentView === 'groups') renderGroupsView();
    if (state.currentView === 'dashboard') renderDashboard();
    showToast("Darslar holati muvaffaqiyatli saqlandi!", "success");
};

window.changeGroupLessonTopic = (groupId, lessonIndex) => {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;
    const lesson = group.lessons.find(l => l.index === lessonIndex);
    if (!lesson) return;
    
    const course = state.courses.find(c => c.id === group.courseId);
    const courseTopics = course ? course.lessons.map(l => l.topic) : [];
    
    let topicsOptions = courseTopics.map(t => `<option value="${t.replace(/"/g, '&quot;')}" ${t === lesson.topic ? 'selected' : ''}>${t}</option>`).join('');
    
    const html = `
        <h2 style="font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 8px; font-family: 'Outfit', sans-serif;">Dars Mavzusini Sozlash</h2>
        <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 20px;">
            Guruh: <strong>${group.name}</strong> · Dars №${lessonIndex}
        </p>
        
        <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">Darslikdan mavzuni tanlash</label>
            <select id="select-lesson-topic" onchange="document.getElementById('custom-lesson-topic').value = this.value" style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 14px; outline: none; background: white; height: 47px;">
                <option value="">-- Darslik mavzusini tanlang --</option>
                ${topicsOptions}
            </select>
        </div>
        
        <div style="margin-bottom: 24px;">
            <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">Yoki yangi mavzuni qo'lda yozing</label>
            <input type="text" id="custom-lesson-topic" value="${lesson.topic.replace(/"/g, '&quot;')}" style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 14px; outline: none;">
        </div>
        
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border); padding-top: 16px;">
            <button class="btn-secondary" onclick="closeModal(); viewGroupDetails('${groupId}')">Bekor qilish</button>
            <button class="btn-primary" onclick="saveGroupLessonTopic('${groupId}', ${lessonIndex})" style="padding: 10px 24px; font-weight: 600; background: var(--primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; display: flex; align-items: center; gap: 6px;">
                <span>💾</span> Mavzuni saqlash
            </button>
        </div>
    `;
    
    openModal(html);
    if (window.lucide) lucide.createIcons();
};

window.saveGroupLessonTopic = (groupId, lessonIndex) => {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;
    const lesson = group.lessons.find(l => l.index === lessonIndex);
    if (!lesson) return;
    
    const newTopic = document.getElementById('custom-lesson-topic').value.trim();
    if (!newTopic) {
        showToast("Mavzu bo'sh bo'lishi mumkin emas!", "danger");
        return;
    }
    
    lesson.topic = newTopic;
    saveState();
    closeModal();
    viewGroupDetails(groupId);
    showToast(`Dars mavzusi muvaffaqiyatli o'zgartirildi!`, "success");
};

// Notes System
function renderNotesView() {
    const list = document.getElementById('notes-list');
    list.innerHTML = '';
    
    state.notes.forEach(note => {
        const div = document.createElement('div');
        div.className = `note-item ${state.selectedNote && state.selectedNote.id === note.id ? 'active' : ''}`;
        div.innerHTML = `
            <div style="font-weight:600; font-size:14px; margin-bottom:4px;">${note.title || 'Sarlavhasiz qayd'}</div>
            <div style="font-size:12px; color:var(--text-muted)">${new Date(note.date).toLocaleDateString()}</div>
        `;
        div.onclick = () => selectNote(note.id);
        list.appendChild(div);
    });

    if (state.selectedNote) {
        renderEditor();
    } else {
        const editor = document.getElementById('note-editor');
        if (editor) editor.innerHTML = '<div class="placeholder-editor">Qaydni tanlang yoki yangisini yarating</div>';
    }
}

function selectNote(id) {
    state.selectedNote = state.notes.find(n => n.id === id);
    renderNotesView();
}

function renderEditor() {
    const editor = document.getElementById('note-editor');
    editor.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
            <input type="text" id="note-title-input" value="${state.selectedNote.title}" placeholder="Sarlavha..." style="font-size:24px; font-weight:700; border:none; outline:none; width:80%;">
            <button onclick="deleteNote('${state.selectedNote.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;"><i data-lucide="trash-2"></i></button>
        </div>
        <textarea id="note-content-input" placeholder="Bu yerga biror nima yozing..." style="width:100%; height:calc(100% - 100px); border:none; outline:none; resize:none; font-size:16px; line-height:1.6;">${state.selectedNote.content}</textarea>
    `;
    
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');
    
    const autoSave = () => {
        state.selectedNote.title = titleInput.value;
        state.selectedNote.content = contentInput.value;
        state.selectedNote.date = new Date().toISOString();
        saveState();
        const activeItem = document.querySelector('.note-item.active');
        if(activeItem) {
            activeItem.querySelector('div:first-child').textContent = titleInput.value || 'Sarlavhasiz qayd';
        }
    };

    titleInput.oninput = autoSave;
    contentInput.oninput = autoSave;
    initIcons();
}

if (document.getElementById('add-note-btn')) {
    document.getElementById('add-note-btn').onclick = () => {
        const newNote = {
            id: Date.now().toString(),
            title: '',
            content: '',
            date: new Date().toISOString()
        };
        state.notes.unshift(newNote);
        state.selectedNote = newNote;
        saveState();
        renderNotesView();
    };
}

function deleteNote(id) {
    const note = state.notes.find(n => n.id === id);
    const titleStr = note && note.title ? `"${note.title}"` : "Ushbu qaydni";
    openConfirmModal({
        title: "Qaydni o'chirish",
        message: `${titleStr} qaydini butunlay o'chirishni tasdiqlaysizmi?`,
        confirmText: "Qaydni o'chirish",
        onConfirm: () => {
            state.notes = state.notes.filter(n => n.id !== id);
            state.selectedNote = null;
            saveState();
            closeModal();
            renderNotesView();
            const editor = document.getElementById('note-editor');
            if (editor) editor.innerHTML = '<div class="placeholder-editor">Qaydni tanlang yoki yangisini yarating</div>';
            showToast("Qayd o'chirildi", "warning");
        }
    });
}
window.deleteNote = deleteNote;

// Reusable Glassmorphism Custom Confirmation Modal Helper
function openConfirmModal({ title, message, onConfirm, confirmText = "O'chirish", cancelText = "Bekor qilish", type = "danger" }) {
    const iconColor = type === "danger" ? "#ef4444" : "var(--primary)";
    const iconBg = type === "danger" ? "#fee2e2" : "#eef2ff";
    const btnBg = type === "danger" ? "#ef4444" : "var(--primary)";
    const iconName = type === "danger" ? "trash-2" : "alert-triangle";
    
    const html = `
        <div style="text-align: center; padding: 12px 0;">
            <div style="width: 56px; height: 56px; background: ${iconBg}; color: ${iconColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; font-size: 24px;">
                <i data-lucide="${iconName}"></i>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">${title}</h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px; padding: 0 16px; line-height: 1.5;">
                ${message}
            </p>
            <div style="display: flex; justify-content: center; gap: 12px;">
                <button class="btn-secondary" onclick="closeModal()" style="padding: 10px 24px; font-weight: 600; font-size: 14px; border-radius: var(--radius-md); border: 1px solid var(--border); background: white;">${cancelText}</button>
                <button id="modal-confirm-action-btn" style="background: ${btnBg}; color: white; padding: 10px 24px; border: none; font-weight: 600; font-size: 14px; border-radius: var(--radius-md); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                    <i data-lucide="${iconName}" style="width: 16px; height: 16px;"></i>
                    ${confirmText}
                </button>
            </div>
        </div>
    `;
    
    openModal(html);
    initIcons();
    
    document.getElementById('modal-confirm-action-btn').onclick = () => {
        onConfirm();
    };
}

// Task view renderer
function renderTasksView() {
    const todayList = document.getElementById('today-tasks-list');
    const weeklyList = document.getElementById('weekly-tasks-list');
    const completedList = document.getElementById('completed-tasks-list');
    
    if (todayList) todayList.innerHTML = '';
    if (weeklyList) weeklyList.innerHTML = '';
    if (completedList) completedList.innerHTML = '';
    
    // Split tasks: non-completed (today/weekly) and completed
    const todayTasks = state.tasks.filter(t => t.type === 'today' && !t.completed);
    const weeklyTasks = state.tasks.filter(t => t.type === 'weekly' && !t.completed);
    const completedTasks = state.tasks.filter(t => t.completed);
    
    const createTaskHTML = (task) => `
        <div class="task-item" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-md); transition: all 0.2s;">
            <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary);">
                <span class="task-text" style="font-size: 14px; font-weight: 500; color: ${task.completed ? 'var(--text-muted)' : 'var(--text-main)'}; text-decoration: ${task.completed ? 'line-through' : 'none'};">${task.text}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="task-badge" style="font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 12px; ${task.completed ? 'background: #e2e8f0; color: #64748b;' : task.type === 'today' ? 'background: #e0e7ff; color: #4338ca;' : 'background: #ecfdf5; color: #047857;'}">${task.completed ? '✓ Bajarildi' : task.type === 'today' ? 'Bugun' : 'Hafta'}</span>
                <button onclick="confirmDeleteTask('${task.id}')" style="background: none; border: none; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'"><i data-lucide="trash-2" style="width: 16px; height: 16px;"></i></button>
            </div>
        </div>
    `;
    
    if (todayTasks.length === 0) {
        if (todayList) todayList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 24px; font-size: 14px; font-style: italic;">Bugungi faol vazifalar yo\'q</div>';
    } else {
        todayTasks.forEach(task => {
            if (todayList) todayList.insertAdjacentHTML('beforeend', createTaskHTML(task));
        });
    }
    
    if (weeklyTasks.length === 0) {
        if (weeklyList) weeklyList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 24px; font-size: 14px; font-style: italic;">Haftalik faol vazifalar yo\'q</div>';
    } else {
        weeklyTasks.forEach(task => {
            if (weeklyList) weeklyList.insertAdjacentHTML('beforeend', createTaskHTML(task));
        });
    }

    if (completedTasks.length === 0) {
        if (completedList) completedList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 24px; font-size: 14px; font-style: italic;">Bajarilgan vazifalar yo\'q</div>';
    } else {
        completedTasks.forEach(task => {
            if (completedList) completedList.insertAdjacentHTML('beforeend', createTaskHTML(task));
        });
    }
    
    initIcons();
}

function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveState();
        renderTasksView();
        showToast(task.completed ? "Vazifa bajarildi!" : "Vazifa faollashtirildi!");
    }
}

function confirmDeleteTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    
    openConfirmModal({
        title: "Vazifani o'chirish",
        message: `"${task.text}" vazifasini o'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.`,
        confirmText: "Vazifani o'chirish",
        onConfirm: () => deleteTask(id)
    });
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveState();
    closeModal();
    renderTasksView();
    showToast("Vazifa o'chirildi", "warning");
}

function clearCompletedTasks() {
    const completedCount = state.tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
        showToast("Bajarilgan vazifalar mavjud emas", "warning");
        return;
    }
    
    openConfirmModal({
        title: "Bajarilganlarni o'chirish",
        message: `Barcha bajarilgan (${completedCount} ta) vazifalarni butunlay o'chirishni tasdiqlaysizmi?`,
        confirmText: "O'chirish",
        onConfirm: () => confirmClearCompleted()
    });
}

function confirmClearCompleted() {
    state.tasks = state.tasks.filter(t => !t.completed);
    saveState();
    closeModal();
    renderTasksView();
    showToast("Bajarilgan vazifalar o'chirildi", "warning");
}

function showAddTaskModal() {
    const html = `
        <h2 style="margin-bottom:24px; font-size: 20px; font-weight: 700; color: var(--text-main);">Yangi Vazifa Qo'shish</h2>
        <form id="add-task-form">
            <div class="form-group">
                <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Vazifa Matni</label>
                <input type="text" id="task-text-input" placeholder="Masalan: Uy vazifasini tekshirish" required style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none;">
            </div>
            <div class="form-group" style="margin-top: 16px;">
                <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Vazifa Turi</label>
                <select id="task-type-input" style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none; height: 47px;">
                    <option value="today">Bugungi vazifa (⚡)</option>
                    <option value="weekly">Haftalik vazifa (📅)</option>
                </select>
            </div>
            <div class="modal-footer" style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" class="btn-secondary" onclick="closeModal()">Bekor qilish</button>
                <button type="submit" class="add-new-btn">Qo'shish</button>
            </div>
        </form>
    `;
    openModal(html);
    
    document.getElementById('add-task-form').onsubmit = (e) => {
        e.preventDefault();
        const newTask = {
            id: Date.now().toString(),
            text: document.getElementById('task-text-input').value,
            type: document.getElementById('task-type-input').value,
            completed: false
        };
        state.tasks.push(newTask);
        saveState();
        closeModal();
        renderTasksView();
        showToast("Yangi vazifa muvaffaqiyatli qo'shildi!");
    };
}

// Group Edit helpers
function switchEditTab(tabName) {
    document.querySelectorAll('.edit-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.edit-tab-content').forEach(content => content.style.display = 'none');
    
    document.getElementById(`tab-btn-${tabName}`).classList.add('active');
    document.getElementById(`tab-content-${tabName}`).style.display = 'block';
}

function selectEditColor(color) {
    document.getElementById('edit-g-color').value = color;
    document.querySelectorAll('.color-picker-dot').forEach(dot => {
        const dotColor = dot.getAttribute('data-color');
        if (dotColor === color) {
            dot.style.boxShadow = `0 0 0 3px white, 0 0 0 5px ${color}`;
        } else {
            dot.style.boxShadow = 'none';
        }
    });
}

function selectEditFreq(freq) {
    document.getElementById('edit-g-freq').value = freq;
    if (freq === '1-3-5') {
        document.getElementById('freq-card-toq').style.borderColor = 'var(--primary)';
        document.getElementById('freq-card-toq').style.background = '#eef2ff';
        document.getElementById('freq-card-juft').style.borderColor = 'var(--border)';
        document.getElementById('freq-card-juft').style.background = 'white';
    } else {
        document.getElementById('freq-card-toq').style.borderColor = 'var(--border)';
        document.getElementById('freq-card-toq').style.background = 'white';
        document.getElementById('freq-card-juft').style.borderColor = 'var(--primary)';
        document.getElementById('freq-card-juft').style.background = '#eef2ff';
    }
}

function selectEditTime(time) {
    document.getElementById('edit-g-time').value = time;
    document.querySelectorAll('.time-badge-btn').forEach(btn => {
        const btnTime = btn.getAttribute('data-time');
        if (btnTime === time) {
            btn.style.borderColor = 'var(--primary)';
            btn.style.background = '#eef2ff';
            btn.style.color = 'var(--primary)';
        } else {
            btn.style.borderColor = 'var(--border)';
            btn.style.background = 'white';
            btn.style.color = 'var(--text-main)';
        }
    });
}

function updateTopicsCount() {
    const textarea = document.getElementById('edit-g-topics');
    if (!textarea) return;
    const lines = textarea.value.split('\n').map(l => l.trim()).filter(l => l !== '');
    const count = lines.length;
    const countLabel = document.getElementById('edit-topics-count-label');
    if (countLabel) countLabel.textContent = `${count} ta mavzu`;
}

function confirmDeleteGroup(groupId) {
    const group = state.groups.find(g => g.id === groupId);
    if (!group) return;
    
    openConfirmModal({
        title: "Guruhni o'chirish",
        message: `"${group.name}" guruhini butunlay o'chirishni tasdiqlaysizmi? Barcha darslar tarixi va jadvali o'chib ketadi.`,
        confirmText: "Guruhni o'chirish",
        onConfirm: () => deleteGroup(groupId)
    });
}

// Utility and UI formatting functions
function formatDateUz(dateInput) {
    const date = new Date(dateInput);
    const months = [
        "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
        "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    ];
    return `${date.getDate()} ${months[date.getMonth()]}`;
}

function formatFrequencyUz(freq) {
    if (freq === '1-3-5') return 'Du,Chor,Ju';
    if (freq === '2-4-6') return 'Se,Pay,Sha';
    return freq;
}

function updateSidebarBadges() {
    const eduTasksBadge = document.getElementById('edu-tasks-badge');
    if (eduTasksBadge) {
        const pendingCount = state.tasks.filter(t => t.category === 'edu' && !t.completed).length;
        eduTasksBadge.textContent = pendingCount;
        eduTasksBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }
    
    const marketingTasksBadge = document.getElementById('marketing-tasks-badge');
    if (marketingTasksBadge) {
        const pendingCount = state.tasks.filter(t => t.category === 'marketing' && !t.completed).length;
        marketingTasksBadge.textContent = pendingCount;
        marketingTasksBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }
    
    const groupsBadge = document.getElementById('groups-badge');
    if (groupsBadge) {
        const isGroupCompleted = (g) => g.lessons && g.lessons.length > 0 && g.lessons.every(l => l.completed);
        const activeGroupsCount = state.groups.filter(g => !isGroupCompleted(g)).length;
        groupsBadge.textContent = activeGroupsCount;
        groupsBadge.style.display = activeGroupsCount > 0 ? 'inline-block' : 'none';
    }
}

// Global exposure
window.toggleTask = toggleTask;
window.confirmDeleteTask = confirmDeleteTask;
window.deleteTask = deleteTask;
window.clearCompletedTasks = clearCompletedTasks;
window.confirmClearCompleted = confirmClearCompleted;
window.showAddTaskModal = showAddTaskModal;
window.switchEditTab = switchEditTab;
window.selectEditColor = selectEditColor;
window.selectEditFreq = selectEditFreq;
window.selectEditTime = selectEditTime;
window.updateTopicsCount = updateTopicsCount;
window.confirmDeleteGroup = confirmDeleteGroup;

// Courses & Syllabus Management
function renderCoursesView() {
    // Reset selection view
    const selectionGrid = document.getElementById('courses-selection-grid');
    const detailContainer = document.getElementById('course-syllabus-detail-container');
    const lessonDetailContainer = document.getElementById('lesson-detail-container');
    if (selectionGrid && detailContainer && lessonDetailContainer) {
        selectionGrid.style.display = 'grid';
        detailContainer.style.display = 'none';
        lessonDetailContainer.style.display = 'none';
    }
}

function selectCourseView(courseId) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;

    const selectionGrid = document.getElementById('courses-selection-grid');
    const detailContainer = document.getElementById('course-syllabus-detail-container');
    const lessonDetailContainer = document.getElementById('lesson-detail-container');
    
    if (selectionGrid && detailContainer && lessonDetailContainer) {
        selectionGrid.style.display = 'none';
        detailContainer.style.display = 'block';
        lessonDetailContainer.style.display = 'none';

        // Update titles
        document.getElementById('syllabus-course-title').textContent = `${course.name} dars dasturi`;
        document.getElementById('syllabus-course-desc').textContent = `${course.durationMonths} oy davomidagi jami ${course.totalLessons} ta dars jadvali va yuklangan materiallar`;

        // Render lessons list
        renderSyllabusLessons(courseId);
    }
}

function closeSyllabusView() {
    renderCoursesView();
}

function renderSyllabusLessons(courseId) {
    const list = document.getElementById('syllabus-lessons-list');
    if (!list) return;
    list.innerHTML = '';

    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;

    course.lessons.forEach(lesson => {
        const row = document.createElement('div');
        row.style.background = '#f8fafc';
        row.style.border = '1px solid var(--border)';
        row.style.borderRadius = 'var(--radius-md)';
        row.style.padding = '16px 20px';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.gap = '20px';
        row.style.cursor = 'pointer';
        row.style.transition = 'all 0.2s';
        
        row.onclick = () => openLessonDetail(courseId, lesson.index);
        row.onmouseover = () => { row.style.borderColor = 'var(--primary)'; row.style.background = 'white'; };
        row.onmouseout = () => { row.style.borderColor = 'var(--border)'; row.style.background = '#f8fafc'; };

        row.innerHTML = `
            <div style="flex:1; display:flex; align-items:center; gap:12px;">
                <span style="background:linear-gradient(135deg, #6366f1, #a855f7); color:white; font-size:11px; font-weight:700; padding:4px 10px; border-radius:6px;">${lesson.index}-DARS</span>
                <span style="font-weight:700; color:var(--text-main); font-size:16px;">${lesson.topic}</span>
            </div>
            <div><i data-lucide="chevron-right" style="color:var(--text-muted); width:20px; height:20px;"></i></div>
        `;
        list.appendChild(row);
    });

    initIcons();
}

function showEditLessonModal(courseId, lessonIndex) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    const lesson = course.lessons.find(l => l.index === lessonIndex);
    if (!lesson) return;

    const html = `
        <h2 style="margin-bottom:20px; font-size: 18px; font-weight: 700; color: var(--text-main); font-family: 'Outfit', sans-serif;">Dars Tafsilotlarini Tahrirlash</h2>
        <form id="edit-lesson-form">
            <div class="form-group" style="margin-bottom: 16px;">
                <label style="font-weight: 600; font-size: 13px; margin-bottom: 6px; display: block;">Mavzu Nomi</label>
                <input type="text" id="edit-l-topic" value="${lesson.topic}" required style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none;">
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="font-weight: 600; font-size: 13px; margin-bottom: 6px; display: block;">Dars Davomiyligi (Dars soati)</label>
                <select id="edit-l-hours" style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none; height: 47px;">
                    <option value="1.5 soat" ${lesson.hours === '1.5 soat' ? 'selected' : ''}>1.5 soat (akademik soat)</option>
                    <option value="2 soat" ${lesson.hours === '2 soat' || !lesson.hours ? 'selected' : ''}>2 soat (standart dars)</option>
                    <option value="2.5 soat" ${lesson.hours === '2.5 soat' ? 'selected' : ''}>2.5 soat (kengaytirilgan dars)</option>
                    <option value="3 soat" ${lesson.hours === '3 soat' ? 'selected' : ''}>3 soat (amaliy seminar)</option>
                </select>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" class="btn-secondary" onclick="closeModal()">Bekor qilish</button>
                <button type="submit" class="add-new-btn">Saqlash</button>
            </div>
        </form>
    `;
    openModal(html);

    document.getElementById('edit-lesson-form').onsubmit = (e) => {
        e.preventDefault();
        lesson.topic = document.getElementById('edit-l-topic').value;
        lesson.hours = document.getElementById('edit-l-hours').value;
        
        // Also update any active groups taking this course to align them!
        state.groups.forEach(group => {
            if (group.courseId === courseId) {
                const groupLesson = group.lessons.find(l => l.index === lessonIndex);
                if (groupLesson) {
                    groupLesson.topic = lesson.topic;
                    groupLesson.hours = lesson.hours;
                }
            }
        });

        saveState();
        closeModal();
        renderSyllabusLessons(courseId);
        showToast("Dars mavzusi va soati yangilandi", "success");
    };
}

function showUploadMaterialModal(courseId, lessonIndex) {
    const html = `
        <h2 style="margin-bottom:12px; font-size: 18px; font-weight: 700; color: var(--text-main); font-family: 'Outfit', sans-serif;">Darslik Materiali Qo'shish</h2>
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:20px;">Dars uchun qo'shimcha amaliy vazifa, taqdimot yoki video havola yuklash</p>
        <form id="upload-material-form">
            <div class="form-group" style="margin-bottom: 16px;">
                <label style="font-weight: 600; font-size: 13px; margin-bottom: 6px; display: block;">Fayl Nomi</label>
                <input type="text" id="up-name" placeholder="Masalan: uyga_vazifa_sharti" required style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none;">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
                <div class="form-group">
                    <label style="font-weight: 600; font-size: 13px; margin-bottom: 6px; display: block;">Fayl Turi</label>
                    <select id="up-type" style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none; height: 47px;">
                        <option value="pdf">PDF Hujjat (.pdf)</option>
                        <option value="word">Word Hujjat (.docx)</option>
                        <option value="video">Video Darslik (.mp4)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="font-weight: 600; font-size: 13px; margin-bottom: 6px; display: block;">Hajmi (MB)</label>
                    <input type="text" id="up-size" placeholder="Masalan: 1.5 MB" required style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none;">
                </div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" class="btn-secondary" onclick="closeModal()">Bekor qilish</button>
                <button type="submit" class="add-new-btn">Materialni saqlash</button>
            </div>
        </form>
    `;
    openModal(html);

    document.getElementById('upload-material-form').onsubmit = (e) => {
        e.preventDefault();
        const course = state.courses.find(c => c.id === courseId);
        if (!course) return;
        const lesson = course.lessons.find(l => l.index === lessonIndex);
        if (!lesson) return;

        const name = document.getElementById('up-name').value;
        const type = document.getElementById('up-type').value;
        const size = document.getElementById('up-size').value;

        const extension = type === 'pdf' ? '.pdf' : type === 'word' ? '.docx' : '.mp4';
        const finalName = name.endsWith(extension) ? name : name + extension;

        if (!lesson.materials) lesson.materials = [];
        lesson.materials.push({ name: finalName, type, size });

        // Synchronize dynamic groups
        state.groups.forEach(group => {
            if (group.courseId === courseId) {
                const groupLesson = group.lessons.find(l => l.index === lessonIndex);
                if (groupLesson) {
                    if (!groupLesson.materials) groupLesson.materials = [];
                    groupLesson.materials.push({ name: finalName, type, size });
                }
            }
        });

        saveState();
        saveState();
        closeModal();
        const detailContainer = document.getElementById('lesson-detail-container');
        if (detailContainer && detailContainer.style.display !== 'none') {
            openLessonDetail(courseId, lessonIndex, 'fayllar');
        } else {
            renderSyllabusLessons(courseId);
        }
        showToast(`"${finalName}" muvaffaqiyatli darslik materiallariga qo'shildi!`, "success");
    };
}

function downloadMaterial(courseId, lessonIndex, fileName) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    const lesson = course.lessons.find(l => l.index === lessonIndex);
    if (!lesson) return;
    const material = lesson.materials.find(m => m.name === fileName);
    if (!material) return;

    if (material.data) {
        // Real Base64 download
        const link = document.createElement("a");
        link.href = material.data;
        link.download = material.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`"${fileName}" fayli yuklab olindi!`, "success");
    } else {
        // Fallback simulation with simple text blob
        const blob = new Blob(["Ushbu fayl darslik materiallari sinovi uchun yaratilgan: " + fileName], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`"${fileName}" fayli muvaffaqiyatli yuklab olindi!`, "success");
    }
}

function triggerFileUpload(courseId, lessonIndex) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.jpg,.jpeg,.png';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const course = state.courses.find(c => c.id === courseId);
            if (!course) return;
            const lesson = course.lessons.find(l => l.index === lessonIndex);
            if (!lesson) return;
            
            if (!lesson.materials) lesson.materials = [];
            
            // Format size
            const sizeInKB = file.size / 1024;
            const formattedSize = sizeInKB > 1024 
                ? (sizeInKB / 1024).toFixed(1) + " MB" 
                : sizeInKB.toFixed(1) + " KB";
            
            // Get file extension and set type
            const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            let type = 'pdf';
            if (ext === '.docx' || ext === '.doc') type = 'word';
            else if (ext === '.xlsx' || ext === '.xls') type = 'excel';
            else if (ext === '.pptx' || ext === '.ppt') type = 'powerpoint';
            else if (['.jpg', '.jpeg', '.png'].includes(ext)) type = 'image';
            
            lesson.materials.push({
                name: file.name,
                type: type,
                size: formattedSize,
                data: event.target.result // Base64
            });
            
            saveState();
            openLessonDetail(courseId, lessonIndex, 'fayllar');
            showToast(`"${file.name}" muvaffaqiyatli yuklandi!`, "success");
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function triggerHomeworkFileUpload(courseId, lessonIndex) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.jpg,.jpeg,.png';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const course = state.courses.find(c => c.id === courseId);
            if (!course) return;
            const lesson = course.lessons.find(l => l.index === lessonIndex);
            if (!lesson) return;
            
            if (!lesson.homeworkFiles) lesson.homeworkFiles = [];
            
            // Format size
            const sizeInKB = file.size / 1024;
            const formattedSize = sizeInKB > 1024 
                ? (sizeInKB / 1024).toFixed(1) + " MB" 
                : sizeInKB.toFixed(1) + " KB";
            
            lesson.homeworkFiles.push({
                name: file.name,
                size: formattedSize,
                data: event.target.result // Base64
            });
            
            saveState();
            openLessonDetail(courseId, lessonIndex, 'uyga_vazifa');
            showToast(`"${file.name}" uyga vazifasiga biriktirildi!`, "success");
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function downloadHomeworkFile(courseId, lessonIndex, fileName) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    const lesson = course.lessons.find(l => l.index === lessonIndex);
    if (!lesson) return;
    if (!lesson.homeworkFiles) return;
    const file = lesson.homeworkFiles.find(f => f.name === fileName);
    if (!file) return;

    if (file.data) {
        const link = document.createElement("a");
        link.href = file.data;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`"${fileName}" fayli yuklab olindi!`, "success");
    }
}

function deleteMaterial(courseId, lessonIndex, fileName) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    const lesson = course.lessons.find(l => l.index === lessonIndex);
    if (!lesson) return;
    
    lesson.materials = lesson.materials.filter(m => m.name !== fileName);
    
    // Sync dynamic groups
    state.groups.forEach(group => {
        if (group.courseId === courseId) {
            const groupLesson = group.lessons.find(l => l.index === lessonIndex);
            if (groupLesson && groupLesson.materials) {
                groupLesson.materials = groupLesson.materials.filter(m => m.name !== fileName);
            }
        }
    });
    
    saveState();
    openLessonDetail(courseId, lessonIndex, true, 'accordion-files');
    showToast(`"${fileName}" o'chirildi!`, "warning");
}

function deleteHomeworkFile(courseId, lessonIndex, fileName) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    const lesson = course.lessons.find(l => l.index === lessonIndex);
    if (!lesson) return;
    
    lesson.homeworkFiles = lesson.homeworkFiles.filter(f => f.name !== fileName);
    
    // Sync dynamic groups
    state.groups.forEach(group => {
        if (group.courseId === courseId) {
            const groupLesson = group.lessons.find(l => l.index === lessonIndex);
            if (groupLesson && groupLesson.homeworkFiles) {
                groupLesson.homeworkFiles = groupLesson.homeworkFiles.filter(f => f.name !== fileName);
            }
        }
    });
    
    saveState();
    openLessonDetail(courseId, lessonIndex, true, 'accordion-homework');
    showToast(`"${fileName}" o'chirildi!`, "warning");
}

function triggerVideoUpload(courseId, lessonIndex) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mp4,.mov,.avi,.mkv';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 1.5 * 1024 * 1024) {
            showToast("Video o'lchami juda katta! Maksimal 1.5MB video yuklashingiz mumkin.", "danger");
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const course = state.courses.find(c => c.id === courseId);
            if (!course) return;
            const lesson = course.lessons.find(l => l.index === lessonIndex);
            if (!lesson) return;
            
            if (!lesson.videos) lesson.videos = [];
            
            const sizeInKB = file.size / 1024;
            const formattedSize = sizeInKB > 1024 
                ? (sizeInKB / 1024).toFixed(1) + " MB" 
                : sizeInKB.toFixed(1) + " KB";
            
            lesson.videos.push({
                name: file.name,
                size: formattedSize,
                data: event.target.result // Base64
            });
            
            // Sync dynamic groups
            state.groups.forEach(group => {
                if (group.courseId === courseId) {
                    const groupLesson = group.lessons.find(l => l.index === lessonIndex);
                    if (groupLesson) {
                        if (!groupLesson.videos) groupLesson.videos = [];
                        groupLesson.videos.push({
                            name: file.name,
                            size: formattedSize,
                            data: event.target.result
                        });
                    }
                }
            });
            
            saveState();
            openLessonDetail(courseId, lessonIndex, true, 'accordion-video');
            showToast(`"${file.name}" muvaffaqiyatli yuklandi!`, "success");
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function downloadVideo(courseId, lessonIndex, fileName) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    const lesson = course.lessons.find(l => l.index === lessonIndex);
    if (!lesson) return;
    if (!lesson.videos) return;
    const video = lesson.videos.find(v => v.name === fileName);
    if (!video) return;

    if (video.data) {
        const link = document.createElement("a");
        link.href = video.data;
        link.download = video.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`"${fileName}" yuklab olindi!`, "success");
    }
}

function deleteVideo(courseId, lessonIndex, fileName) {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    const lesson = course.lessons.find(l => l.index === lessonIndex);
    if (!lesson) return;
    if (!lesson.videos) return;
    
    lesson.videos = lesson.videos.filter(v => v.name !== fileName);
    
    // Sync dynamic groups
    state.groups.forEach(group => {
        if (group.courseId === courseId) {
            const groupLesson = group.lessons.find(l => l.index === lessonIndex);
            if (groupLesson && groupLesson.videos) {
                groupLesson.videos = groupLesson.videos.filter(v => v.name !== fileName);
            }
        }
    });
    
    saveState();
    openLessonDetail(courseId, lessonIndex, true, 'accordion-video');
    showToast(`"${fileName}" o'chirildi!`, "warning");
}

function getFileIcon(fileName) {
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (ext === '.pdf') return '📕';
    if (['.doc', '.docx'].includes(ext)) return '📘';
    if (['.xls', '.xlsx'].includes(ext)) return '📗';
    if (['.ppt', '.pptx'].includes(ext)) return '📙';
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) return '🖼️';
    if (ext === '.mp4') return '🎥';
    return '📄';
}

// Global scope attachment
window.renderCoursesView = renderCoursesView;
window.selectCourseView = selectCourseView;
window.closeSyllabusView = closeSyllabusView;
window.showEditLessonModal = showEditLessonModal;
window.showUploadMaterialModal = showUploadMaterialModal;
window.downloadMaterial = downloadMaterial;
window.triggerFileUpload = triggerFileUpload;
window.triggerHomeworkFileUpload = triggerHomeworkFileUpload;
window.downloadHomeworkFile = downloadHomeworkFile;
window.getFileIcon = getFileIcon;
window.deleteMaterial = deleteMaterial;
window.deleteHomeworkFile = deleteHomeworkFile;
window.triggerVideoUpload = triggerVideoUpload;
window.downloadVideo = downloadVideo;
window.deleteVideo = deleteVideo;

function openLessonDetail(courseId, lessonIndex, isEditMode = false, openRightAccordionId = null) {
    // Backward compatibility for calls from callbacks (where third arg was activeTab or activeLeftTab string)
    if (typeof isEditMode === 'string') {
        const section = isEditMode;
        if (section === 'malumot') {
            isEditMode = false;
            openRightAccordionId = null;
        } else {
            isEditMode = true;
            if (section === 'fayllar') {
                openRightAccordionId = 'accordion-files';
            } else if (section === 'uyga_vazifa') {
                openRightAccordionId = 'accordion-homework';
            } else if (section === 'sinov_testi') {
                openRightAccordionId = 'accordion-quiz';
            }
        }
    }

    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    const lesson = course.lessons.find(l => l.index === lessonIndex);
    if (!lesson) return;

    document.getElementById('course-syllabus-detail-container').style.display = 'none';
    const detailContainer = document.getElementById('lesson-detail-container');
    detailContainer.style.display = 'grid';
    detailContainer.style.gridTemplateColumns = '1fr 320px';
    detailContainer.style.gap = '24px';
    
    // Default data initialization if missing
    if(!lesson.infoText || lesson.infoText.trim() === '') {
        lesson.infoText = `Mavzu: ${lesson.topic}\n\nUshbu darsda o'rganiladigan asosiy tushunchalar:\n1. ${lesson.topic} bo'yicha nazariy ma'lumotlar.\n2. Amaliy mashg'ulotlar va mustaqil ish topshiriqlari.\n3. Savol-javoblar va darsni mustahkamlash.\n\nDars davomiyligi: ${lesson.hours || '2 soat'}. Iltimos, dars materiallarini ko'rib chiqing va uyga vazifani o'z vaqtida yuklang.`;
    }
    if(!lesson.homework) lesson.homework = '';
    if(!lesson.quiz) lesson.quiz = [];
    if(!lesson.homeworkFiles) lesson.homeworkFiles = [];

    // --- LEFT COLUMN MARKUP (Simplified: Only "Dars haqida" tavsifi) ---
    let leftMarkup = '';
    if (isEditMode) {
        leftMarkup = `
            <div style="animation: fadeIn 0.2s ease-out;">
                <textarea id="lesson-info-text" placeholder="Dars haqida batafsil ma'lumot kiriting..." style="width: 100%; height: 250px; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none; font-family: inherit; font-size: 14px; resize: vertical; margin-bottom: 12px; line-height: 1.5;">${lesson.infoText}</textarea>
                <button class="add-new-btn" onclick="saveLessonInfo('${courseId}', ${lessonIndex})" style="padding: 8px 16px; display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="save" style="width:14px; height:14px;"></i> Tavsifni saqlash
                </button>
            </div>
        `;
    } else {
        leftMarkup = `
            <div style="animation: fadeIn 0.2s ease-out; font-size: 14px; line-height: 1.6; color: var(--text-main); white-space: pre-wrap; background: #f8fafc; border: 1px solid var(--border); padding: 20px; border-radius: var(--radius-md);">${lesson.infoText}</div>
        `;
    }

    const leftCol = `
        <div style="background: white; border-radius: var(--radius-lg); border: 1px solid var(--border); padding: 24px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 20px;">
            <!-- Back Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
                    <button onclick="selectCourseView('${courseId}')" class="btn-secondary" style="padding: 8px; display: flex; align-items: center; justify-content: center; border-radius: 50%; width: 36px; height: 36px; flex-shrink: 0;"><i data-lucide="arrow-left" style="width: 18px; height: 18px;"></i></button>
                    <div style="overflow: hidden;">
                        <span style="font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em;">${course.name}</span>
                        <h2 style="font-size: 18px; font-weight: 800; color: var(--text-main); font-family: 'Outfit', sans-serif; margin-top: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="Dars ${lesson.index}: ${lesson.topic}">Dars ${lesson.index}: ${lesson.topic}</h2>
                    </div>
                </div>
                <!-- Edit Mode Button -->
                <button onclick="openLessonDetail('${courseId}', ${lessonIndex}, ${!isEditMode})" class="btn-primary" style="padding: 8px 16px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; background: ${isEditMode ? '#64748b' : 'var(--primary)'}; border: none; color: white; cursor: pointer; border-radius: var(--radius-md); flex-shrink: 0;">
                    <i data-lucide="${isEditMode ? 'eye' : 'edit'}" style="width: 14px; height: 14px;"></i>
                    <span>${isEditMode ? 'Ko\'rish' : 'Tahrirlash'}</span>
                </button>
            </div>

            <!-- Metadata info (No ratings, no stars, only duration) -->
            <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-muted); background: #f8fafc; padding: 10px 16px; border-radius: var(--radius-md); border: 1px solid var(--border);">
                <span>⏱️ Davomiyligi: <strong>${lesson.hours || '2 soat'}</strong></span>
            </div>

            <!-- Content section (No tabs header) -->
            <div style="min-height: 200px; display: flex; flex-direction: column; gap: 10px;">
                <div style="font-weight: 700; font-size: 14px; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 4px;">Dars haqida</div>
                ${leftMarkup}
            </div>
        </div>
    `;


    // --- RIGHT COLUMN MARKUP (LMS Modules Accordion & Progress) ---

    // Videos Markup
    if (!lesson.videos) lesson.videos = [];
    const videosMarkup = lesson.videos && lesson.videos.length > 0 
        ? lesson.videos.map((v, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid var(--border); padding:8px 10px; border-radius:var(--radius-sm); margin-bottom:6px; font-size: 12px;">
                <div style="display:flex; align-items:center; gap:8px; overflow: hidden; flex: 1;">
                    <i data-lucide="play-circle" style="color: var(--primary); width: 14px; height: 14px; flex-shrink: 0;"></i>
                    <span style="color: var(--text-main); font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${v.name}">${idx + 1}. ${v.name}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                    <button onclick="downloadVideo('${courseId}', ${lessonIndex}, '${v.name}')" style="background: none; border: none; color: var(--primary); cursor: pointer; padding: 4px; display: flex; align-items: center; flex-shrink: 0;" title="Yuklab olish">
                        <i data-lucide="download" style="width: 14px; height: 14px;"></i>
                    </button>
                    ${isEditMode ? `
                        <button onclick="deleteVideo('${courseId}', ${lessonIndex}, '${v.name}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; display: flex; align-items: center; flex-shrink: 0;" title="O'chirish">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('')
        : `<div style="text-align:center; padding:12px; color:var(--text-muted); font-size:11px;">Hozircha videolar yuklanmagan</div>`;

    const videosContent = isEditMode 
        ? `${videosMarkup}
           <div onclick="triggerVideoUpload('${courseId}', ${lessonIndex})" style="border: 1.5px dashed var(--primary); border-radius: var(--radius-sm); padding: 12px; text-align: center; cursor: pointer; background: #f5f3ff; margin-top: 8px;">
               <i data-lucide="video" style="width: 18px; height: 18px; color: var(--primary); margin-bottom: 4px;"></i>
               <span style="font-weight: 700; font-size: 12px; color: var(--text-main); display: block;">Yangi video yuklash</span>
           </div>`
        : videosMarkup;

    // Materials List Markup
    const materialsMarkup = lesson.materials && lesson.materials.length > 0 
        ? lesson.materials.map(m => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid var(--border); padding:8px 10px; border-radius:var(--radius-sm); margin-bottom:6px;">
                <div style="display:flex; align-items:center; gap:8px; overflow: hidden; flex: 1;">
                    <span style="font-size:16px; flex-shrink: 0;">${getFileIcon(m.name)}</span>
                    <span style="font-weight:600; font-size:12px; color: var(--text-main); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${m.name}">${m.name}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                    <button onclick="downloadMaterial('${courseId}', ${lessonIndex}, '${m.name}')" style="background: none; border: none; color: var(--primary); cursor: pointer; padding: 4px; display: flex; align-items: center; flex-shrink: 0;" title="Yuklab olish">
                        <i data-lucide="download" style="width: 14px; height: 14px;"></i>
                    </button>
                    ${isEditMode ? `
                        <button onclick="deleteMaterial('${courseId}', ${lessonIndex}, '${m.name}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; display: flex; align-items: center; flex-shrink: 0;" title="O'chirish">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('')
        : `<div style="text-align:center; padding:12px; color:var(--text-muted); font-size:11px;">Hozircha fayllar yuklanmagan</div>`;

    const materialsContent = isEditMode 
        ? `${materialsMarkup}
           <div onclick="triggerFileUpload('${courseId}', ${lessonIndex})" style="border: 1.5px dashed var(--primary); border-radius: var(--radius-sm); padding: 12px; text-align: center; cursor: pointer; background: #f5f3ff; margin-top: 8px;">
               <i data-lucide="upload-cloud" style="width: 18px; height: 18px; color: var(--primary); margin-bottom: 4px;"></i>
               <span style="font-weight: 700; font-size: 12px; color: var(--text-main); display: block;">Yangi darslik yuklash</span>
           </div>`
        : materialsMarkup;


    // Homework Markup
    const hwFilesMarkup = lesson.homeworkFiles && lesson.homeworkFiles.length > 0
        ? lesson.homeworkFiles.map(f => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid var(--border); padding:8px 10px; border-radius:var(--radius-sm); margin-bottom:6px;">
                <div style="display:flex; align-items:center; gap:8px; overflow: hidden; flex: 1;">
                    <span style="font-size:16px; flex-shrink: 0;">${getFileIcon(f.name)}</span>
                    <span style="font-weight:600; font-size:12px; color: var(--text-main); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${f.name}">${f.name}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                    <button onclick="downloadHomeworkFile('${courseId}', ${lessonIndex}, '${f.name}')" style="background: none; border: none; color: var(--primary); cursor: pointer; padding: 4px; display: flex; align-items: center; flex-shrink: 0;" title="Yuklab olish">
                        <i data-lucide="download" style="width: 14px; height: 14px;"></i>
                    </button>
                    ${isEditMode ? `
                        <button onclick="deleteHomeworkFile('${courseId}', ${lessonIndex}, '${f.name}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; display: flex; align-items: center; flex-shrink: 0;" title="O'chirish">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('')
        : '';

    const homeworkContent = isEditMode
        ? `<textarea id="lesson-homework-text" placeholder="Uyga vazifa shartlari..." style="width: 100%; height: 100px; padding: 8px; border-radius: var(--radius-sm); border: 1px solid var(--border); font-family: inherit; font-size: 12px; outline: none; resize: vertical; margin-bottom: 8px; line-height: 1.4;">${lesson.homework}</textarea>
           <button class="add-new-btn" onclick="saveLessonHomework('${courseId}', ${lessonIndex})" style="padding: 6px 12px; font-size: 12px; width: 100%; justify-content: center; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
               <i data-lucide="save" style="width: 12px; height: 12px;"></i> Tavsifni saqlash
           </button>
           <div style="margin-bottom: 8px;">
               <div style="font-weight: 700; font-size: 11px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">Vazifa fayllari:</div>
               ${hwFilesMarkup}
           </div>
           <div onclick="triggerHomeworkFileUpload('${courseId}', ${lessonIndex})" style="border: 1.5px dashed #10b981; border-radius: var(--radius-sm); padding: 12px; text-align: center; cursor: pointer; background: #ecfdf5; display: flex; flex-direction: column; align-items: center; justify-content: center;">
               <i data-lucide="paperclip" style="width: 18px; height: 18px; color: #10b981; margin-bottom: 4px;"></i>
               <span style="font-weight: 700; font-size: 12px; color: var(--text-main); display: block;">Vazifaga fayl yuklash</span>
           </div>`
        : `<div style="font-size: 13px; line-height: 1.5; color: var(--text-main); margin-bottom: 8px; white-space: pre-wrap;">${lesson.homework || "Uyga vazifa yuklanmagan"}</div>
           ${hwFilesMarkup}`;


    // Quiz Markup
    const quizMarkup = lesson.quiz && lesson.quiz.length > 0
        ? lesson.quiz.map((q, i) => `
            <div style="background:#f8fafc; border:1px solid var(--border); border-radius:var(--radius-sm); padding:10px; margin-bottom: 8px;">
                <div style="font-weight:600; font-size: 12px;">${i+1}. ${q.question}</div>
                <div style="display:flex; flex-direction:column; gap:4px; font-size:11px; margin-top:8px;">
                    <div style="padding:4px 8px; background:${q.answer === 0 ? '#f0fdf4' : 'white'}; color:${q.answer === 0 ? '#166534' : 'var(--text-main)'}; border:1px solid ${q.answer === 0 ? '#86efac' : 'var(--border)'}; border-radius:4px;">A) ${q.options[0]}</div>
                    <div style="padding:4px 8px; background:${q.answer === 1 ? '#f0fdf4' : 'white'}; color:${q.answer === 1 ? '#166534' : 'var(--text-main)'}; border:1px solid ${q.answer === 1 ? '#86efac' : 'var(--border)'}; border-radius:4px;">B) ${q.options[1]}</div>
                    <div style="padding:4px 8px; background:${q.answer === 2 ? '#f0fdf4' : 'white'}; color:${q.answer === 2 ? '#166534' : 'var(--text-main)'}; border:1px solid ${q.answer === 2 ? '#86efac' : 'var(--border)'}; border-radius:4px;">C) ${q.options[2]}</div>
                </div>
            </div>
        `).join('')
        : `<div style="text-align:center; padding:12px; color:var(--text-muted); font-size:11px;">Testlar kiritilmagan</div>`;

    const quizContent = isEditMode
        ? `<button class="add-new-btn" onclick="addTestQuestion('${courseId}', ${lessonIndex})" style="padding: 6px 12px; font-size: 12px; width: 100%; justify-content: center; margin-bottom: 12px; display: flex; align-items: center; gap: 4px;">
               <i data-lucide="plus" style="width: 12px; height: 12px;"></i> Test qo'shish
           </button>
           ${quizMarkup}`
        : quizMarkup;

    const rightCol = `
        <div style="display: flex; flex-direction: column; gap: 16px;">
            <!-- Progress Card -->
            <div style="background: white; border-radius: var(--radius-lg); border: 1px solid var(--border); padding: 16px; box-shadow: var(--shadow-sm);">
                <div style="font-size: 12px; font-weight: 700; color: var(--text-main); display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span>Kurs bo'yicha progress:</span>
                    <span>${Math.round((lessonIndex / course.lessons.length) * 100)}%</span>
                </div>
                <div style="width: 100%; background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
                    <div style="width: ${Math.round((lessonIndex / course.lessons.length) * 100)}%; background: linear-gradient(90deg, var(--primary), var(--secondary)); height: 100%; border-radius: 3px;"></div>
                </div>
                <div style="font-size: 10px; color: var(--text-muted); font-weight: 600; text-align: right;">
                    ${lessonIndex}/${course.lessons.length} ta mavzu o'tildi
                </div>
            </div>

            <!-- Accordion List -->
            <div style="display: flex; flex-direction: column;">
                <!-- Section 1: Videos -->
                <div class="accordion-item">
                    <div class="accordion-header" onclick="document.getElementById('accordion-video').classList.toggle('active')">
                        <span>🎥 Video darslar</span>
                        <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
                    </div>
                    <div class="accordion-content ${openRightAccordionId === 'accordion-video' ? 'active' : ''}" id="accordion-video">
                        ${videosContent}
                    </div>
                </div>

                <!-- Section 2: Files -->
                <div class="accordion-item">
                    <div class="accordion-header" onclick="document.getElementById('accordion-files').classList.toggle('active')">
                        <span>📁 Dars materiallari (Fayllar)</span>
                        <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
                    </div>
                    <div class="accordion-content ${openRightAccordionId === 'accordion-files' ? 'active' : ''}" id="accordion-files">
                        ${materialsContent}
                    </div>
                </div>

                <!-- Section 3: Homework -->
                <div class="accordion-item">
                    <div class="accordion-header" onclick="document.getElementById('accordion-homework').classList.toggle('active')">
                        <span>📝 Uyga vazifalar</span>
                        <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
                    </div>
                    <div class="accordion-content ${openRightAccordionId === 'accordion-homework' ? 'active' : ''}" id="accordion-homework">
                        ${homeworkContent}
                    </div>
                </div>

                <!-- Section 4: Quiz -->
                <div class="accordion-item">
                    <div class="accordion-header" onclick="document.getElementById('accordion-quiz').classList.toggle('active')">
                        <span>🧪 Sinov testlari</span>
                        <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
                    </div>
                    <div class="accordion-content ${openRightAccordionId === 'accordion-quiz' ? 'active' : ''}" id="accordion-quiz">
                        ${quizContent}
                    </div>
                </div>
            </div>
        </div>
    `;

    detailContainer.innerHTML = leftCol + rightCol;
    initIcons();
}

function saveLessonInfo(courseId, lessonIndex) {
    const text = document.getElementById('lesson-info-text').value;
    const course = state.courses.find(c => c.id === courseId);
    if(course) {
        const lesson = course.lessons.find(l => l.index === lessonIndex);
        if(lesson) lesson.infoText = text;
    }
    saveState();
    showToast("Ma'lumot muvaffaqiyatli saqlandi!", "success");
}

function saveLessonHomework(courseId, lessonIndex) {
    const text = document.getElementById('lesson-homework-text').value;
    const course = state.courses.find(c => c.id === courseId);
    if(course) {
        const lesson = course.lessons.find(l => l.index === lessonIndex);
        if(lesson) lesson.homework = text;
    }
    saveState();
    showToast("Uyga vazifa shartlari saqlandi!", "success");
}

function addTestQuestion(courseId, lessonIndex) {
    const question = prompt("Savolni kiriting:");
    if (!question) return;
    const opt1 = prompt("1-variant (To'g'ri javobni kiriting):");
    const opt2 = prompt("2-variant:");
    const opt3 = prompt("3-variant:");
    
    if (question && opt1 && opt2 && opt3) {
        const course = state.courses.find(c => c.id === courseId);
        if(course) {
            const lesson = course.lessons.find(l => l.index === lessonIndex);
            if(lesson) {
                if(!lesson.quiz) lesson.quiz = [];
                lesson.quiz.push({
                    question: question,
                    options: [opt1, opt2, opt3],
                    answer: 0 // Index of correct option
                });
                saveState();
                openLessonDetail(courseId, lessonIndex, 'sinov_testi');
                showToast("Test savoli muvaffaqiyatli qo'shildi!", "success");
            }
        }
    }
}

window.openLessonDetail = openLessonDetail;
window.saveLessonInfo = saveLessonInfo;
window.saveLessonHomework = saveLessonHomework;
window.addTestQuestion = addTestQuestion;


// ==========================================
// MARKETING & SMM MODULE IMPLEMENTATION
// ==========================================

function renderMarketingView() {
    const container = document.getElementById('marketing-posts-container');
    if (!container) return;
    container.innerHTML = '';

    if (!state.smm) {
        state.smm = JSON.parse(localStorage.getItem('edu_smm')) || [];
    }

    // Migrate old legacy boolean status to string
    state.smm.forEach(post => {
        if (!post.status) {
            post.status = post.published ? 'done' : 'progress';
        }
    });

    const total = state.smm.length;
    const done = state.smm.filter(p => p.status === 'done').length;
    const progress = state.smm.filter(p => p.status === 'progress').length;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;

    document.getElementById('marketing-total-posts').textContent = total;
    document.getElementById('marketing-published-posts').textContent = done;
    document.getElementById('marketing-pending-posts').textContent = progress;
    document.getElementById('marketing-success-rate').textContent = rate + '%';

    if (total === 0) {
        container.innerHTML = `
            <div style="background: white; border-radius: var(--radius-lg); padding: 48px; text-align: center; border: 1px solid var(--border);">
                <div style="width: 56px; height: 56px; background: #faf5ff; color: #a855f7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;"><i data-lucide="megaphone" style="width: 24px; height: 24px;"></i></div>
                <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Content Plan Bo'sh</h3>
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">Hozircha biron-bir marketing yoki SMM posti kiritilmagan. Birinchi postni rejalashtiring!</p>
                <button class="add-new-btn" onclick="showAddSmmPostModal()" style="margin: 0 auto; display: flex; gap: 8px;"><i data-lucide="plus"></i> Yangi post qo'shish</button>
            </div>
        `;
        initIcons();
        return;
    }

    // Categorized layout blocks matching the user mockup
    const categories = [
        {
            key: 'progress',
            title: 'Jarayondagi ishlar',
            color: '#f59e0b', // Yellow/Amber
            bgHeader: '#fffbeb',
            badgeBg: '#fef3c7',
            icon: 'clock',
            items: state.smm.filter(p => p.status === 'progress')
        },
        {
            key: 'done',
            title: 'Tugallangan / Tayyorlangan ishlar',
            color: '#10b981', // Green
            bgHeader: '#ecfdf5',
            badgeBg: '#d1fae5',
            icon: 'check-circle',
            items: state.smm.filter(p => p.status === 'done')
        },
        {
            key: 'cancelled',
            title: 'Bekor qilingan ishlar',
            color: '#ef4444', // Red
            bgHeader: '#fef2f2',
            badgeBg: '#fee2e2',
            icon: 'x-circle',
            items: state.smm.filter(p => p.status === 'cancelled')
        }
    ];

    categories.forEach(cat => {
        const block = document.createElement('div');
        block.style.background = 'white';
        block.style.borderRadius = 'var(--radius-lg)';
        block.style.border = '1px solid var(--border)';
        block.style.boxShadow = 'var(--shadow-sm)';
        block.style.overflow = 'hidden';
        block.style.marginBottom = '20px';

        // Block Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.padding = '14px 20px';
        header.style.background = cat.bgHeader;
        header.style.borderBottom = `1px solid ${cat.color}20`;
        header.style.borderLeft = `5px solid ${cat.color}`;

        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i data-lucide="${cat.icon}" style="width: 16px; height: 16px; color: ${cat.color};"></i>
                <span style="font-weight: 700; font-size: 14px; color: var(--text-main); font-family: 'Outfit', sans-serif;">${cat.title}</span>
                <span style="background: ${cat.badgeBg}; color: ${cat.color}; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px; margin-left: 4px;">${cat.items.length}</span>
            </div>
        `;
        block.appendChild(header);

        // Block items container
        const listDiv = document.createElement('div');
        listDiv.style.display = 'flex';
        listDiv.style.flexDirection = 'column';

        if (cat.items.length === 0) {
            listDiv.innerHTML = `
                <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px; font-style: italic; background: #fafafa;">
                    Hozircha ushbu toifada vazifalar mavjud emas
                </div>
            `;
        } else {
            cat.items.forEach(post => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.justifyContent = 'space-between';
                row.style.padding = '14px 20px';
                row.style.borderBottom = '1px solid #f1f5f9';
                row.style.transition = 'background 0.2s';
                
                // Add soft hover row highlight
                row.onmouseover = () => { row.style.background = '#f8fafc'; };
                row.onmouseout = () => { row.style.background = 'transparent'; };

                // Status dynamic selector badge (Segmented Control)
                const statusSelector = `
                    <div style="display: flex; gap: 4px; background: #f8fafc; padding: 4px; border-radius: 12px; border: 1px solid var(--border);">
                        <button onclick="changeSmmStatus('${post.id}', 'progress')" style="background: ${post.status === 'progress' ? '#fef3c7' : 'transparent'}; color: ${post.status === 'progress' ? '#f59e0b' : '#94a3b8'}; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; transition: all 0.2s; box-shadow: ${post.status === 'progress' ? 'var(--shadow-sm)' : 'none'};" title="Jarayonda">
                            <i data-lucide="clock" style="width: 14px; height: 14px;"></i> Jarayon
                        </button>
                        <button onclick="changeSmmStatus('${post.id}', 'done')" style="background: ${post.status === 'done' ? '#d1fae5' : 'transparent'}; color: ${post.status === 'done' ? '#10b981' : '#94a3b8'}; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; transition: all 0.2s; box-shadow: ${post.status === 'done' ? 'var(--shadow-sm)' : 'none'};" title="Tugallangan">
                            <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Tayyor
                        </button>
                        <button onclick="changeSmmStatus('${post.id}', 'cancelled')" style="background: ${post.status === 'cancelled' ? '#fee2e2' : 'transparent'}; color: ${post.status === 'cancelled' ? '#ef4444' : '#94a3b8'}; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; transition: all 0.2s; box-shadow: ${post.status === 'cancelled' ? 'var(--shadow-sm)' : 'none'};" title="Bekor qilingan">
                            <i data-lucide="x-circle" style="width: 14px; height: 14px;"></i> Bekor
                        </button>
                    </div>
                `;

                const formattedTime = post.datetime ? formatSmmDateTime(post.datetime) : 'Muddat belgilanmagan';

                // Link layout binding
                let linkContent = '';
                if (post.link) {
                    linkContent = `
                        <a href="${post.link}" target="_blank" style="color: var(--primary); font-weight: 700; display: inline-flex; align-items: center; gap: 4px; text-decoration: none; font-size: 13px;" title="${post.link}">
                            <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
                            <span>Havola</span>
                        </a>
                    `;
                } else {
                    linkContent = `
                        <button onclick="addSmmLinkModal('${post.id}')" style="background: none; border: 1px dashed var(--primary); color: var(--primary); font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" onmouseover="this.style.background='#eef2ff'" onmouseout="this.style.background='none'">
                            <i data-lucide="link" style="width: 12px; height: 12px;"></i> Havola biriktirish
                        </button>
                    `;
                }

                row.innerHTML = `
                    <!-- Left: Status selector and Post Details -->
                    <div style="display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0;">
                        <div>
                            ${statusSelector}
                        </div>
                        <div style="min-width: 0; flex: 1; padding-right: 20px;">
                            <div style="font-weight: 700; color: var(--text-main); font-size: 14px; margin-bottom: 2px;">${post.title}</div>
                            <div style="color: var(--text-muted); font-size: 12px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${post.content || ''}">${post.content || 'Content plan tafsilotlari kiritilmagan'}</div>
                        </div>
                    </div>

                    <!-- Middle: Deadline -->
                    <div style="width: 180px; display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 13px;">
                        <i data-lucide="calendar" style="width: 14px; height: 14px; color: var(--primary);"></i>
                        <span style="font-weight: 500;">${formattedTime}</span>
                    </div>

                    <!-- Right: Attachment and Actions -->
                    <div style="display: flex; align-items: center; gap: 16px; width: 220px; justify-content: flex-end;">
                        <div>${linkContent}</div>
                        <div style="width: 1px; height: 16px; background: var(--border);"></div>
                        <div style="display: flex; gap: 4px;">
                            <button onclick="showEditSmmPostModal('${post.id}')" style="background: #fff7ed; border: 1px solid #ffedd5; color: #ea580c; padding: 6px 10px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;" title="Tahrirlash"><i data-lucide="edit" style="width: 12px; height: 12px;"></i></button>
                            <button onclick="confirmDeleteSmmPost('${post.id}')" style="background: none; border: none; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 6px; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'" title="O'chirish"><i data-lucide="trash-2" style="width: 16px; height: 16px;"></i></button>
                        </div>
                    </div>
                `;
                listDiv.appendChild(row);
            });
        }
        block.appendChild(listDiv);
        container.appendChild(block);
    });

    initIcons();
}

function formatSmmDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    const dt = new Date(dateTimeStr);
    if (isNaN(dt.getTime())) return dateTimeStr;
    const months = [
        "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
        "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    ];
    const day = dt.getDate();
    const month = months[dt.getMonth()];
    const hours = String(dt.getHours()).padStart(2, '0');
    const minutes = String(dt.getMinutes()).padStart(2, '0');
    return `${day}-${month}, soat ${hours}:${minutes}`;
}

window.changeSmmStatus = function(id, newStatus) {
    const post = state.smm.find(p => p.id === id);
    if (post) {
        post.status = newStatus;
        post.published = (newStatus === 'done'); // update legacy boolean fallback
        saveState();
        renderMarketingView();
        showToast("Vazifa holati muvaffaqiyatli o'zgartirildi! 🚀");
    }
};

window.toggleSmmPublishStatus = function(id) {
    const post = state.smm.find(p => p.id === id);
    if (post) {
        post.status = post.status === 'done' ? 'progress' : 'done';
        post.published = (post.status === 'done');
        saveState();
        renderMarketingView();
        showToast(post.status === 'done' ? "Post tugallangan deb belgilandi! 🎉" : "Post holati jarayonga qaytarildi.");
    }
};

window.showAddSmmPostModal = function() {
    const html = `
        <h2 style="margin-bottom:24px; font-size: 20px; font-weight: 700; color: var(--text-main); font-family: 'Outfit', sans-serif;">Yangi SMM Post / Content Plan</h2>
        <form id="add-smm-form">
            <div class="form-group">
                <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Mavzu / Vazifa (Grafik Dizayn)</label>
                <input type="text" id="smm-title" placeholder="Masalan: Photoshopda 3D tekst effekti" required style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none;">
            </div>
            <div class="form-group" style="margin-top: 16px;">
                <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Tavsif / Content Plan tafsilotlari</label>
                <textarea id="smm-content" placeholder="Post mazmuni, grafik konsepsiyasi yoki dars mavzusi tafsilotlari..." style="width: 100%; height: 100px; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none; resize: none; font-family:inherit;"></textarea>
            </div>
            <div style="display:grid; grid-template-columns: 1fr; gap:16px; margin-top: 16px;">
                <div class="form-group">
                    <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Chop etish sanasi va vaqti (Deadline)</label>
                    <input type="datetime-local" id="smm-datetime" required style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none;">
                </div>
            </div>
            <div class="form-group" style="margin-top: 16px;">
                <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Vazifa holati</label>
                <select id="smm-status" style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none; background: white; font-weight: 600;">
                    <option value="progress">⚠️ Jarayonda</option>
                    <option value="done">✅ Tugallangan / Tayyorlangan</option>
                    <option value="cancelled">❌ Bekor qilingan</option>
                </select>
            </div>
            <div class="form-group" style="margin-top: 16px;">
                <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Ijtimoiy tarmoq havolasi (Link)</label>
                <input type="url" id="smm-link" placeholder="Masalan: https://t.me/example/12" style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none;">
            </div>
            <div class="modal-footer" style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" class="btn-secondary" onclick="closeModal()">Bekor qilish</button>
                <button type="submit" class="add-new-btn">Saqlash</button>
            </div>
        </form>
    `;
    openModal(html);

    document.getElementById('add-smm-form').onsubmit = (e) => {
        e.preventDefault();
        const smmStatus = document.getElementById('smm-status').value;
        const newPost = {
            id: Date.now().toString(),
            title: document.getElementById('smm-title').value,
            content: document.getElementById('smm-content').value,
            datetime: document.getElementById('smm-datetime').value,
            link: document.getElementById('smm-link').value || '',
            status: smmStatus,
            published: (smmStatus === 'done')
        };
        state.smm.push(newPost);
        saveState();
        closeModal();
        renderMarketingView();
        showToast("Yangi SMM post muvaffaqiyatli rejalashtirildi! 🗓️");
    };
};

window.showEditSmmPostModal = function(id) {
    const post = state.smm.find(p => p.id === id);
    if (!post) return;

    const html = `
        <h2 style="margin-bottom:24px; font-size: 20px; font-weight: 700; color: var(--text-main); font-family: 'Outfit', sans-serif;">SMM Postni Tahrirlash</h2>
        <form id="edit-smm-form">
            <div class="form-group">
                <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Mavzu / Vazifa (Grafik Dizayn)</label>
                <input type="text" id="edit-smm-title" value="${post.title}" required style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none;">
            </div>
            <div class="form-group" style="margin-top: 16px;">
                <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Tavsif / Content Plan tafsilotlari</label>
                <textarea id="edit-smm-content" style="width: 100%; height: 100px; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none; resize: none; font-family:inherit;">${post.content || ''}</textarea>
            </div>
            <div style="display:grid; grid-template-columns: 1fr; gap:16px; margin-top: 16px;">
                <div class="form-group">
                    <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Chop etish sanasi va vaqti (Deadline)</label>
                    <input type="datetime-local" id="edit-smm-datetime" value="${post.datetime || ''}" required style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none;">
                </div>
            </div>
            <div class="form-group" style="margin-top: 16px;">
                <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Vazifa holati</label>
                <select id="edit-smm-status" style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none; background: white; font-weight: 600;">
                    <option value="progress" ${post.status === 'progress' ? 'selected' : ''}>⚠️ Jarayonda</option>
                    <option value="done" ${post.status === 'done' ? 'selected' : ''}>✅ Tugallangan / Tayyorlangan</option>
                    <option value="cancelled" ${post.status === 'cancelled' ? 'selected' : ''}>❌ Bekor qilingan</option>
                </select>
            </div>
            <div class="form-group" style="margin-top: 16px;">
                <label style="font-weight: 600; font-size: 14px; margin-bottom: 8px; display: block;">Post Havolasi (Link)</label>
                <input type="url" id="edit-smm-link" value="${post.link || ''}" placeholder="Masalan: https://t.me/example/1" style="width: 100%; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); outline: none;">
            </div>
            <div class="modal-footer" style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
                <button type="button" class="btn-secondary" onclick="closeModal()">Bekor qilish</button>
                <button type="submit" class="add-new-btn">Saqlash</button>
            </div>
        </form>
    `;
    openModal(html);

    document.getElementById('edit-smm-form').onsubmit = (e) => {
        e.preventDefault();
        const smmStatus = document.getElementById('edit-smm-status').value;
        post.title = document.getElementById('edit-smm-title').value;
        post.content = document.getElementById('edit-smm-content').value;
        post.datetime = document.getElementById('edit-smm-datetime').value;
        post.link = document.getElementById('edit-smm-link').value || '';
        post.status = smmStatus;
        post.published = (smmStatus === 'done');
        saveState();
        closeModal();
        renderMarketingView();
        showToast("SMM post muvaffaqiyatli yangilandi! ✍️");
    };
};

window.confirmDeleteSmmPost = function(id) {
    const post = state.smm.find(p => p.id === id);
    if (!post) return;
    
    openConfirmModal({
        title: "SMM Postni o'chirish",
        message: `"${post.title}" content rejasini butunlay o'chirishni tasdiqlaysizmi?`,
        confirmText: "O'chirish",
        onConfirm: () => {
            state.smm = state.smm.filter(p => p.id !== id);
            saveState();
            closeModal();
            renderMarketingView();
            showToast("SMM post o'chirildi", "warning");
        }
    });
};

window.addSmmLinkModal = function(id) {
    const post = state.smm.find(p => p.id === id);
    if (!post) return;
    const url = prompt("Ushbu post uchun havolani (link) kiriting:", post.link || '');
    if (url !== null) {
        post.link = url;
        saveState();
        renderMarketingView();
        showToast("Havola muvaffaqiyatli biriktirildi! 🔗");
    }
};

window.renderMarketingView = renderMarketingView;


// ==========================================
// MOODBOARD PRO MODULE IMPLEMENTATION (WIDESCREEN IMAGE-ONLY VIEWPORT)
// ==========================================

let isMoodboardInitialized = false;
let lastMouseX = null;
let lastMouseY = null;

function initMoodboardOnce() {
    if (isMoodboardInitialized) return;
    
    const viewport = document.getElementById('moodboard-viewport');
    if (!viewport) return;

    // Track mouse coordinates on viewport for key zoom focus
    viewport.addEventListener('mousemove', (e) => {
        const rect = viewport.getBoundingClientRect();
        lastMouseX = e.clientX - rect.left;
        lastMouseY = e.clientY - rect.top;
    });

    // Deselect selected node when clicking on background empty area of viewport
    viewport.addEventListener('mousedown', (e) => {
        if (e.target.id === 'moodboard-viewport' || e.target.id === 'moodboard-canvas' || e.target.id === 'moodboard-canvas-workspace') {
            state.selectedMoodboardId = null;
            document.querySelectorAll('.moodboard-node').forEach(n => {
                n.classList.remove('selected');
                n.style.outline = 'none';
            });
        }
    });

    // Figma-style click-and-drag panning on empty background
    let isPanning = false;
    let startPanX = 0, startPanY = 0;
    
    viewport.addEventListener('mousedown', (e) => {
        if (e.target.id === 'moodboard-viewport' || e.target.id === 'moodboard-canvas' || e.target.id === 'moodboard-canvas-workspace') {
            isPanning = true;
            viewport.style.cursor = 'grabbing';
            startPanX = e.clientX - (state.moodboardPanX || 0);
            startPanY = e.clientY - (state.moodboardPanY || 0);
            e.preventDefault();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        state.moodboardPanX = e.clientX - startPanX;
        state.moodboardPanY = e.clientY - startPanY;
        applyMoodboardZoom();
    });

    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            viewport.style.cursor = 'default';
        }
    });

    // Zoom on Wheel when holding Ctrl (Centered around mouse cursor pointer!)
    viewport.addEventListener('wheel', (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const rect = viewport.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            
            // Canvas coordinates before zoom
            const cx = (mx - (state.moodboardPanX || 0)) / (state.moodboardZoom || 1);
            const cy = (my - (state.moodboardPanY || 0)) / (state.moodboardZoom || 1);
            
            const zoomIntensity = 0.05;
            let scale = state.moodboardZoom || 1;
            if (e.deltaY < 0) {
                scale += zoomIntensity;
            } else {
                scale -= zoomIntensity;
            }
            scale = Math.min(Math.max(0.2, scale), 3);
            
            // Adjust pan coordinates so the point under mouse cursor pointer remains static
            state.moodboardPanX = mx - cx * scale;
            state.moodboardPanY = my - cy * scale;
            state.moodboardZoom = scale;
            
            applyMoodboardZoom();
        }
    }, { passive: false });

    // Keyboard support for Ctrl+, Ctrl-, and Delete/Backspace to remove selected cards
    window.addEventListener('keydown', (e) => {
        if (state.currentView !== 'moodboard') return;
        
        // Delete selected card when pressing Delete or Backspace, unless actively editing text
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                return; // Let backspace/delete edit the text inside textarea!
            }
            if (state.selectedMoodboardId) {
                e.preventDefault();
                deleteMoodboardItem(state.selectedMoodboardId);
            }
        }

        if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
            e.preventDefault();
            zoomMoodboard('in');
        }
        if (e.ctrlKey && e.key === '-') {
            e.preventDefault();
            zoomMoodboard('out');
        }
    });

    // Setup initial pan positions (Center the 2000px canvas within viewport on first load!)
    if (state.moodboardPanX === undefined) state.moodboardPanX = (viewport.clientWidth - 2000) / 2 || -600;
    if (state.moodboardPanY === undefined) state.moodboardPanY = (viewport.clientHeight - 2000) / 2 || -600;
    if (state.moodboardZoom === undefined) state.moodboardZoom = 1;

    isMoodboardInitialized = true;
}

function pushMoodboardHistory() {
    if (!state.moodboardHistoryUndo) state.moodboardHistoryUndo = [];
    const clone = JSON.parse(JSON.stringify(state.moodboard || []));
    state.moodboardHistoryUndo.push(clone);
    state.moodboardHistoryRedo = []; // clear redo stack
    if (state.moodboardHistoryUndo.length > 30) {
        state.moodboardHistoryUndo.shift(); // keep last 30 states
    }
}

function renderMoodboardView() {
    initMoodboardOnce();
    applyMoodboardZoom();

    const canvas = document.getElementById('moodboard-canvas');
    if (!canvas) return;
    canvas.innerHTML = '';

    if (!state.moodboard) {
        state.moodboard = JSON.parse(localStorage.getItem('edu_moodboard')) || [];
    }

    // Onboarding beautiful empty state
    if (state.moodboard.length === 0) {
        canvas.innerHTML = `
            <div style="position: absolute; top: 35%; left: 35%; transform: translate(-50%, -50%); text-align: center; background: white; border: 1px dashed #cbd5e1; border-radius: var(--radius-lg); padding: 40px; box-shadow: var(--shadow-md); max-width: 420px; z-index: 10; pointer-events: auto;">
                <div style="width: 64px; height: 64px; background: #ede9fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #8b5cf6;">
                    <i data-lucide="layout" style="width: 32px; height: 32px;"></i>
                </div>
                <h3 style="font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Moodboard bo'sh</h3>
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px; line-height: 1.5;">Dizayn namunalari va rasmlarni kompyuterdan yuklang yoki havola (URL) orqali qo'shing va cheksiz maydonda erkin tahrirlang.</p>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button onclick="document.getElementById('moodboard-file-input').click()" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--primary); color: white; border: none; padding: 12px; border-radius: var(--radius-md); font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='var(--primary-dark)'" onmouseout="this.style.background='var(--primary)'">
                        <i data-lucide="upload-cloud" style="width: 16px; height: 16px;"></i>
                        Kompyuterdan rasm yuklash
                    </button>
                    <button onclick="showAddMoodboardUrlModal()" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: #f1f5f9; color: var(--text-main); border: none; padding: 12px; border-radius: var(--radius-md); font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
                        <i data-lucide="link" style="width: 16px; height: 16px;"></i>
                        Havola (URL) orqali qo'shish
                    </button>
                </div>
            </div>
        `;
        initIcons();
        return;
    }

    state.moodboard.forEach(item => {
        const node = document.createElement('div');
        node.className = 'moodboard-node';
        if (item.id === state.selectedMoodboardId) {
            node.classList.add('selected');
            node.style.outline = '2px solid #8b5cf6';
            node.style.outlineOffset = '2px';
        }
        node.setAttribute('data-id', item.id);
        node.style.position = 'absolute';
        node.style.left = `${item.x}px`;
        node.style.top = `${item.y}px`;
        node.style.width = `${item.width}px`;
        node.style.height = `${item.height}px`;
        node.style.display = 'flex';
        node.style.flexDirection = 'column';
        node.style.background = 'white';
        node.style.borderRadius = 'var(--radius-md)';
        node.style.boxShadow = 'var(--shadow-md)';
        node.style.zIndex = '5';

        if (item.type === 'text') {
            node.style.border = '1px dashed #8b5cf6';
            node.innerHTML = `
                <div class="node-drag-handle" style="height: 28px; background: #f8fafc; display: flex; align-items: center; justify-content: space-between; padding: 0 10px; cursor: move; border-bottom: 1px solid var(--border); font-size: 11px; color: var(--text-muted); font-weight: 700; user-select: none;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="type" style="width: 12px; height: 12px; color: #8b5cf6;"></i>
                        <span>Matn Bloqi</span>
                    </div>
                    <button onclick="event.stopPropagation(); deleteMoodboardItem('${item.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 2px;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#ef4444'"><i data-lucide="x" style="width: 14px; height: 14px;"></i></button>
                </div>
                <div style="flex: 1; width: 100%; height: calc(100% - 28px); position: relative; background: #fafafa; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 6px;">
                    <textarea style="width: 100%; height: 100%; border: none; background: transparent; resize: none; font-size: 14px; font-family: 'Inter', sans-serif; color: var(--text-main); outline: none; text-align: left; font-weight: 500; line-height: 1.4;" oninput="updateMoodboardText('${item.id}', this.value)" placeholder="Matn yozing...">${item.text || ''}</textarea>
                </div>
                <!-- Freeform Corner Resize Handle -->
                <div class="node-resize-handle" style="position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; cursor: se-resize; z-index: 10; background: linear-gradient(135deg, transparent 40%, #94a3b8 40%); border-bottom-right-radius: var(--radius-md);"></div>
            `;
        } else {
            node.style.border = '1px solid var(--border)';
            node.innerHTML = `
                <div class="node-drag-handle" style="height: 28px; background: #f8fafc; display: flex; align-items: center; justify-content: space-between; padding: 0 10px; cursor: move; border-bottom: 1px solid var(--border); font-size: 11px; color: var(--text-muted); font-weight: 700; user-select: none;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="image" style="width: 12px; height: 12px; color: #8b5cf6;"></i>
                        <span>Dizayn Asset</span>
                    </div>
                    <button onclick="event.stopPropagation(); deleteMoodboardItem('${item.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 2px;" onmouseover="this.style.color='#dc2626'" onmouseout="this.style.color='#ef4444'"><i data-lucide="x" style="width: 14px; height: 14px;"></i></button>
                </div>
                <div style="flex: 1; width: 100%; height: calc(100% - 28px); position: relative; background: #fafafa; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 4px;">
                    <img src="${item.src}" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none; border-radius: 6px;">
                </div>
                <!-- Proportional Corner Resize Handle -->
                <div class="node-resize-handle" style="position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; cursor: se-resize; z-index: 10; background: linear-gradient(135deg, transparent 40%, #94a3b8 40%); border-bottom-right-radius: var(--radius-md);"></div>
            `;
        }
        
        canvas.appendChild(node);
        
        // Selection handling on click
        node.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            if (state.selectedMoodboardId !== item.id) {
                state.selectedMoodboardId = item.id;
                document.querySelectorAll('.moodboard-node').forEach(n => {
                    n.classList.remove('selected');
                    n.style.outline = 'none';
                });
                node.classList.add('selected');
                node.style.outline = '2px solid #8b5cf6';
                node.style.outlineOffset = '2px';
            }
        });

        // Setup dragging (drag from anywhere on the card!)
        makeNodeDraggable(node, node);

        // Setup resizing with or without proportional aspect ratio preservation
        const resizeHandle = node.querySelector('.node-resize-handle');
        if (item.type === 'text') {
            makeNodeResizable(node, resizeHandle, null);
        } else {
            const ratio = item.ratio || (item.width / item.height);
            makeNodeResizable(node, resizeHandle, ratio);
        }
    });

    initIcons();
}

function makeNodeDraggable(elmnt, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if (e.button !== 0) return; // Only drag on left click
        
        // Skip drag if clicking on delete button (X), corner resize handle, or typing inside a text field
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.closest('button') || e.target.classList.contains('node-resize-handle')) {
            return; // Let browser process focus and typing!
        }

        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        const scale = state.moodboardZoom || 1;
        pos1 = (pos3 - e.clientX) / scale;
        pos2 = (pos4 - e.clientY) / scale;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        let newTop = elmnt.offsetTop - pos2;
        let newLeft = elmnt.offsetLeft - pos1;
        
        // Clamp bounds precisely inside the 2m x 2m (2000px x 2000px) workspace canvas!
        const maxLeft = 2000 - elmnt.offsetWidth;
        const maxTop = 2000 - elmnt.offsetHeight;

        if (newTop < 0) newTop = 0;
        if (newTop > maxTop) newTop = maxTop;
        if (newLeft < 0) newLeft = 0;
        if (newLeft > maxLeft) newLeft = maxLeft;
        
        elmnt.style.top = `${newTop}px`;
        elmnt.style.left = `${newLeft}px`;
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        saveAllMoodboardStates();
    }
}

function makeNodeResizable(elmnt, resizeHandle, originalRatio) {
    let startWidth, startHeight, startX, startY;
    resizeHandle.onmousedown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        pushMoodboardHistory();
        startWidth = elmnt.offsetWidth;
        startHeight = elmnt.offsetHeight;
        startX = e.clientX;
        startY = e.clientY;
        document.onmouseup = stopResize;
        document.onmousemove = startResize;
    };

    function startResize(e) {
        e.preventDefault();
        const scale = state.moodboardZoom || 1;
        const dx = (e.clientX - startX) / scale;

        let newWidth = startWidth + dx;
        if (newWidth < 80) newWidth = 80;

        let newHeight;
        if (originalRatio) {
            // Maintain exact aspect ratio beautifully for images!
            newHeight = newWidth / originalRatio;
        } else {
            // Freeform resizing for text boxes
            const dy = (e.clientY - startY) / scale;
            newHeight = startHeight + dy;
            if (newHeight < 40) newHeight = 40;
        }

        elmnt.style.width = `${newWidth}px`;
        elmnt.style.height = `${newHeight}px`;
    }

    function stopResize() {
        document.onmouseup = null;
        document.onmousemove = null;
        saveAllMoodboardStates();
    }
}

function saveAllMoodboardStates() {
    const canvas = document.getElementById('moodboard-canvas');
    if (!canvas) return;
    const nodes = canvas.querySelectorAll('.moodboard-node');
    let updated = false;
    nodes.forEach(node => {
        const id = node.getAttribute('data-id');
        const item = state.moodboard.find(m => m.id === id);
        if (item) {
            const x = node.offsetLeft;
            const y = node.offsetTop;
            const width = node.offsetWidth;
            const height = node.offsetHeight;
            if (item.x !== x || item.y !== y || item.width !== width || item.height !== height) {
                item.x = x;
                item.y = y;
                item.width = width;
                item.height = height;
                updated = true;
            }
        }
    });
    if (updated) {
        saveState();
    }
}

window.deleteMoodboardItem = function(id) {
    pushMoodboardHistory();
    state.moodboard = state.moodboard.filter(m => m.id !== id);
    if (state.selectedMoodboardId === id) state.selectedMoodboardId = null;
    saveState();
    renderMoodboardView();
    showToast("Asset moodboarddan olib tashlandi", "warning");
};

window.deleteSelectedMoodboardItem = function() {
    if (state.selectedMoodboardId) {
        window.deleteMoodboardItem(state.selectedMoodboardId);
    } else {
        showToast("O'chirish uchun avval rasm yoki matn ustiga bosing!", "info");
    }
};

window.handleMoodboardFileUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Src = e.target.result;
        addNewMoodboardItem(base64Src);
    };
    reader.readAsDataURL(file);
    // Clear input
    event.target.value = '';
};

window.showAddMoodboardUrlModal = function() {
    const url = prompt("Internetdagi rasm havolasini (URL) kiriting:\n(Masalan: https://images.unsplash.com/photo-1507238691740-187a5b1d37b8)");
    if (url) {
        addNewMoodboardItem(url);
    }
};

function addNewMoodboardItem(src) {
    const img = new Image();
    img.onload = function() {
        pushMoodboardHistory();
        const naturalWidth = img.naturalWidth || 300;
        const naturalHeight = img.naturalHeight || 200;
        const ratio = naturalWidth / naturalHeight;
        
        // Default standard image bounds
        const width = 300;
        const height = 300 / ratio;

        const randomOffset = Math.floor(Math.random() * 60);
        
        // Place precisely in center of user visible viewport
        const panX = state.moodboardPanX || 0;
        const panY = state.moodboardPanY || 0;
        const zoom = state.moodboardZoom || 1;
        
        const viewport = document.getElementById('moodboard-viewport');
        const viewWidth = viewport ? viewport.clientWidth : 800;
        const viewHeight = viewport ? viewport.clientHeight : 500;
        
        const centerX = (viewWidth / 2 - panX - (width * zoom) / 2) / zoom;
        const centerY = (viewHeight / 2 - panY - (height * zoom) / 2) / zoom;

        const newItem = {
            id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
            src: src,
            x: Math.max(50, centerX + randomOffset),
            y: Math.max(50, centerY + randomOffset),
            width: width,
            height: height,
            ratio: ratio
        };

        if (!state.moodboard) state.moodboard = [];
        state.moodboard.push(newItem);
        saveState();
        renderMoodboardView();
        showToast("Rasm muvaffaqiyatli yuklandi! 🖼️");
    };
    img.onerror = function() {
        showToast("Rasm yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.", "danger");
    };
    img.src = src;
}

window.addMoodboardTextNode = function() {
    pushMoodboardHistory();
    
    // Center of user viewport
    const panX = state.moodboardPanX || 0;
    const panY = state.moodboardPanY || 0;
    const zoom = state.moodboardZoom || 1;
    
    const viewport = document.getElementById('moodboard-viewport');
    const viewWidth = viewport ? viewport.clientWidth : 800;
    const viewHeight = viewport ? viewport.clientHeight : 500;
    
    const width = 250;
    const height = 120;
    const randomOffset = Math.floor(Math.random() * 60);

    const centerX = (viewWidth / 2 - panX - (width * zoom) / 2) / zoom;
    const centerY = (viewHeight / 2 - panY - (height * zoom) / 2) / zoom;

    const newItem = {
        id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        type: 'text',
        text: '',
        x: Math.max(50, centerX + randomOffset),
        y: Math.max(50, centerY + randomOffset),
        width: width,
        height: height
    };

    if (!state.moodboard) state.moodboard = [];
    state.moodboard.push(newItem);
    saveState();
    renderMoodboardView();
    showToast("Matn bloqi qo'shildi! ✍️");
};

window.updateMoodboardText = function(id, textValue) {
    const item = state.moodboard.find(m => m.id === id);
    if (item) {
        item.text = textValue;
        saveState();
    }
};

window.clearMoodboard = function() {
    openConfirmModal({
        title: "Moodboardni tozalash",
        message: "Butun moodboard maydonidagi barcha yuklangan rasmlarni o'chirib yuborishni xohlaysizmi?",
        confirmText: "Tozalash",
        onConfirm: () => {
            pushMoodboardHistory();
            state.moodboard = [];
            state.selectedMoodboardId = null;
            saveState();
            closeModal();
            renderMoodboardView();
            showToast("Moodboard toliq tozalandi", "warning");
        }
    });
};

window.undoMoodboard = function() {
    if (!state.moodboardHistoryUndo || state.moodboardHistoryUndo.length === 0) {
        showToast("Orqaga qaytarish uchun amallar yo'q", "info");
        return;
    }
    if (!state.moodboardHistoryRedo) state.moodboardHistoryRedo = [];
    const currentClone = JSON.parse(JSON.stringify(state.moodboard || []));
    state.moodboardHistoryRedo.push(currentClone);

    const previousState = state.moodboardHistoryUndo.pop();
    state.moodboard = previousState;
    saveState();
    renderMoodboardView();
    showToast("Amal orqaga qaytarildi ↩️");
};

window.redoMoodboard = function() {
    if (!state.moodboardHistoryRedo || state.moodboardHistoryRedo.length === 0) {
        showToast("Oldinga o'tkazish uchun amallar yo'q", "info");
        return;
    }
    const currentClone = JSON.parse(JSON.stringify(state.moodboard || []));
    state.moodboardHistoryUndo.push(currentClone);

    const nextState = state.moodboardHistoryRedo.pop();
    state.moodboard = nextState;
    saveState();
    renderMoodboardView();
    showToast("Amal oldinga qaytarildi ↪️");
};

window.zoomMoodboard = function(dir) {
    let scale = state.moodboardZoom || 1;
    
    const viewport = document.getElementById('moodboard-viewport');
    let mx = lastMouseX;
    let my = lastMouseY;
    
    if (viewport && (mx === null || my === null)) {
        mx = viewport.clientWidth / 2;
        my = viewport.clientHeight / 2;
    }
    
    // Convert to canvas coordinates before zooming
    const cx = (mx - (state.moodboardPanX || 0)) / scale;
    const cy = (my - (state.moodboardPanY || 0)) / scale;

    if (dir === 'in') {
        scale += 0.1;
    } else if (dir === 'out') {
        scale -= 0.1;
    }
    scale = Math.min(Math.max(0.2, scale), 3);
    
    // Adjust pan coordinate to align zoom focal point
    state.moodboardPanX = mx - cx * scale;
    state.moodboardPanY = my - cy * scale;
    state.moodboardZoom = scale;
    
    applyMoodboardZoom();
};

function applyMoodboardZoom() {
    const workspace = document.getElementById('moodboard-canvas-workspace');
    if (!workspace) return;
    const scale = state.moodboardZoom || 1;
    const panX = state.moodboardPanX || 0;
    const panY = state.moodboardPanY || 0;
    workspace.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    
    const indicator = document.getElementById('moodboard-zoom-percent');
    if (indicator) {
        indicator.textContent = `${Math.round(scale * 100)}%`;
    }
}

window.renderMoodboardView = renderMoodboardView;

// --- LIVE CLOCK INITIALIZATION ---
setInterval(() => {
    const clock = document.getElementById('live-clock-display');
    if (clock) {
        const d = new Date();
        clock.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
}, 1000);

// --- TASKS SPLIT LOGIC ---
function renderCategoryTasks(category) {
    const containerId = category === 'edu' ? 'edu-tasks-container' : 'marketing-tasks-container';
    const container = document.getElementById(containerId);
    if (!container) return;

    // Migrate old tasks if they don't have category
    let needSave = false;
    state.tasks.forEach(t => {
        if (!t.category) {
            t.category = 'edu';
            needSave = true;
        }
    });
    if (needSave) saveState();

    const catTasks = state.tasks.filter(t => t.category === category);
    const todayTasks = catTasks.filter(t => t.type === 'today' && !t.completed);
    const weeklyTasks = catTasks.filter(t => t.type === 'weekly' && !t.completed);
    const completedTasks = catTasks.filter(t => t.completed);

    const isEdu = category === 'edu';
    
    // Theme configurations
    const themeColor = isEdu ? '#3b82f6' : '#a855f7';
    const themeLight = isEdu ? '#eff6ff' : '#faf5ff';
    const themeBorder = isEdu ? '#bfdbfe' : '#f3e8ff';
    const themeText = isEdu ? '#1e3a8a' : '#581c87';
    const themeGrad = isEdu ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #a855f7, #7e22ce)';

    container.innerHTML = `
        <div class="tasks-section" style="margin-top: 48px; border-top: 1px dashed var(--border); padding-top: 32px;">
            <div class="section-header" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="font-size: 24px; font-weight: 700; color: var(--text-main); font-family: 'Outfit', sans-serif; display: flex; align-items: center; gap: 10px;">
                        ${isEdu ? '📖 O\'quv Vazifalari' : '📢 Marketing Vazifalari'}
                    </h2>
                    <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">${isEdu ? "O'quv rejalari va kunlik o'qituvchi vazifalari" : "Ijtimoiy tarmoqlar va reklama vazifalari"}</p>
                </div>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <button class="btn-secondary" onclick="clearCategoryCompletedTasks('${category}')" style="padding: 10px 16px; font-weight: 500; font-size: 13px; border-radius: 8px; border: 1px solid ${themeBorder}; color: ${themeColor}; background: ${themeLight};">
                        Bajarilganlarni o'chir
                    </button>
                    <button class="add-new-btn" onclick="openAddCategoryTaskModal('${category}')" style="background: ${themeGrad}; padding: 10px 16px; font-weight: 600; border-radius: 8px; display: flex; align-items: center; gap: 6px; border: none; color: white; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-1px)'" onmouseout="this.style.transform='none'">
                        <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Yangi vazifa
                    </button>
                </div>
            </div>
            
            <div class="tasks-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <!-- Today -->
                <div class="tasks-card" style="background: white; border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); border: 1px solid var(--border); border-top: 4px solid ${themeColor};">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
                        <span style="font-size: 20px;">⚡</span>
                        <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main);">Bugungi vazifalar</h3>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${todayTasks.length === 0 ? '<div style="color: var(--text-muted); font-style: italic; font-size: 13px; text-align: center; padding: 20px 0;">Bugungi faol vazifalar yo\'q</div>' : todayTasks.map(t => generateTaskHtml(t, category)).join('')}
                    </div>
                </div>
                
                <!-- Weekly -->
                <div class="tasks-card" style="background: white; border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); border: 1px solid var(--border); border-top: 4px solid ${themeColor};">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
                        <span style="font-size: 20px;">📅</span>
                        <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main);">Haftalik vazifalar</h3>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${weeklyTasks.length === 0 ? '<div style="color: var(--text-muted); font-style: italic; font-size: 13px; text-align: center; padding: 20px 0;">Haftalik vazifalar yo\'q</div>' : weeklyTasks.map(t => generateTaskHtml(t, category)).join('')}
                    </div>
                </div>

                <!-- Completed -->
                <div class="tasks-card" style="grid-column: 1 / -1; background: ${themeLight}; border-radius: var(--radius-lg); padding: 24px; border: 1px solid ${themeBorder};">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid ${themeBorder}; padding-bottom: 12px;">
                        <span style="font-size: 20px;">✅</span>
                        <h3 style="font-size: 16px; font-weight: 700; color: ${themeText};">Bajarilgan vazifalar</h3>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${completedTasks.length === 0 ? '<div style="color: var(--text-muted); font-style: italic; font-size: 13px; text-align: center; padding: 20px 0;">Bajarilgan vazifalar yo\'q</div>' : completedTasks.map(t => generateTaskHtml(t, category)).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
}

function generateTaskHtml(task, category) {
    const isEdu = category === 'edu';
    const themeColor = isEdu ? '#3b82f6' : '#a855f7';
    const themeLight = isEdu ? '#eff6ff' : '#faf5ff';
    const themeBorder = isEdu ? '#bfdbfe' : '#f3e8ff';
    const themeText = isEdu ? '#1e40af' : '#6b21a8';

    if (task.completed) {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: white; border: 1px solid ${themeBorder}; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="checkbox" checked onchange="toggleCategoryTask('${task.id}', '${category}')" style="accent-color: ${themeColor}; cursor: pointer; width: 16px; height: 16px;">
                    <span style="font-size: 14px; color: var(--text-muted); text-decoration: line-through;">${task.text}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 11px; font-weight: 700; color: ${themeText}; background: ${themeLight}; padding: 4px 8px; border-radius: 20px;"><i data-lucide="check" style="width: 12px; height: 12px; display: inline-block; vertical-align: bottom;"></i> Bajarildi</span>
                    <button onclick="deleteCategoryTask('${task.id}', '${category}')" style="background: none; border: none; color: #94a3b8; cursor: pointer;" title="O'chirish"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                </div>
            </div>
        `;
    }
    
    return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f8fafc; border: 1px solid var(--border); border-radius: 12px; transition: all 0.2s;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <input type="checkbox" onchange="toggleCategoryTask('${task.id}', '${category}')" style="accent-color: ${themeColor}; cursor: pointer; width: 16px; height: 16px;">
                <span style="font-size: 14px; color: var(--text-main); font-weight: 500;">${task.text}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 11px; font-weight: 700; color: ${task.type === 'today' ? '#ea580c' : '#10b981'}; background: ${task.type === 'today' ? '#ffedd5' : '#d1fae5'}; padding: 4px 8px; border-radius: 20px;">${task.type === 'today' ? 'Bugun' : 'Hafta'}</span>
                <button onclick="deleteCategoryTask('${task.id}', '${category}')" style="background: none; border: none; color: #94a3b8; cursor: pointer;" title="O'chirish"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
            </div>
        </div>
    `;
}

window.toggleCategoryTask = function(taskId, category) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveState();
        renderCategoryTasks(category);
        renderDashboard(); 
    }
};

window.deleteCategoryTask = function(taskId, category) {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    saveState();
    renderCategoryTasks(category);
    renderDashboard();
};

window.clearCategoryCompletedTasks = function(category) {
    state.tasks = state.tasks.filter(t => t.category !== category || !t.completed);
    saveState();
    renderCategoryTasks(category);
    renderDashboard();
    showToast("Bajarilgan vazifalar tozalandi!");
};

window.openAddCategoryTaskModal = function(category) {
    const isEdu = category === 'edu';
    const themeColor = isEdu ? '#3b82f6' : '#a855f7';
    const themeLight = isEdu ? '#eff6ff' : '#faf5ff';
    const themeGrad = isEdu ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'linear-gradient(135deg, #a855f7, #7e22ce)';

    const html = `
        <div style="padding: 12px 0;">
            <div style="width: 56px; height: 56px; background: ${themeLight}; color: ${themeColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; font-size: 24px;">
                <i data-lucide="${isEdu ? 'book-open' : 'megaphone'}"></i>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 8px; text-align: center;">Yangi Vazifa Qo'shish</h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px; text-align: center;">
                ${isEdu ? "O'quv" : "Marketing"} bo'limi uchun yangi vazifani kiriting.
            </p>
            
            <form id="add-cat-task-form">
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">Vazifa nomi</label>
                    <input type="text" id="cat-task-text" required placeholder="${isEdu ? 'Masalan: Uy vazifalarini tekshirish' : 'Masalan: Instagram post tayyorlash'}" style="width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 14px; outline: none;" onfocus="this.style.borderColor='${themeColor}'" onblur="this.style.borderColor='var(--border)'">
                </div>
                <div style="margin-bottom: 24px;">
                    <label style="display: block; font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 8px;">Muddat turi</label>
                    <select id="cat-task-type" style="width: 100%; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 14px; outline: none; background: white;">
                        <option value="today">Bugun (Shoshilinch)</option>
                        <option value="weekly">Haftalik (Odatiy)</option>
                    </select>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 12px;">
                    <button type="button" class="btn-secondary" onclick="closeModal()" style="padding: 10px 24px; font-weight: 600;">Bekor</button>
                    <button type="submit" class="add-new-btn" style="background: ${themeGrad}; padding: 10px 24px; font-weight: 600; border: none; color: white; border-radius: var(--radius-md); cursor: pointer;">Qo'shish</button>
                </div>
            </form>
        </div>
    `;
    openModal(html);
    if (window.lucide) lucide.createIcons();
    
    document.getElementById('add-cat-task-form').onsubmit = (e) => {
        e.preventDefault();
        const text = document.getElementById('cat-task-text').value;
        const type = document.getElementById('cat-task-type').value;
        state.tasks.push({
            id: 'task-' + Date.now(),
            text: text,
            type: type,
            category: category,
            completed: false
        });
        saveState();
        closeModal();
        renderCategoryTasks(category);
        renderDashboard();
        showToast("Vazifa muvaffaqiyatli qo'shildi! ✅");
    };
};

setTimeout(() => {
    renderCategoryTasks('edu');
    renderCategoryTasks('marketing');
}, 500);

