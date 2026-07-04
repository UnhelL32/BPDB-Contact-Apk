/* ==========================================================================
   BPDB OFFICERS CONTACT DIRECTORY - APPLICATION LOGIC
   ========================================================================== */

// --- Global Application State ---
const state = {
    language: localStorage.getItem('bpdb_lang') || 'en', // 'en' or 'bn'
    theme: localStorage.getItem('bpdb_theme') || 'dark', // 'dark' or 'light'
    activeOfficeIndex: 0, // Index of selected office in contacts database
    searchQuery: '',
    officeFilterQuery: '',
    renderedContactsCount: 50, // Lazy loading card counter
    searchResultContacts: [], // Contacts matching global search
    userRole: 'user', // 'user' or 'admin'
    activeTab: 'dashboard', // 'dashboard' or 'directory'
    engineers: [] // Loaded contacts database
};

// --- DOM References ---
let elements = {};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Map DOM Elements
    elements = {
        body: document.body,
        authView: document.getElementById('auth-view'),
        appContainer: document.getElementById('app-container'),
        loginForm: document.getElementById('loginForm'),
        userIdInput: document.getElementById('userId'),
        passwordInput: document.getElementById('password'),
        loginError: document.getElementById('loginError'),
        loginErrorText: document.getElementById('loginErrorText'),
        
        appTitle: document.getElementById('appTitle'),
        appSubtitle: document.getElementById('appSubtitle'),
        globalSearchInput: document.getElementById('globalSearchInput'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        langToggleBtn: document.getElementById('langToggleBtn'),
        langLabel: document.getElementById('langLabel'),
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        themeIconSun: document.getElementById('themeIconSun'),
        themeIconMoon: document.getElementById('themeIconMoon'),
        roleBadge: document.getElementById('roleBadge'),
        
        btnTabDashboard: document.getElementById('btnTabDashboard'),
        btnTabDirectory: document.getElementById('btnTabDirectory'),
        tabDashboardLabel: document.getElementById('tabDashboardLabel'),
        tabDirectoryLabel: document.getElementById('tabDirectoryLabel'),
        sidebarOfficePanel: document.getElementById('sidebarOfficePanel'),
        sidebarTitle: document.getElementById('sidebarTitle'),
        totalOfficesLabel: document.getElementById('totalOfficesLabel'),
        officeSearchInput: document.getElementById('officeSearchInput'),
        officeListContainer: document.getElementById('officeListContainer'),
        devStampLabel: document.getElementById('devStampLabel'),
        
        contentArea: document.querySelector('.content-area'),
        tabDashboardView: document.getElementById('tab-dashboard-view'),
        tabDirectoryView: document.getElementById('tab-directory-view'),
        
        welcomeBadgeLabel: document.getElementById('welcomeBadgeLabel'),
        welcomeTitle: document.getElementById('welcomeTitle'),
        welcomeDesc: document.getElementById('welcomeDesc'),
        statTotalContacts: document.getElementById('statTotalContacts'),
        lblTotalContacts: document.getElementById('lblTotalContacts'),
        statTotalOffices: document.getElementById('statTotalOffices'),
        lblTotalOffices: document.getElementById('lblTotalOffices'),
        statTotalPhone: document.getElementById('statTotalPhone'),
        lblTotalPhone: document.getElementById('lblTotalPhone'),
        statTotalEmail: document.getElementById('statTotalEmail'),
        lblTotalEmail: document.getElementById('lblTotalEmail'),
        breakdownTitle: document.getElementById('breakdownTitle'),
        breakdownDesc: document.getElementById('breakdownDesc'),
        seniorityBreakdownList: document.getElementById('seniorityBreakdownList'),
        devProfileQuote: document.getElementById('devProfileQuote'),
        
        officeBanner: document.getElementById('officeBanner'),
        currentOfficeTitle: document.getElementById('currentOfficeTitle'),
        currentOfficeTitleBn: document.getElementById('currentOfficeTitleBn'),
        departmentLabel: document.getElementById('departmentLabel'),
        contactCountLabel: document.getElementById('contactCountLabel'),
        adminAddContactBtn: document.getElementById('adminAddContactBtn'),
        lblAddContact: document.getElementById('lblAddContact'),
        
        contactsGrid: document.getElementById('contactsGrid'),
        emptyStateCard: document.getElementById('emptyStateCard'),
        emptyTitle: document.getElementById('emptyTitle'),
        emptyDesc: document.getElementById('emptyDesc'),
        backToTopBtn: document.getElementById('backToTopBtn'),
        toastContainer: document.getElementById('toastContainer'),
        
        contactModal: document.getElementById('contactModal'),
        contactForm: document.getElementById('contactForm'),
        modalTitle: document.getElementById('modalTitle'),
        editOriginalCode: document.getElementById('editOriginalCode'),
        editOriginalOffice: document.getElementById('editOriginalOffice'),
        btnSubmitForm: document.getElementById('btnSubmitForm'),
        cCode: document.getElementById('cCode'),
        cName: document.getElementById('cName'),
        cNameBn: document.getElementById('cNameBn'),
        cOffice: document.getElementById('cOffice'),
        cOfficeBn: document.getElementById('cOfficeBn'),
        cDept: document.getElementById('cDept'),
        cDesig: document.getElementById('cDesig'),
        cDesigBn: document.getElementById('cDesigBn'),
        cContact: document.getElementById('cContact'),
        cEmail: document.getElementById('cEmail')
    };

    // 2. Load Local Database
    loadDatabase();
    
    // 3. Check Session Security Gate
    checkAuthSession();
    
    // 4. Set Initial Themes & Language Text
    applyTheme(state.theme);
    applyLanguage(state.language);
    
    // 5. Connect Infinite Scroll/Lazy Load listener
    elements.contentArea.addEventListener('scroll', handleContentScroll);
    elements.globalSearchInput.addEventListener('input', handleGlobalSearch);
});

