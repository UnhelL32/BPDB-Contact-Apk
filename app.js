/* ==========================================================================
   BPDB OFFICERS CONTACT DIRECTORY - APPLICATION SCRIPT
   ========================================================================== */

// --- Global Application State ---
const state = {
    language: localStorage.getItem('bpdb_lang') || 'en', // 'en' or 'bn'
    theme: localStorage.getItem('bpdb_theme') || 'dark', // 'dark' or 'light'
    activeOfficeIndex: 0, // Index of selected office in CONTACTS_DATA
    searchQuery: '',
    officeFilterQuery: '',
    renderedContactsCount: 50, // Lazy loading count
    searchResultContacts: [] // List of contacts matching global search
};

// --- DOM References ---
let elements = {};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize DOM references
    elements = {
        body: document.body,
        appTitle: document.getElementById('appTitle'),
        appSubtitle: document.getElementById('appSubtitle'),
        globalSearchInput: document.getElementById('globalSearchInput'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        langToggleBtn: document.getElementById('langToggleBtn'),
        langLabel: document.getElementById('langLabel'),
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        themeIconSun: document.getElementById('themeIconSun'),
        themeIconMoon: document.getElementById('themeIconMoon'),
        sidebarTitle: document.getElementById('sidebarTitle'),
        totalOfficesLabel: document.getElementById('totalOfficesLabel'),
        officeSearchInput: document.getElementById('officeSearchInput'),
        officeListContainer: document.getElementById('officeListContainer'),
        contentArea: document.querySelector('.content-area'),
        officeBanner: document.getElementById('officeBanner'),
        currentOfficeTitle: document.getElementById('currentOfficeTitle'),
        currentOfficeTitleBn: document.getElementById('currentOfficeTitleBn'),
        departmentLabel: document.getElementById('departmentLabel'),
        contactCountLabel: document.getElementById('contactCountLabel'),
        contactsGrid: document.getElementById('contactsGrid'),
        emptyStateCard: document.getElementById('emptyStateCard'),
        backToTopBtn: document.getElementById('backToTopBtn'),
        toastContainer: document.getElementById('toastContainer')
    };

    // 2. Setup initial state / values
    applyTheme(state.theme);
    applyLanguage(state.language);
    
    // 3. Render initial views
    renderSidebar();
    selectOffice(0);

    // 4. Register scroll and search listeners
    elements.contentArea.addEventListener('scroll', handleContentScroll);
    elements.globalSearchInput.addEventListener('input', handleGlobalSearch);
    
    // Initialize Lucide Icons
    lucide.createIcons();
});

// --- Theme Actions ---
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

// --- Language Actions ---
function toggleLanguage() {
    state.language = state.language === 'en' ? 'bn' : 'en';
    localStorage.setItem('bpdb_lang', state.language);
    applyLanguage(state.language);
    
    // Re-render components with the new language
    renderSidebar();
    if (state.searchQuery) {
        performGlobalSearch();
    } else {
        selectOffice(state.activeOfficeIndex);
    }
    
    showToast(state.language === 'en' ? 'Language switched to English' : 'ভাষা পরিবর্তন করা হয়েছে');
}

function applyLanguage(lang) {
    if (lang === 'bn') {
        elements.appTitle.innerText = 'বিউবো যোগাযোগ';
        elements.appSubtitle.innerText = 'কর্মকর্তা ও কর্মচারী নির্দেশিকা';
        elements.globalSearchInput.placeholder = 'নাম, কোড, পদবি, দপ্তর বা ফোন নম্বর দিয়ে খুঁজুন...';
        elements.officeSearchInput.placeholder = 'দপ্তর ফিল্টার করুন...';
        elements.sidebarTitle.innerText = 'বিউবো দপ্তরসমূহ';
        elements.langLabel.innerText = 'English';
        elements.totalOfficesLabel.innerText = replaceDigitsBn(CONTACTS_DATA.length.toString());
    } else {
        elements.appTitle.innerText = 'BPDB Contacts';
        elements.appSubtitle.innerText = 'Officers & Employees Directory';
        elements.globalSearchInput.placeholder = 'Search by Name, Code, Designation, Office, Phone...';
        elements.officeSearchInput.placeholder = 'Filter offices...';
        elements.sidebarTitle.innerText = 'BPDB Offices';
        elements.langLabel.innerText = 'বাংলা';
        elements.totalOfficesLabel.innerText = CONTACTS_DATA.length;
    }
}