// --- Security Authentication Gate Logic ---
function checkAuthSession() {
    const isAuthenticated = sessionStorage.getItem('bpdb_contact_auth') === 'true';
    state.userRole = sessionStorage.getItem('bpdb_contact_role') || 'user';
    
    if (isAuthenticated) {
        elements.authView.classList.add('hidden');
        elements.appContainer.classList.remove('hidden');
        
        // Show role badge in header
        if (state.userRole === 'admin') {
            elements.roleBadge.innerText = 'Admin';
            elements.roleBadge.className = 'user-role-badge role-admin';
            elements.adminAddContactBtn.classList.remove('hidden');
        } else {
            elements.roleBadge.innerText = state.language === 'en' ? 'User' : 'ইউজার';
            elements.roleBadge.className = 'user-role-badge';
            elements.adminAddContactBtn.classList.add('hidden');
        }
        
        // Initialize Dashboard stats and render
        calculateDashboardStats();
        renderSidebar();
        selectOffice(state.activeOfficeIndex);
        switchTab(state.activeTab);
        
        lucide.createIcons();
    } else {
        elements.authView.classList.remove('hidden');
        elements.appContainer.classList.add('hidden');
        lucide.createIcons();
    }
}

function handleLogin(event) {
    event.preventDefault();
    const userId = elements.userIdInput.value.trim();
    const password = elements.passwordInput.value;
    
    elements.loginError.classList.add('hidden');
    
    if (userId === 'BPDB') {
        if (password === '2026') {
            // Regular user login
            sessionStorage.setItem('bpdb_contact_auth', 'true');
            sessionStorage.setItem('bpdb_contact_role', 'user');
            
            elements.userIdInput.value = '';
            elements.passwordInput.value = '';
            checkAuthSession();
            showToast(state.language === 'en' ? 'Welcome!' : 'স্বাগতম!');
        } else if (password === '1091514m@H') {
            // Admin user login
            sessionStorage.setItem('bpdb_contact_auth', 'true');
            sessionStorage.setItem('bpdb_contact_role', 'admin');
            
            elements.userIdInput.value = '';
            elements.passwordInput.value = '';
            checkAuthSession();
            showToast(state.language === 'en' ? 'Admin Access Granted' : 'এডমিন প্রবেশাধিকার মঞ্জুর!');
        } else {
            showLoginError(state.language === 'en' ? 'Invalid password. Try again.' : 'ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।');
        }
    } else {
        showLoginError(state.language === 'en' ? 'Invalid User ID. Try again.' : 'ভুল ইউজার আইডি। আবার চেষ্টা করুন।');
    }
}

function showLoginError(msg) {
    elements.loginErrorText.innerText = msg;
    elements.loginError.classList.remove('hidden');
}

function handleLogout() {
    sessionStorage.removeItem('bpdb_contact_auth');
    sessionStorage.removeItem('bpdb_contact_role');
    checkAuthSession();
}

// --- Local Storage Database Helper ---
function loadDatabase() {
    const localDb = localStorage.getItem('bpdb_contacts_db');
    if (localDb) {
        try {
            state.engineers = JSON.parse(localDb);
        } catch (e) {
            console.error('Local Storage database corrupted, rebuilding...', e);
            state.engineers = [...CONTACTS_DATA];
            saveDatabase();
        }
    } else {
        state.engineers = [...CONTACTS_DATA];
        saveDatabase();
    }
}

function saveDatabase() {
    localStorage.setItem('bpdb_contacts_db', JSON.stringify(state.engineers));
}

// --- Dashboard Statistics Calculations ---
function calculateDashboardStats() {
    let totalContacts = 0;
    let totalPhone = 0;
    let totalEmail = 0;
    
    // Categorized Seniority stats
    const headcountBreakdown = {
        board: 0,   // score 0-1
        exec: 0,    // score 2-4
        officer: 0, // score 5-7
        staff: 0,   // score 8-9
        field: 0    // score 10+
    };

    state.engineers.forEach(office => {
        office.contacts.forEach(c => {
            totalContacts++;
            if (c.contact && c.contact.trim()) totalPhone++;
            if (c.email && c.email.trim()) totalEmail++;
            
            if (c.score <= 1) headcountBreakdown.board++;
            else if (c.score <= 4) headcountBreakdown.exec++;
            else if (c.score <= 7) headcountBreakdown.officer++;
            else if (c.score <= 9) headcountBreakdown.staff++;
            else headcountBreakdown.field++;
        });
    });

    // Populate counts in dashboard UI
    elements.statTotalContacts.innerText = state.language === 'en' ? totalContacts.toLocaleString() : replaceDigitsBn(totalContacts.toLocaleString());
    elements.statTotalOffices.innerText = state.language === 'en' ? state.engineers.length.toLocaleString() : replaceDigitsBn(state.engineers.length.toLocaleString());
    elements.statTotalPhone.innerText = state.language === 'en' ? totalPhone.toLocaleString() : replaceDigitsBn(totalPhone.toLocaleString());
    elements.statTotalEmail.innerText = state.language === 'en' ? totalEmail.toLocaleString() : replaceDigitsBn(totalEmail.toLocaleString());

    // Render seniorities list on dashboard
    renderDashboardBreakdown(headcountBreakdown, totalContacts);
}

function renderDashboardBreakdown(stats, total) {
    elements.seniorityBreakdownList.innerHTML = '';

    const tiers = [
        { key: 'board', en: 'Board Executives', bn: 'বোর্ড নির্বাহী', count: stats.board },
        { key: 'exec', en: 'Senior Executives', bn: 'উচ্চ নির্বাহী', count: stats.exec },
        { key: 'officer', en: 'Officers', bn: 'কর্মকর্তা', count: stats.officer },
        { key: 'staff', en: 'Supervisors / Staff', bn: 'তত্ত্বাবধায়ক / কর্মচারী', count: stats.staff },
        { key: 'field', en: 'Field / Support Staff', bn: 'মাঠপর্যায়ের কর্মচারী', count: stats.field }
    ];

    tiers.forEach(t => {
        const percent = total > 0 ? (t.count / total) * 100 : 0;
        const name = state.language === 'en' ? t.en : t.bn;
        const countStr = state.language === 'en' ? t.count.toLocaleString() : replaceDigitsBn(t.count.toLocaleString());
        
        const item = document.createElement('div');
        item.className = 'breakdown-item';
        item.innerHTML = `
            <span class="breakdown-name">${name}</span>
            <div class="breakdown-bar-container">
                <div class="breakdown-bar" style="width: ${percent.toFixed(1)}%"></div>
            </div>
            <span class="breakdown-count">${countStr}</span>
        `;
        elements.seniorityBreakdownList.appendChild(item);
    });
}

// --- Navigation Tabs Switch ---
function switchTab(tabId) {
    state.activeTab = tabId;
    
    if (tabId === 'dashboard') {
        elements.btnTabDashboard.classList.add('active');
        elements.btnTabDirectory.classList.remove('active');
        elements.sidebarOfficePanel.classList.add('hidden');
        
        elements.tabDashboardView.classList.remove('hidden');
        elements.tabDirectoryView.classList.add('hidden');
        
        calculateDashboardStats();
    } else {
        elements.btnTabDashboard.classList.remove('active');
        elements.btnTabDirectory.classList.add('active');
        elements.sidebarOfficePanel.classList.remove('hidden');
        
        elements.tabDashboardView.classList.add('hidden');
        elements.tabDirectoryView.classList.remove('hidden');
        
        renderSidebar();
        selectOffice(state.activeOfficeIndex);
    }
}

// --- Render Sidebar Offices List ---
function renderSidebar() {
    elements.officeListContainer.innerHTML = '';
    
    state.engineers.forEach((office, index) => {
        const oName = state.language === 'en' ? office.officeName : office.officeNameBn;
        const oDept = office.contacts[0] ? office.contacts[0].dept : '';
        const count = office.contacts.length;
        const countStr = state.language === 'en' ? count.toString() : replaceDigitsBn(count.toString());
        
        // Filter out based on query
        if (state.officeFilterQuery) {
            const matches = oName.toLowerCase().includes(state.officeFilterQuery) || 
                            oDept.toLowerCase().includes(state.officeFilterQuery) ||
                            (office.officeNameBn && office.officeNameBn.includes(state.officeFilterQuery));
            if (!matches) return;
        }

        const navBtn = document.createElement('button');
        navBtn.className = `office-nav-item ${index === state.activeOfficeIndex && !state.searchQuery ? 'active' : ''}`;
        navBtn.onclick = () => {
            elements.globalSearchInput.value = '';
            clearGlobalSearch();
            selectOffice(index);
        };
        
        navBtn.innerHTML = `
            <div class="office-name-container">
                <span class="office-title">${oName}</span>
                <span class="office-dept">${oDept}</span>
            </div>
            <span class="nav-count-badge">${countStr}</span>
        `;
        
        elements.officeListContainer.appendChild(navBtn);
    });
}

function filterOffices() {
    state.officeFilterQuery = elements.officeSearchInput.value.toLowerCase().trim();
    renderSidebar();
}