// Translate digits to Bengali
function replaceDigitsBn(inputStr) {
    const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return inputStr.replace(/[0-9]/g, digit => bnNums[parseInt(digit)]);
}

// --- Render Sidebar Offices ---
function renderSidebar() {
    elements.officeListContainer.innerHTML = '';
    
    CONTACTS_DATA.forEach((office, index) => {
        const oName = state.language === 'en' ? office.officeName : office.officeNameBn;
        const oDept = office.contacts[0] ? office.contacts[0].dept : '';
        const count = office.contacts.length;
        const countStr = state.language === 'en' ? count.toString() : replaceDigitsBn(count.toString());
        
        // Filter out if query exists and doesn't match
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

// --- Render Selected Office Views ---
function selectOffice(index) {
    state.activeOfficeIndex = index;
    state.searchQuery = '';
    state.renderedContactsCount = 50;
    
    // Highlight sidebar active item
    const sidebarItems = elements.officeListContainer.querySelectorAll('.office-nav-item');
    sidebarItems.forEach((btn, idx) => {
        if (idx === index) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const office = CONTACTS_DATA[index];
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
    
    // Scroll content area back to top
    elements.contentArea.scrollTop = 0;
}

// --- Render Contacts Cards ---
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
        
        // Define rank score classes for coloring
        let rankClass = 'senior-field';
        let rankText = 'Field / Tech';
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

        // Email row
        const emailRowHtml = c.email ? `
            <a href="mailto:${c.email}" class="detail-row" title="Email: ${c.email}">
                <i data-lucide="mail"></i>
                <span>${c.email}</span>
            </a>
        ` : '';

        // Contact row
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

        card.innerHTML = `
            <div class="card-header-meta">
                <span class="employee-code-pill">${c.code || 'N/A'}</span>
                <span class="seniority-badge ${rankClass}">${rankText}</span>
            </div>
            
            <div class="contact-name-wrap">
                <h3 class="contact-name">${cName}</h3>
            </div>
            <div class="contact-designation">${cDesig}</div>
            
            <!-- Global search items display office name on card -->
            ${state.searchQuery ? `
                <div style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 12px; display: flex; align-items: flex-start; gap: 6px;">
                    <i data-lucide="map-pin" style="width: 13px; height: 13px; flex-shrink: 0; margin-top: 1px;"></i>
                    <span>${cOffice}</span>
                </div>
            ` : ''}

            <div class="contact-details-wrap">
                ${phoneRowHtml}
                ${emailRowHtml}
            </div>
            
            <div class="card-quick-actions">
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
        
        elements.contactsGrid.appendChild(card);
    });
    
    lucide.createIcons();
}

// --- Global Search Implementation ---
function handleGlobalSearch() {
    state.searchQuery = elements.globalSearchInput.value.toLowerCase().trim();
    
    if (state.searchQuery) {
        elements.clearSearchBtn.classList.remove('hidden');
        // Unhighlight sidebar offices
        const sidebarItems = elements.officeListContainer.querySelectorAll('.office-nav-item');
        sidebarItems.forEach(btn => btn.classList.remove('active'));
        
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
    selectOffice(state.activeOfficeIndex);
}

function performGlobalSearch() {
    state.searchResultContacts = [];
    state.renderedContactsCount = 50;
    
    const query = state.searchQuery;
    
    // Scan all offices and contacts
    CONTACTS_DATA.forEach(office => {
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

    // Hide standard active office banner, show search status
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

// --- Content Area Scroll (Lazy Loading & Back to Top) ---
function handleContentScroll() {
    const scrollContainer = elements.contentArea;
    
    // Show/hide Back to Top button
    if (scrollContainer.scrollTop > 300) {
        elements.backToTopBtn.classList.remove('hidden');
    } else {
        elements.backToTopBtn.classList.add('hidden');
    }

    // Lazy load next cards when scrolling near the bottom (within 100px)
    if (scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 120) {
        const contacts = state.searchQuery ? state.searchResultContacts : CONTACTS_DATA[state.activeOfficeIndex].contacts;
        
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

// --- Toast & Clipboard Helper ---
function copyToClipboard(text, successMessage) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(successMessage);
    }).catch(err => {
        console.error('Could not copy text: ', err);
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

    // Auto remove after 2.8 seconds
    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2500);
}