// --- Render Selected Office ---
function selectOffice(index) {
    state.activeOfficeIndex = index;
    state.searchQuery = '';
    state.renderedContactsCount = 50;
    
    // Highlight active sidebar item
    const sidebarItems = elements.officeListContainer.querySelectorAll('.office-nav-item');
    sidebarItems.forEach((btn, idx) => {
        if (idx === index) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const office = state.engineers[index];
    if (!office) return;

    // Show banner details
    elements.officeBanner.classList.remove('hidden');
    elements.currentOfficeTitle.innerText = office.officeName;
    
    if (office.officeNameBn) {
        elements.currentOfficeTitleBn.innerText = office.officeNameBn;
        elements.currentOfficeTitleBn.classList.remove('hidden');
    } else {
        elements.currentOfficeTitleBn.classList.add('hidden');
    }

    const deptText = office.contacts[0] ? office.contacts[0].dept : 'BPDB';
    elements.departmentLabel.innerText = deptText;
    
    const count = office.contacts.length;
    const countText = state.language === 'en' ? `${count} Contacts` : `${replaceDigitsBn(count.toString())} জন কর্মকর্তা/কর্মচারী`;
    elements.contactCountLabel.innerText = countText;

    // Render cards
    renderContactCards(office.contacts, false);
    elements.contentArea.scrollTop = 0;
}

// --- Render Contacts Cards List ---
function renderContactCards(contacts, append = false) {
    if (!append) {
        elements.contactsGrid.innerHTML = '';
        state.renderedContactsCount = 50;
    }
    
    const total = contacts.length;
    if (total === 0) {
        elements.emptyStateCard.classList.remove('hidden');
        elements.contactsGrid.classList.add('hidden');
        return;
    }
    
    elements.emptyStateCard.classList.add('hidden');
    elements.contactsGrid.classList.remove('hidden');

    const limit = Math.min(state.renderedContactsCount, total);
    const sliceStart = append ? elements.contactsGrid.children.length : 0;
    const sliceList = contacts.slice(sliceStart, limit);
    
    sliceList.forEach(c => {
        const cName = state.language === 'en' ? c.name : (c.name_bn || c.name);
        const cDesig = state.language === 'en' ? c.desig : (c.desig_bn || c.desig);
        const cOffice = state.language === 'en' ? c.office : (c.office_bn || c.office);
        
        const card = document.createElement('div');
        card.className = 'contact-card glassmorphic';
        
        // Define Rank priority labels
        let rankClass = 'senior-field';
        let rankText = 'Staff';
        if (c.score <= 1) {
            rankClass = 'senior-chief';
            rankText = state.language === 'en' ? 'Board Exec' : 'বোর্ড নির্বাহী';
        } else if (c.score <= 4) {
            rankClass = 'senior-chief';
            rankText = state.language === 'en' ? 'Senior Exec' : 'উচ্চ নির্বাহী';
        } else if (c.score <= 7) {
            rankClass = 'senior-officer';
            rankText = state.language === 'en' ? 'Officer' : 'কর্মকর্তা';
        } else if (c.score <= 9) {
            rankClass = 'senior-staff';
            rankText = state.language === 'en' ? 'Supervisor' : 'তত্ত্বাবধায়ক';
        } else {
            rankClass = 'senior-field';
            rankText = state.language === 'en' ? 'Staff' : 'কর্মচারী';
        }

        // Channels Rows
        const emailRowHtml = c.email ? `
            <a href="mailto:${c.email}" class="detail-row" title="Email: ${c.email}">
                <i data-lucide="mail"></i>
                <span>${c.email}</span>
            </a>
        ` : '';

        const phoneRowHtml = c.contact ? `
            <a href="tel:${c.contact}" class="detail-row" title="Call: ${c.contact}">
                <i data-lucide="phone"></i>
                <span>${c.contact}</span>
            </a>
        ` : `
            <div class="detail-row text-muted">
                <i data-lucide="phone-off"></i>
                <span>${state.language === 'en' ? 'No Number' : 'নম্বর নেই'}</span>
            </div>
        `;

        // Render Action Buttons based on User Role (Admin vs User)
        let actionsHtml = '';
        if (state.userRole === 'admin') {
            actionsHtml = `
                <div class="admin-card-actions">
                    <button class="btn-table-action btn-edit" title="Edit Contact" onclick="openEditContactModal('${c.code}', '${c.office}')">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn-table-action btn-delete" title="Delete Contact" onclick="deleteContact('${c.code}', '${c.office}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;
        } else {
            // Request Correction Link pre-filled mail format
            const emailSubject = encodeURIComponent(`BPDB Contact Correction Request - Code [${c.code || 'N/A'}]`);
            const emailBody = encodeURIComponent(`Hello,\n\nPlease correct the following contact information for:\n\nName: ${c.name}\nEmployee Code: ${c.code || 'N/A'}\nOffice: ${c.office}\nDesignation: ${c.desig}\n\nRequested correction:\n- Phone: [ENTER CORRECT PHONE]\n- Email: [ENTER CORRECT EMAIL]\n- Designation/Office: [ENTER OTHER DETAILS]\n\nThank you.`);
            
            actionsHtml = `
                <div class="card-quick-actions">
                    <a href="mailto:jioniut@gmail.com?subject=${emailSubject}&body=${emailBody}" class="btn-correction" title="Request Correction">
                        <i data-lucide="mail-warning"></i>
                        <span>${state.language === 'en' ? 'Report Correction' : 'তথ্য সংশোধনের অনুরোধ'}</span>
                    </a>
                    
                    ${c.contact ? `
                        <button class="circle-action-btn" onclick="copyToClipboard('${c.contact}', '${state.language === 'en' ? 'Phone copied!' : 'নম্বর কপি করা হয়েছে!'}')" title="Copy Phone">
                            <i data-lucide="copy"></i>
                        </button>
                    ` : ''}
                    ${c.email ? `
                        <button class="circle-action-btn" onclick="copyToClipboard('${c.email}', '${state.language === 'en' ? 'Email copied!' : 'ইমেইল কপি করা হয়েছে!'}')" title="Copy Email">
                            <i data-lucide="copy-check"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        }

        card.innerHTML = `
            <div class="card-header-meta">
                <span class="employee-code-pill">${c.code || 'N/A'}</span>
                <span class="seniority-badge ${rankClass}">${rankText}</span>
            </div>
            
            <div class="contact-name-wrap">
                <h3 class="contact-name">${cName}</h3>
            </div>
            <div class="contact-designation">${cDesig}</div>
            
            ${state.searchQuery ? `
                <div style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 12px; display: flex; align-items: flex-start; gap: 6px;">
                    <i data-lucide="map-pin" style="width: 13.5px; height: 13.5px; flex-shrink: 0; margin-top: 1px;"></i>
                    <span>${cOffice}</span>
                </div>
            ` : ''}

            <div class="contact-details-wrap">
                ${phoneRowHtml}
                ${emailRowHtml}
            </div>
            
            ${actionsHtml}
        `;
        
        elements.contactsGrid.appendChild(card);
    });
    
    lucide.createIcons();
}

// --- Global Contacts Searching ---
function handleGlobalSearch() {
    state.searchQuery = elements.globalSearchInput.value.toLowerCase().trim();
    
    if (state.searchQuery) {
        elements.clearSearchBtn.classList.remove('hidden');
        
        // Unhighlight active sidebar items
        const sidebarItems = elements.officeListContainer.querySelectorAll('.office-nav-item');
        sidebarItems.forEach(btn => btn.classList.remove('active'));
        
        // Switch view to directory to display search result cards
        elements.btnTabDashboard.classList.remove('active');
        elements.btnTabDirectory.classList.add('active');
        elements.sidebarOfficePanel.classList.add('hidden');
        elements.tabDashboardView.classList.add('hidden');
        elements.tabDirectoryView.classList.remove('hidden');
        
        performGlobalSearch();
    } else {
        clearGlobalSearch();
    }
}

function clearGlobalSearch() {
    elements.globalSearchInput.value = '';
    elements.clearSearchBtn.classList.add('hidden');
    state.searchQuery = '';
    state.searchResultContacts = [];
    
    // Restore default view (dashboard or directory active)
    switchTab(state.activeTab);
}

function performGlobalSearch() {
    state.searchResultContacts = [];
    state.renderedContactsCount = 50;
    
    const query = state.searchQuery;
    
    // Search scans
    state.engineers.forEach(office => {
        office.contacts.forEach(c => {
            const match = c.name.toLowerCase().includes(query) || 
                          (c.name_bn && c.name_bn.includes(query)) ||
                          c.code.toLowerCase().includes(query) ||
                          c.desig.toLowerCase().includes(query) ||
                          (c.desig_bn && c.desig_bn.includes(query)) ||
                          c.office.toLowerCase().includes(query) ||
                          (c.office_bn && c.office_bn.includes(query)) ||
                          c.contact.includes(query) ||
                          c.email.toLowerCase().includes(query) ||
                          c.dept.toLowerCase().includes(query);
                          
            if (match) {
                state.searchResultContacts.push(c);
            }
        });
    });

    elements.officeBanner.classList.remove('hidden');
    elements.currentOfficeTitle.innerText = state.language === 'en' ? 'Search Results' : 'অনুসন্ধানের ফলাফল';
    elements.currentOfficeTitleBn.classList.add('hidden');
    elements.departmentLabel.innerText = state.language === 'en' ? `Matching query: "${query}"` : `অনুসন্ধান শব্দ: "${query}"`;
    
    const resultsCount = state.searchResultContacts.length;
    elements.contactCountLabel.innerText = state.language === 'en' ? 
        `Found ${resultsCount} matching entries` : 
        `মোট ${replaceDigitsBn(resultsCount.toString())}টি তথ্য পাওয়া গেছে`;

    renderContactCards(state.searchResultContacts, false);
    elements.contentArea.scrollTop = 0;
}

// --- Scroll & Lazy Loading Controller ---
function handleContentScroll() {
    const scrollContainer = elements.contentArea;
    
    if (scrollContainer.scrollTop > 300) {
        elements.backToTopBtn.classList.remove('hidden');
    } else {
        elements.backToTopBtn.classList.add('hidden');
    }

    if (scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 120) {
        const contacts = state.searchQuery ? state.searchResultContacts : state.engineers[state.activeOfficeIndex].contacts;
        
        if (state.renderedContactsCount < contacts.length) {
            state.renderedContactsCount += 50;
            renderContactCards(contacts, true);
        }
    }
}

function scrollToTop() {
    elements.contentArea.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// --- Languages Translations Helper ---
function applyLanguage(lang) {
    if (lang === 'bn') {
        elements.appTitle.innerText = 'বিউবো যোগাযোগ';
        elements.appSubtitle.innerText = 'কর্মকর্তা ও কর্মচারী নির্দেশিকা';
        elements.globalSearchInput.placeholder = 'নাম, কোড, পদবি, দপ্তর বা ফোন নম্বর দিয়ে খুঁজুন...';
        elements.officeSearchInput.placeholder = 'দপ্তর ফিল্টার করুন...';
        elements.sidebarTitle.innerText = 'বিউবো দপ্তরসমূহ';
        elements.langLabel.innerText = 'English';
        elements.totalOfficesLabel.innerText = replaceDigitsBn(state.engineers.length.toString());
        elements.tabDashboardLabel.innerText = 'ড্যাশবোর্ড';
        elements.tabDirectoryLabel.innerText = 'নির্দেশিকা';
        elements.devStampLabel.innerText = 'সিস্টেম ডেভেলপার';
        
        elements.welcomeBadgeLabel.innerText = 'বিউবো অফিসিয়াল সিস্টেম';
        elements.welcomeTitle.innerText = 'বিউবো যোগাযোগ ডিরেক্টরি অ্যাপ';
        elements.welcomeDesc.innerText = 'বাংলাদেশ বিদ্যুৎ উন্নয়ন বোর্ডের সকল ৩৪৮ দপ্তরের কর্মকর্তা ও কর্মচারীদের জন্য একটি বিস্তৃত যোগাযোগের নির্দেশিকা।';
        elements.lblTotalContacts.innerText = 'মোট জনবল তথ্য';
        elements.lblTotalOffices.innerText = 'দপ্তরসমূহ';
        elements.lblTotalPhone.innerText = 'যোগাযোগ নম্বরসহ';
        elements.lblTotalEmail.innerText = 'ইমেইল ঠিকানাসহ';
        elements.breakdownTitle.innerText = 'পদবি অনুযায়ী জনবল বিশ্লেষণ';
        elements.breakdownDesc.innerText = 'বিভিন্ন কর্পোরেট স্তরের ভিত্তিতে কর্মরত কর্মকর্তা-কর্মচারীদের বিবরণ';
        elements.devProfileQuote.innerText = '"এই যোগাযোগ ডিরেক্টরি অ্যাপটি বিউবোর কর্মকর্তা-কর্মচারীদের তথ্য অতি দ্রুত, ভূমিকা-ভিত্তিক সুরক্ষিত এবং সহজ উপায়ে উপস্থাপনের লক্ষ্য নিয়ে ডিজাইন করা হয়েছে।"';
        
        elements.lblAddContact.innerText = 'যোগ করুন';
        elements.emptyTitle.innerText = 'কোন তথ্য পাওয়া যায়নি';
        elements.emptyDesc.innerText = 'দয়া করে অনুসন্ধানের শব্দ পরিবর্তন করুন বা অন্য কোন দপ্তর নির্বাচন করুন।';
        
        if (state.userRole === 'admin') {
            elements.roleBadge.innerText = 'এডমিন';
        } else {
            elements.roleBadge.innerText = 'ইউজার';
        }
    } else {
        elements.appTitle.innerText = 'BPDB Contacts';
        elements.appSubtitle.innerText = 'Officers & Employees Directory';
        elements.globalSearchInput.placeholder = 'Search by Name, Code, Designation, Office, Phone...';
        elements.officeSearchInput.placeholder = 'Filter offices...';
        elements.sidebarTitle.innerText = 'BPDB Offices';
        elements.langLabel.innerText = 'বাংলা';
        elements.totalOfficesLabel.innerText = state.engineers.length;
        elements.tabDashboardLabel.innerText = 'Dashboard';
        elements.tabDirectoryLabel.innerText = 'Directory';
        elements.devStampLabel.innerText = 'System Developer';
        
        elements.welcomeBadgeLabel.innerText = 'BPDB OFFICIAL SYSTEM';
        elements.welcomeTitle.innerText = 'Welcome to BPDB Contacts Directory';
        elements.welcomeDesc.innerText = 'A comprehensive database of officers and employees across all 348 offices of Bangladesh Power Development Board.';
        elements.lblTotalContacts.innerText = 'Total Records';
        elements.lblTotalOffices.innerText = 'Offices Grouped';
        elements.lblTotalPhone.innerText = 'With Contact No.';
        elements.lblTotalEmail.innerText = 'With Email Address';
        elements.breakdownTitle.innerText = 'Designation Seniority Headcount';
        elements.breakdownDesc.innerText = 'Distribution of active personnel categorized by corporate tiers';
        elements.devProfileQuote.innerText = '"This Contact Directory App has been custom designed and developed to provide fast, role-secured, and intuitive access to BPDB personnel details."';
        
        elements.lblAddContact.innerText = 'Add Contact';
        elements.emptyTitle.innerText = 'No Contacts Found';
        elements.emptyDesc.innerText = 'Try adjusting your search criteria or filter to a different office.';
        
        if (state.userRole === 'admin') {
            elements.roleBadge.innerText = 'Admin';
        } else {
            elements.roleBadge.innerText = 'User';
        }
    }
}

// --- Admin CRUD Actions Logic ---

// Modal Open/Close
function openAddContactModal() {
    elements.modalTitle.innerText = 'Add New Contact';
    elements.contactForm.reset();
    elements.editOriginalCode.value = '';
    elements.editOriginalOffice.value = '';
    elements.cCode.disabled = false;
    
    // Auto-fill active office name if adding within an office
    if (!state.searchQuery) {
        const activeOffice = state.engineers[state.activeOfficeIndex];
        if (activeOffice) {
            elements.cOffice.value = activeOffice.officeName;
            elements.cOfficeBn.value = activeOffice.officeNameBn || '';
            
            if (activeOffice.contacts[0]) {
                elements.cDept.value = activeOffice.contacts[0].dept;
            }
        }
    }
    
    elements.contactModal.classList.remove('hidden');
    lucide.createIcons();
}

function openEditContactModal(code, officeName) {
    const office = state.engineers.find(o => o.officeName === officeName);
    if (!office) return;
    
    const c = office.contacts.find(con => con.code === code);
    if (!c) return;

    elements.modalTitle.innerText = 'Edit Contact Record';
    elements.editOriginalCode.value = c.code;
    elements.editOriginalOffice.value = c.office;
    
    // Load inputs
    elements.cCode.value = c.code;
    elements.cCode.disabled = true; // Code is primary key
    elements.cName.value = c.name;
    elements.cNameBn.value = c.name_bn || '';
    elements.cOffice.value = c.office;
    elements.cOfficeBn.value = c.office_bn || '';
    elements.cDept.value = c.dept;
    elements.cDesig.value = c.desig;
    elements.cDesigBn.value = c.desig_bn || '';
    elements.cContact.value = c.contact || '';
    elements.cEmail.value = c.email || '';
    
    elements.contactModal.classList.remove('hidden');
    lucide.createIcons();
}

function closeContactModal() {
    elements.contactModal.classList.add('hidden');
}

// Map designation to Seniority score
function getSeniorityScore(desig) {
    const d = desig.strip().toLowerCase();
    
    if ('chairman' in d) return 0;
    if ('member' in d) return 1;
    if ('chief engineer' in d || 'controller, accounts' in d || 'secretary' in d) return 2;
    if ('additional chief' in d || 'addl. chief' in d || 'general manager' in d) return 3;
    if ('superintendent engineer' in d || 'superintending engineer' in d || 'cso' in d || 'director (se)' in d || 'manager (se)' in d || 'deputy secretary' in d) return 4;
    if ('executive engineer' in d || 'xen' in d || 'system analyst' in d || 'medical officer' in d || 'deputy director' in d || 'director' in d) return 5;
    if ('sub-divisional engineer' in d || 'sde' in d || 'programmer' in d || 'assistant director' in d || 'accounts officer' in d || 'audit officer' in d) return 6;
    if ('assistant engineer' in d || 'assistant programmer' in d || 'administrative officer' in d || 'medical assistant' in d) return 7;
    if ('sub-assistant engineer' in d || 'sub assistant' in d || 'junior assistant' in d || 'inspector' in d) return 8;
    if ('junior officer' in d || 'accountant' in d || 'foreman' in d || 'supervisor' in d) return 9;
    if ('driver' in d || 'assistant accountant' in d || 'cashier' in d || 'storekeeper' in d || 'accounts assistant' in d) return 10;
    if ('operator' in d || 'electrician' in d || 'mechanic' in d || 'fitter' in d || 'winder' in d || 'jointer' in d || 'machinist' in d) return 11;
    if ('helper' in d || 'guard' in d || 'peon' in d || 'cleaner' in d || 'sweeper' in d || 'messenger' in d || 'chowkidar' in d || 'gardener' in d || 'cook' in d || 'attendant' in d) return 12;
    return 13;
}

// Format Contact Numbers (adds leading 0 if needed)
function formatContact(contactStr) {
    contactStr = contactStr.trim();
    if (!contactStr) return "";
    
    const parts = contactStr.split(/[,/;\s]+/);
    const formattedParts = [];
    for (let part of parts) {
        part = part.trim();
        if (!part) continue;
        if (part.startsWith('+880')) {
            part = part.slice(4);
        } else if (part.startsWith('880')) {
            part = part.slice(3);
        } else if (part.startsWith('+88')) {
            part = part.slice(3);
        } else if (part.startsWith('88') && part.length > 10) {
            part = part.slice(2);
        }
        
        if (part && '123456789'.includes(part[0])) {
            part = '0' + part;
        }
        formattedParts.push(part);
    }
    return formattedParts.join(", ");
}

// Save addition or updates
function saveContact(event) {
    event.preventDefault();
    
    const originalCode = elements.editOriginalCode.value;
    const originalOfficeName = elements.editOriginalOffice.value;
    
    const code = elements.cCode.value.trim();
    const name = elements.cName.value.trim();
    const name_bn = elements.cNameBn.value.trim();
    const officeName = elements.cOffice.value.trim();
    const officeNameBn = elements.cOfficeBn.value.trim();
    const dept = elements.cDept.value.trim();
    const desig = elements.cDesig.value.trim();
    const desig_bn = elements.cDesigBn.value.trim();
    const contact = formatContact(elements.cContact.value);
    const email = elements.cEmail.value.trim().toLowerCase();
    
    const score = getSeniorityScore(desig);
    
    const contactObj = {
        code,
        name,
        name_bn,
        office: officeName,
        office_bn: officeNameBn,
        dept,
        desig,
        desig_bn,
        contact,
        email,
        score
    };

    if (originalCode) {
        // --- Edit Record ---
        const office = state.engineers.find(o => o.officeName === originalOfficeName);
        if (office) {
            const idx = office.contacts.findIndex(c => c.code === originalCode);
            if (idx !== -1) {
                // If office name did not change, just replace in-place
                if (originalOfficeName === officeName) {
                    office.contacts[idx] = contactObj;
                    office.contacts.sort((a, b) => a.score - b.score);
                    
                    // Recalculate minimum office seniority
                    office.minScore = Math.min(...office.contacts.map(c => c.score));
                } else {
                    // Office name changed, remove from old, add to new
                    office.contacts.splice(idx, 1);
                    if (office.contacts.length === 0) {
                        // Delete empty office
                        state.engineers = state.engineers.filter(o => o.officeName !== originalOfficeName);
                    } else {
                        office.minScore = Math.min(...office.contacts.map(c => c.score));
                    }
                    
                    // Add to new office group
                    addContactToOffice(contactObj, officeName, officeNameBn);
                }
            }
        }
    } else {
        // --- Add New Record ---
        // Check duplicate code globally
        let isDuplicate = false;
        state.engineers.forEach(o => {
            if (o.contacts.some(c => c.code === code)) {
                isDuplicate = true;
            }
        });
        if (isDuplicate) {
            alert('A contact with this Employee Code already exists!');
            return;
        }
        
        addContactToOffice(contactObj, officeName, officeNameBn);
    }
    
    // Sort offices globally
    state.engineers.sort((a, b) => {
        if (a.minScore !== b.minScore) {
            return a.minScore - b.minScore;
        }
        return a.officeName.localeCompare(b.officeName);
    });
    
    saveDatabase();
    closeContactModal();
    
    // Find index of modified/new office to display
    const newOfficeIndex = state.engineers.findIndex(o => o.officeName === officeName);
    if (newOfficeIndex !== -1) {
        state.activeOfficeIndex = newOfficeIndex;
    }
    
    renderSidebar();
    selectOffice(state.activeOfficeIndex);
    calculateDashboardStats();
    
    showToast(state.language === 'en' ? 'Contact saved successfully!' : 'যোগাযোগ সফলভাবে সংরক্ষণ করা হয়েছে!');
}

function addContactToOffice(contactObj, officeName, officeNameBn) {
    let office = state.engineers.find(o => o.officeName === officeName);
    if (!office) {
        office = {
            officeName,
            officeNameBn: officeNameBn || officeName,
            contacts: [],
            minScore: contactObj.score
        };
        state.engineers.push(office);
    }
    
    office.contacts.push(contactObj);
    office.contacts.sort((a, b) => a.score - b.score);
    office.minScore = Math.min(...office.contacts.map(c => c.score));
}

// Delete Record
function deleteContact(code, officeName) {
    const office = state.engineers.find(o => o.officeName === officeName);
    if (!office) return;
    
    const contact = office.contacts.find(c => c.code === code);
    if (!contact) return;
    
    if (confirm(`Are you sure you want to delete the contact details for ${contact.name} (Code: ${code})?`)) {
        office.contacts = office.contacts.filter(c => c.code !== code);
        
        if (office.contacts.length === 0) {
            // Delete office if no contacts remain
            state.engineers = state.engineers.filter(o => o.officeName !== officeName);
            state.activeOfficeIndex = Math.max(0, state.activeOfficeIndex - 1);
        } else {
            office.minScore = Math.min(...office.contacts.map(c => c.score));
        }
        
        // Resort offices list
        state.engineers.sort((a, b) => {
            if (a.minScore !== b.minScore) {
                return a.minScore - b.minScore;
            }
            return a.officeName.localeCompare(b.officeName);
        });
        
        saveDatabase();
        renderSidebar();
        selectOffice(state.activeOfficeIndex);
        calculateDashboardStats();
        
        showToast(state.language === 'en' ? 'Contact deleted!' : 'যোগাযোগ মুছে ফেলা হয়েছে!');
    }
}

// --- Utility Helpers ---
function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('bpdb_theme', state.theme);
    applyTheme(state.theme);
    showToast(state.language === 'en' ? 'Theme Switched!' : 'থিম পরিবর্তন করা হয়েছে!');
}

function applyTheme(theme) {
    if (theme === 'dark') {
        elements.body.className = 'dark-theme';
        elements.themeIconSun.classList.remove('hidden');
        elements.themeIconMoon.classList.add('hidden');
    } else {
        elements.body.className = 'light-theme';
        elements.themeIconSun.classList.add('hidden');
        elements.themeIconMoon.classList.remove('hidden');
    }
}

function toggleLanguage() {
    state.language = state.language === 'en' ? 'bn' : 'en';
    localStorage.setItem('bpdb_lang', state.language);
    applyLanguage(state.language);
    
    renderSidebar();
    calculateDashboardStats();
    
    if (state.searchQuery) {
        performGlobalSearch();
    } else {
        selectOffice(state.activeOfficeIndex);
    }
    
    showToast(state.language === 'en' ? 'Language switched to English' : 'ভাষা পরিবর্তন করা হয়েছে');
}

// Copy phone/email utility
function copyToClipboard(text, msg) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(msg);
    }).catch(err => {
        console.error('Copy failed: ', err);
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i data-lucide="check-circle-2"></i>
        <span>${message}</span>
    `;
    elements.toastContainer.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2200);
}
