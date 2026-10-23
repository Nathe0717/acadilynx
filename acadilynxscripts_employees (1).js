const loginTicket = document.querySelector('.ticket:not(.wide):not(.widest)');
const counterTicket = document.getElementById('counterTicket');
const staffPortalView = document.getElementById('staffPortalView');
const adminLoginView = document.getElementById('adminLoginView');
const adminDashboardView = document.getElementById('adminDashboardView');

document.body.style.visibility = 'hidden'; // hidden until the login check at the bottom finishes
//Store created credentials for login validation
let credentials = { username: '', password: '', role: '', fullName: '' };
let selectedCounter = null;

function goToStep(step) {
    loginTicket.classList.toggle('hidden', step !== 0);
    counterTicket.classList.toggle('hidden', step !== 4);
    staffPortalView.classList.toggle('hidden', step !== 5);
    document.body.classList.toggle('portal-mode', step === 5);
    if (step === 5) populateStaffPortal();
    if (step === 4) loadCounterCards();
}

//---------- Admin Access overlay ----------
function openAdminLogin() {
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
    document.getElementById('adminLoginError').classList.remove('show');
    document.getElementById('adminUser').classList.remove('invalid');
    document.getElementById('adminPass').classList.remove('invalid');
    adminLoginView.classList.remove('hidden');
}
function closeAdminLogin() {
    adminLoginView.classList.add('hidden');
}

document.getElementById('loginAsAdminBtn').addEventListener('click', openAdminLogin);

document.getElementById('adminBackToStaffBtn').addEventListener('click', () => {
    closeAdminLogin();
    goToStep(0);
});

document.getElementById('adminGoToDashboardBtn').addEventListener('click', async () => {
    const adminUserInput = document.getElementById('adminUser');
    const adminPassInput = document.getElementById('adminPass');
    const adminErrorEl = document.getElementById('adminLoginError');
    const filled = adminUserInput.value.trim() !== '' && adminPassInput.value.trim() !== '';

    adminUserInput.classList.toggle('invalid', !filled);
    adminPassInput.classList.toggle('invalid', !filled);
    adminErrorEl.textContent = 'Please enter both fields.';
    adminErrorEl.classList.toggle('show', !filled);
    if (!filled) return;

    //Validate admin credentials against the backend before granting access.
    const result = await loginRequest(adminUserInput.value.trim(), adminPassInput.value);
    if (!result.ok || result.user.role !== 'Admin') {
        if (result.ok) await logoutRequest(); // a staff account used the admin form
        adminUserInput.classList.add('invalid');
        adminPassInput.classList.add('invalid');
        adminErrorEl.textContent = 'Invalid email or password.';
        adminErrorEl.classList.add('show');
        return;
    }

    closeAdminLogin();
    openAdminDashboard();
});

//---------- Admin Dashboard Overview ----------
function openAdminDashboard() {
    adminDashboardView.classList.remove('hidden');
    renderAdminCalendar();
    renderAdAll();
    loadAdminData();
}

document.querySelectorAll('#adminDashboardView .ad-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        if (tab.dataset.adpanel === 'staff') {
            refreshAdStaffAccounts();
        } else if (tab.dataset.adpanel === 'queue') {
            refreshAdRequests();
        }
        document.querySelectorAll('#adminDashboardView .ad-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#adminDashboardView .ad-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('ad-panel-' + tab.dataset.adpanel).classList.add('active');
    });
});

//---------- code that actually calls the backend (holy shit) ----------
//For Navigation purposes. Paste the comments above the functions on the search bar.
//Code can and must be edited. There is no proper integration to this client-side script yet.
//alot more to add??

//Login - fetch
async function loginRequest(email, password) {
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const body = await response.json();

        return { ok: response.ok, user: response.ok ? body : null, message: body.message };
    } catch (error) {
        console.error(error);
        return { ok: false, user: null, message: 'Network error' };
    }
}

//Logout - fetch
async function logoutRequest() {
    try {
        await fetch('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error(error);
    }
}

//Add Staff - fetch (working)
async function sendStaffData(staffData) {
    try {
        const response = await fetch('/staff/staff_addStaff', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(staffData)
        });
        const result = await response.json();

        return { ok: response.ok, status: response.status, ...result };
    } catch (error) {
        console.error(error);
        return { ok: false, status: 0 };
    }
}

//Patch Status - fetch (working)
async function changeEmployeeStatus(statusEdit) {
    try {
        const response = await fetch(`/staff/staff_statusChange/${statusEdit.employeedbID}`, {
            method: 'PATCH',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(statusEdit)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error('HTTP error: ' + response.status);
        }

        console.log('server response: ', result);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

//Patch Info - fetch (working)
async function changeEmployeeInfo(dataEdit) {
    try {
        const response = await fetch(`/staff/staff_infoChange/${dataEdit.employeedbID}`, {
            method: 'PATCH',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataEdit)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error('HTTP error: ' + response.status);
        }

        console.log('server response: ', result);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

//Display Staff - fetch (working)
async function displayEmployees() {
    try {
        const response = await fetch('/staff/staff_staffDisplay');

        if (!response.ok) {
            throw new Error('HTTP error: ' + response.status);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

//Display Registrar - fetch
async function displayKioskRegi() {
    try {
        const response = await fetch('/staff/staff_riDisplay');

        if (!response.ok) {
            throw new Error('HTTP error: ' + response.status);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

//Display Cashier - fetch
async function displayKioskCash() {
    try {
        const response = await fetch('/staff/staff_ciDisplay');

        if (!response.ok) {
            throw new Error('HTTP error: ' + response.status);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

//Queue from Kiosk
async function refreshQueueStatus() {
    if (document.hidden) return;
    try {
        const response = await fetch('/staff/staff_queueStatus');
        if (response.status === 401) return; // not logged in yet: nothing to show
        if (!response.ok) throw new Error('HTTP error: ' + response.status);
        const q = await response.json();
        const data = {
            registrarTicket: q.registrar.ticket || '—',
            registrarWaiting: q.registrar.waiting,
            cashierTicket: q.cashier.ticket || '—',
            cashierWaiting: q.cashier.waiting,
            totalWaiting: q.registrar.waiting + q.cashier.waiting
        };
        updateAdminDashboardData(data);
        updateDashboardData(data);
    } catch (error) {
        console.error(error);
    }
}

//Add Staff - function (working)
async function addStaff(sName, sRole, sContact, sEmail) {
    return await sendStaffData({
        employeedbID: 'STF-' + Date.now(),
        fullName: sName,
        role: sRole,
        contact: sContact,
        email: sEmail
        //removed password and status
        //both are dealt with in backend
        //remove after cleanup
    });
}

//Patch Status - function (implementing)
async function updateStatus(id, newStatus) {
    return await changeEmployeeStatus({
        employeedbID: id,
        status: newStatus
    });
}

//Patch Info - function (not implemented yet)
async function updateInfo(id, sName, sRole, sContact, sEmail) {
    return await changeEmployeeInfo({
        employeedbID: id,
        fullName: sName,
        role: sRole,
        contact: sContact,
        email: sEmail
    });
}

//Display Staff - function (works now!)
async function refreshAdStaffAccounts() {
    const rows = await displayEmployees();
    if (!rows) {
        adLoadState.staff = 'error';
        renderAdAll();
        return;
    }
    adStaffAccounts = normalizeStaff(rows);
    adLoadState.staff = 'ok';
    renderAdAll();
}

//Display Requests - function
async function refreshAdRequests() {
    const [regRows, cashRows] = await Promise.all([displayKioskRegi(), displayKioskCash()]);
    if (!regRows || !cashRows) {
        adLoadState.requests = 'error';
        renderAdAll();
        return;
    }
    adRegistrarRows = Array.isArray(regRows) ? regRows : [];
    adCashierRows = Array.isArray(cashRows) ? cashRows : [];
    adLoadState.requests = 'ok';
    renderAdAll();
}

//---------- Staff Management (Admin Dashboard) ----------

let adStaffAccounts = [];
let adRegistrarRows = [];
let adCashierRows = [];
let adQueueStatus = null;
let adLoading = false;
let adLoadState = { staff: 'idle', requests: 'idle', queue: 'idle' };
let adStaffSearchTerm = '';
let adStaffStatusFilter = 'all';
let adReqSearchTerm = '';
let adReqStatusFilter = 'all';
let adReqDateFilter = '';
let adStaffModalMode = 'add'; //'add' | 'edit' | 'view'
let adStaffEditingId = null;
let adStaffBusy = false;

function adStaffEscape(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const adStaffIconEye = '<svg viewBox="0 0 24 24"><path d="M1 12s4-7.5 11-7.5S23 12 23 12s-4 7.5-11 7.5S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const adStaffIconPencil = '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z"/></svg>';
const adStaffIconLockClosed = '<svg viewBox="0 0 24 24"><rect x="4" y="10.5" width="16" height="9.5" rx="2"/><path d="M7.5 10.5V7a4.5 4.5 0 019 0v3.5"/></svg>';
const adStaffIconLockOpen = '<svg viewBox="0 0 24 24"><rect x="4" y="10.5" width="16" height="9.5" rx="2"/><path d="M7.5 10.5V7a4.5 4.5 0 018.4-2.2"/></svg>';

function normalizeStaff(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
        id: String(r.employee_ID),
        name: r.employee_fullName ?? '',
        role: r.employee_role ?? '',
        email: r.employee_email ?? '',
        contact: r.employee_contact ?? '',
        status: r.employee_status
    }));
}

function normalizeRequests(rows, type, idCol) {
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
        id: String(r[idCol]),
        type,
        name: r.inquirer_name ?? '',
        status: String(r.queue_status ?? '').toLowerCase(),
        date: r.date_inquired ?? null,
        raw: r
    }));
}

function allAdRequests() {
    return normalizeRequests(adRegistrarRows, 'Registrar', 'RInq_ID')
        .concat(normalizeRequests(adCashierRows, 'Cashier', 'CInq_ID'))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function adStatusLabel(status) {
    const labels = { waiting: 'Waiting', serving: 'Serving', held: 'On Hold', completed: 'Completed', cancelled: 'Cancelled' };
    return labels[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown');
}

function adStatusPill(status) {
    const known = ['waiting', 'serving', 'held', 'completed', 'cancelled'].indexOf(status) !== -1;
    return '<span class="ad-req-pill ' + (known ? status : 'other') + '">' + adStaffEscape(adStatusLabel(status)) + '</span>';
}

function adFormatDate(value) {
    if (!value) return '\u2014';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

function adLocalDay(value) {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function showAdToast(message, type) {
    const wrap = document.getElementById('adToastWrap');
    const el = document.createElement('div');
    el.className = 'ad-toast' + (type === 'error' ? ' error' : '');
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => { el.remove(); }, 4200);
}

function clearAdminData() {
    adStaffAccounts = [];
    adRegistrarRows = [];
    adCashierRows = [];
    adQueueStatus = null;
    adLoadState = { staff: 'idle', requests: 'idle', queue: 'idle' };
}

async function adSessionStillValid() {
    try {
        const response = await fetch('/auth/me');
        return response.ok;
    } catch (error) {
        return true;
    }
}

function handleAdminSessionLost() {
    clearAdminData();
    renderAdAll();
    adminDashboardView.classList.add('hidden');
    openAdminLogin();
    const errorEl = document.getElementById('adminLoginError');
    errorEl.textContent = 'Your session has expired. Please sign in again.';
    errorEl.classList.add('show');
}

async function loadAdminData() {
    adLoading = true;
    renderAdAll();
    const [staffRows, regRows, cashRows] = await Promise.all([displayEmployees(), displayKioskRegi(), displayKioskCash()]);
    adLoading = false;

    const failed = [];
    if (staffRows) {
        adStaffAccounts = normalizeStaff(staffRows);
        adLoadState.staff = 'ok';
    } else {
        adLoadState.staff = 'error';
        failed.push('staff accounts');
    }
    if (regRows && cashRows) {
        adRegistrarRows = Array.isArray(regRows) ? regRows : [];
        adCashierRows = Array.isArray(cashRows) ? cashRows : [];
        adLoadState.requests = 'ok';
    } else {
        adLoadState.requests = 'error';
        failed.push('school records requests');
    }

    const banner = document.getElementById('adLoadError');
    if (failed.length) {
        if (!(await adSessionStillValid())) {
            handleAdminSessionLost();
            return;
        }
        document.getElementById('adLoadErrorText').textContent = 'Could not load ' + failed.join(' and ') + '. Please try again.';
        banner.hidden = false;
    } else {
        banner.hidden = true;
    }
    renderAdAll();
    refreshQueueStatus();
}

document.getElementById('adLoadRetry').addEventListener('click', loadAdminData);
document.getElementById('adReqRefresh').addEventListener('click', loadAdminData);

function renderAdAll() {
    renderAdOverview();
    renderAdStaffTable();
    renderAdQueue();
    renderAdRequestTable();
}

function renderAdOverview() {
    const staffOk = adLoadState.staff === 'ok';
    const reqOk = adLoadState.requests === 'ok';
    const dash = '\u2014';

    const total = adStaffAccounts.length;
    const active = adStaffAccounts.filter(a => a.status === 'active').length;
    document.getElementById('adStatTotal').textContent = staffOk ? total : dash;
    document.getElementById('adStatActive').textContent = staffOk ? active : dash;
    document.getElementById('adStatInactive').textContent = staffOk ? total - active : dash;

    const requests = allAdRequests();
    const pending = requests.filter(r => r.status === 'waiting' || r.status === 'serving' || r.status === 'held').length;
    const completed = requests.filter(r => r.status === 'completed').length;
    document.getElementById('adStatRequests').textContent = reqOk ? requests.length : dash;
    document.getElementById('adStatPending').textContent = reqOk ? pending : dash;
    document.getElementById('adStatCompleted').textContent = reqOk ? completed : dash;

    document.getElementById('adRoleBreakdown').innerHTML = staffOk
        ? ['Registrar', 'Cashier'].map(r => {
            const n = adStaffAccounts.filter(a => a.role === r).length;
            return '<div class="ad-role-row">' + r + ' Staff<span>' + n + '</span></div>';
        }).join('')
        : '<p class="ad-empty-note" style="margin-left:0;">' + (adLoading ? 'Loading\u2026' : 'Staff data is unavailable.') + '</p>';

    const list = document.getElementById('adRecentList');
    const empty = document.getElementById('adRecentEmpty');
    const recent = requests.slice(0, 6);
    list.innerHTML = recent.map(r =>
        '<li class="ad-activity-item"><span class="ad-activity-text">' + adStaffEscape(r.type) + ' #' + adStaffEscape(r.id) + ' \u2014 ' + adStaffEscape(r.name || 'No name') + ' (' + adStaffEscape(adStatusLabel(r.status)) + ')</span><span class="ad-activity-time">' + adStaffEscape(adFormatDate(r.date)) + '</span></li>'
    ).join('');
    if (recent.length) {
        empty.hidden = true;
    } else {
        empty.textContent = adLoading ? 'Loading\u2026' : (reqOk ? 'No requests have been submitted yet.' : 'Request data is unavailable.');
        empty.hidden = false;
    }
}

function renderAdQueue() {
    function fill(ticketId, metaId, snap) {
        const ticketEl = document.getElementById(ticketId);
        const metaEl = document.getElementById(metaId);
        if (!snap) {
            ticketEl.textContent = '\u2014';
            metaEl.textContent = adLoading ? 'Loading\u2026' : 'Queue status is unavailable.';
            return;
        }
        ticketEl.textContent = snap.ticket ? '#' + snap.ticket : 'None';
        metaEl.textContent = (snap.ticket ? 'Now serving' : 'No ticket being served') + ' \u00b7 ' + snap.waiting + ' waiting';
    }
    fill('adLiveRegTicket', 'adLiveRegMeta', adQueueStatus && adQueueStatus.registrar);
    fill('adLiveCshTicket', 'adLiveCshMeta', adQueueStatus && adQueueStatus.cashier);
}

function renderAdStaffTable() {
    const tbody = document.getElementById('adStaffTbody');
    const emptyMsg = document.getElementById('adStaffEmpty');
    const term = adStaffSearchTerm.trim().toLowerCase();

    const filtered = adStaffAccounts.filter(s => {
        const matchesStatus = adStaffStatusFilter === 'all' || s.status === adStaffStatusFilter;
        const matchesTerm = !term || s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term) || s.role.toLowerCase().includes(term);
        return matchesStatus && matchesTerm;
    });

    if (!filtered.length) {
        tbody.innerHTML = '';
        if (adLoading && !adStaffAccounts.length) emptyMsg.textContent = 'Loading staff accounts\u2026';
        else if (adLoadState.staff === 'error') emptyMsg.textContent = 'Staff accounts could not be loaded.';
        else emptyMsg.textContent = adStaffAccounts.length ? 'No staff accounts match your search.' : 'No staff accounts yet. Use + Add to create the first one.';
        emptyMsg.hidden = false;
        return;
    }
    emptyMsg.hidden = true;

    tbody.innerHTML = filtered.map(s => `
      <tr data-id="${adStaffEscape(s.id)}">
        <td class="ad-staff-name">${adStaffEscape(s.name)}</td>
        <td>${adStaffEscape(s.role)}</td>
        <td class="ad-staff-email">${adStaffEscape(s.email)}</td>
        <td>${adStaffEscape(s.contact)}</td>
        <td><span class="ad-staff-pill ${s.status === 'active' ? 'active' : 'deactivated'}">${s.status === 'active' ? 'Active' : 'Deactivated'}</span></td>
        <td class="ad-staff-actioncol">
          <button type="button" class="ad-staff-icon-btn" data-action="view" data-id="${adStaffEscape(s.id)}" aria-label="View ${adStaffEscape(s.name)}">${adStaffIconEye}</button>
          <button type="button" class="ad-staff-icon-btn" data-action="edit" data-id="${adStaffEscape(s.id)}" aria-label="Edit ${adStaffEscape(s.name)}">${adStaffIconPencil}</button>
          <button type="button" class="ad-staff-icon-btn ${s.status === 'active' ? 'unlock' : 'lock'}" data-action="toggle" data-id="${adStaffEscape(s.id)}" aria-label="${s.status === 'active' ? 'Deactivate' : 'Activate'} ${adStaffEscape(s.name)}">${s.status === 'active' ? adStaffIconLockOpen : adStaffIconLockClosed}</button>
        </td>
      </tr>
    `).join('');
}

document.getElementById('adStaffSearch').addEventListener('input', (e) => {
    adStaffSearchTerm = e.target.value;
    renderAdStaffTable();
});
document.getElementById('adStaffStatusFilter').addEventListener('change', (e) => {
    adStaffStatusFilter = e.target.value;
    renderAdStaffTable();
});

function renderAdRequestTable() {
    const tbody = document.getElementById('adReqTbody');
    const emptyMsg = document.getElementById('adReqEmpty');
    const term = adReqSearchTerm.trim().toLowerCase();
    const all = allAdRequests();

    const filtered = all.filter(r => {
        const matchesStatus = adReqStatusFilter === 'all' || r.status === adReqStatusFilter;
        const matchesTerm = !term || r.name.toLowerCase().includes(term) || r.id.toLowerCase().includes(term);
        const matchesDate = !adReqDateFilter || adLocalDay(r.date) === adReqDateFilter;
        return matchesStatus && matchesTerm && matchesDate;
    });

    if (!filtered.length) {
        tbody.innerHTML = '';
        if (adLoading && !all.length) emptyMsg.textContent = 'Loading requests\u2026';
        else if (adLoadState.requests === 'error') emptyMsg.textContent = 'Requests could not be loaded.';
        else emptyMsg.textContent = all.length ? 'No requests match your search or filters.' : 'No requests have been submitted yet.';
        emptyMsg.hidden = false;
        return;
    }
    emptyMsg.hidden = true;

    tbody.innerHTML = filtered.slice(0, 300).map(r => `
      <tr>
        <td class="ad-staff-name">#${adStaffEscape(r.id)}</td>
        <td>${adStaffEscape(r.type)}</td>
        <td>${adStaffEscape(r.name)}</td>
        <td>${adStatusPill(r.status)}</td>
        <td>${adStaffEscape(adFormatDate(r.date))}</td>
        <td class="ad-staff-actioncol">
          <button type="button" class="ad-staff-icon-btn" data-type="${adStaffEscape(r.type)}" data-id="${adStaffEscape(r.id)}" aria-label="View request ${adStaffEscape(r.id)}">${adStaffIconEye}</button>
        </td>
      </tr>
    `).join('');
}

document.getElementById('adReqSearch').addEventListener('input', (e) => {
    adReqSearchTerm = e.target.value;
    renderAdRequestTable();
});
document.getElementById('adReqStatusFilter').addEventListener('change', (e) => {
    adReqStatusFilter = e.target.value;
    renderAdRequestTable();
});
document.getElementById('adReqDateFilter').addEventListener('change', (e) => {
    adReqDateFilter = e.target.value;
    renderAdRequestTable();
});

const adReqOverlay = document.getElementById('adReqOverlay');

function adHumanizeKey(key) {
    return String(key).replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());
}

function adDetailValue(key, value) {
    if (value === null || value === undefined || value === '') return '\u2014';
    if (/date|_at$/i.test(key)) return adFormatDate(value);
    if (/status/i.test(key)) return adStatusLabel(String(value).toLowerCase());
    return String(value);
}

document.getElementById('adReqTbody').addEventListener('click', (e) => {
    const btn = e.target.closest('.ad-staff-icon-btn');
    if (!btn) return;
    const req = allAdRequests().find(r => r.id === btn.dataset.id && r.type === btn.dataset.type);
    if (!req) return;
    document.getElementById('adReqTitle').textContent = req.type + ' Request #' + req.id;
    document.getElementById('adReqDetails').innerHTML = Object.keys(req.raw)
        .filter(k => !/password|hash|secret|token/i.test(k))
        .map(k => '<div class="ad-detail-key">' + adStaffEscape(adHumanizeKey(k)) + '</div><div class="ad-detail-val">' + adStaffEscape(adDetailValue(k, req.raw[k])) + '</div>')
        .join('');
    adReqOverlay.hidden = false;
});
document.getElementById('adReqClose').addEventListener('click', () => { adReqOverlay.hidden = true; });
adReqOverlay.addEventListener('click', (ev) => { if (ev.target === adReqOverlay) adReqOverlay.hidden = true; });

const adConfirmOverlay = document.getElementById('adConfirmOverlay');
const adConfirmOk = document.getElementById('adConfirmOk');
let adConfirmAction = null;

function askAdConfirm(title, text, okLabel, danger, onConfirm) {
    document.getElementById('adConfirmTitle').textContent = title;
    document.getElementById('adConfirmText').textContent = text;
    adConfirmOk.textContent = okLabel;
    adConfirmOk.className = danger ? 'ad-staff-btn-danger' : 'ad-staff-btn-save';
    adConfirmAction = onConfirm;
    adConfirmOverlay.hidden = false;
}

function closeAdConfirm() {
    adConfirmOverlay.hidden = true;
    adConfirmAction = null;
}

adConfirmOk.addEventListener('click', () => {
    const action = adConfirmAction;
    closeAdConfirm();
    if (action) action();
});
document.getElementById('adConfirmCancel').addEventListener('click', closeAdConfirm);
adConfirmOverlay.addEventListener('click', (e) => { if (e.target === adConfirmOverlay) closeAdConfirm(); });

const adTempOverlay = document.getElementById('adTempOverlay');

function showTempPassword(name, email, tempPassword) {
    document.getElementById('adTempText').textContent = 'Login email: ' + email + '. Give this temporary password to ' + name + '. It is shown only once and cannot be viewed again.';
    document.getElementById('adTempValue').textContent = tempPassword || '';
    adTempOverlay.hidden = false;
}

function closeTempPassword() {
    adTempOverlay.hidden = true;
    document.getElementById('adTempValue').textContent = '';
}

document.getElementById('adTempDone').addEventListener('click', closeTempPassword);
document.getElementById('adTempCopy').addEventListener('click', () => {
    const value = document.getElementById('adTempValue').textContent;
    if (navigator.clipboard && value) {
        navigator.clipboard.writeText(value).then(
            () => showAdToast('Temporary password copied.'),
            () => showAdToast('Could not copy. Select the text and copy it manually.', 'error')
        );
    }
});

const adStaffModalOverlay = document.getElementById('adStaffModalOverlay');
const adStaffModalTitle = document.getElementById('adStaffModalTitle');
const adStaffModalError = document.getElementById('adStaffModalError');
const adStaffFName = document.getElementById('adStaffFName');
const adStaffFRole = document.getElementById('adStaffFRole');
const adStaffFEmail = document.getElementById('adStaffFEmail');
const adStaffFContact = document.getElementById('adStaffFContact');
const adStaffModalSave = document.getElementById('adStaffModalSave');
const adStaffFields = [adStaffFName, adStaffFRole, adStaffFEmail, adStaffFContact];

function openAdStaffModal(mode, staff) {
    adStaffModalMode = mode;
    adStaffEditingId = staff ? staff.id : null;
    adStaffModalError.hidden = true;
    adStaffModalError.textContent = '';

    adStaffFName.value = staff ? staff.name : '';
    adStaffFRole.value = staff ? staff.role : 'Registrar';
    adStaffFEmail.value = staff ? staff.email : '';
    adStaffFContact.value = staff ? staff.contact : '';

    const readOnly = mode === 'view';
    adStaffFields.forEach(f => { f.disabled = readOnly; });
    adStaffModalSave.style.display = readOnly ? 'none' : '';
    adStaffModalSave.disabled = false;
    adStaffModalSave.textContent = 'Save';
    adStaffModalTitle.textContent = mode === 'add' ? 'Add Staff' : mode === 'edit' ? 'Edit Staff' : 'Staff Details';

    adStaffModalOverlay.hidden = false;
    if (!readOnly) adStaffFName.focus();
}

function closeAdStaffModal() {
    adStaffModalOverlay.hidden = true;
}

function showAdStaffError(msg) {
    adStaffModalError.textContent = msg;
    adStaffModalError.hidden = false;
}

document.getElementById('adStaffAddBtn').addEventListener('click', () => openAdStaffModal('add', null));
document.getElementById('adStaffModalClose').addEventListener('click', closeAdStaffModal);
document.getElementById('adStaffModalCancel').addEventListener('click', closeAdStaffModal);
adStaffModalOverlay.addEventListener('click', (e) => { if (e.target === adStaffModalOverlay) closeAdStaffModal(); });

document.getElementById('adStaffTbody').addEventListener('click', (e) => {
    const btn = e.target.closest('.ad-staff-icon-btn');
    if (!btn) return;
    const staff = adStaffAccounts.find(s => s.id === btn.dataset.id);
    if (!staff) return;
    const action = btn.dataset.action;

    if (action === 'view') openAdStaffModal('view', staff);
    else if (action === 'edit') openAdStaffModal('edit', staff);
    else if (action === 'toggle') {
        const activating = staff.status !== 'active';
        askAdConfirm(
            activating ? 'Activate account?' : 'Deactivate account?',
            activating
                ? staff.name + ' will be able to log in to the Staff Portal again.'
                : staff.name + ' will no longer be able to log in until the account is reactivated.',
            activating ? 'Activate' : 'Deactivate',
            !activating,
            async () => {
                btn.disabled = true;
                const ok = await updateStatus(staff.id, activating ? 'active' : 'deactivated');
                if (!ok) {
                    btn.disabled = false;
                    if (!(await adSessionStillValid())) return handleAdminSessionLost();
                    showAdToast('Could not update status. Try again.', 'error');
                    return;
                }
                await refreshAdStaffAccounts();
                showAdToast(staff.name + ' was ' + (activating ? 'activated.' : 'deactivated.'));
            }
        );
    }
});

async function submitAdStaff(payload) {
    adStaffBusy = true;
    adStaffModalSave.disabled = true;
    adStaffModalSave.textContent = 'Saving\u2026';
    try {
        if (adStaffModalMode === 'add') {
            const created = await addStaff(payload.name, payload.role, payload.contact, payload.email);
            if (!created.ok) {
                if (created.status === 401 || created.status === 403) {
                    closeAdStaffModal();
                    return handleAdminSessionLost();
                }
                showAdStaffError((created.status === 400 || created.status === 409)
                    ? created.message
                    : 'Could not save the staff account. Please try again.');
                return;
            }
            closeAdStaffModal();
            await refreshAdStaffAccounts();
            showAdToast('Staff account created.');
            showTempPassword(payload.name, payload.email, created.tempPassword);
        } else if (adStaffModalMode === 'edit' && adStaffEditingId) {
            const ok = await updateInfo(adStaffEditingId, payload.name, payload.role, payload.contact, payload.email);
            if (!ok) {
                if (!(await adSessionStillValid())) {
                    closeAdStaffModal();
                    return handleAdminSessionLost();
                }
                showAdStaffError('Could not update the staff account. Please try again.');
                return;
            }
            closeAdStaffModal();
            await refreshAdStaffAccounts();
            showAdToast('Staff details updated.');
        }
    } finally {
        adStaffBusy = false;
        adStaffModalSave.disabled = false;
        adStaffModalSave.textContent = 'Save';
    }
}

adStaffModalSave.addEventListener('click', () => {
    if (adStaffBusy) return;
    const payload = {
        name: adStaffFName.value.trim(),
        role: adStaffFRole.value.trim(),
        email: adStaffFEmail.value.trim().toLowerCase(),
        contact: adStaffFContact.value.trim()
    };

    if (!payload.name || !payload.email || !payload.contact) return showAdStaffError('Please fill in all fields.');
    if (!/^\S+@\S+\.\S+$/.test(payload.email)) return showAdStaffError('Please enter a valid email address.');
    if (!['Registrar', 'Cashier'].includes(payload.role)) return showAdStaffError('Please select a valid role.');
    if (!/^[0-9+()\-\s]{7,20}$/.test(payload.contact)) return showAdStaffError('Please enter a valid contact number.');

    if (adStaffModalMode === 'edit') {
        askAdConfirm('Save changes?', 'Update the account details for ' + payload.name + '?', 'Save Changes', false, () => submitAdStaff(payload));
    } else {
        submitAdStaff(payload);
    }
});

renderAdAll();

//---------- Admin header dropdown (profile / logout) ----------
const adProfileBtn = document.getElementById('adProfileBtn');
const adProfileDropdown = document.getElementById('adProfileDropdown');

adProfileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    adProfileDropdown.classList.toggle('open');
});
document.addEventListener('click', () => {
    adProfileDropdown.classList.remove('open');
});

//Logout — closes the Admin Dashboard and returns to the Staff Access
//login screen within the same page.
document.getElementById('adLogoutBtn').addEventListener('click', () => {
    logoutRequest();
    clearAdminData();
    renderAdAll();
    adProfileDropdown.classList.remove('open');
    adminDashboardView.classList.add('hidden');
    goToStep(0);
});

let adViewYear = 2026, adViewMonth = 5;
let adSelectedDate = { year: 2026, month: 5, day: 15 };

function renderAdminCalendar() {
    const adCalGrid = document.getElementById('adCalGrid');
    document.getElementById('adCalTitle').textContent = monthNames[adViewMonth] + ' ' + adViewYear;
    adCalGrid.innerHTML = '';
    ['SUN', 'MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'].forEach(d => {
        const el = document.createElement('div');
        el.className = 'ad-cal-dow';
        el.textContent = d;
        adCalGrid.appendChild(el);
    });

    const firstDay = new Date(adViewYear, adViewMonth, 1).getDay();
    const daysInMonth = new Date(adViewYear, adViewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(adViewYear, adViewMonth, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
        const el = document.createElement('div');
        el.className = 'ad-cal-day muted';
        el.textContent = prevMonthDays - i;
        adCalGrid.appendChild(el);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const el = document.createElement('div');
        el.className = 'ad-cal-day';
        el.textContent = d;
        const isToday = today.getFullYear() === adViewYear && today.getMonth() === adViewMonth && today.getDate() === d;
        const isSelected = adSelectedDate.year === adViewYear && adSelectedDate.month === adViewMonth && adSelectedDate.day === d;
        if (isToday) el.classList.add('today');
        if (isSelected) el.classList.add('selected');
        el.addEventListener('click', () => {
            adSelectedDate = { year: adViewYear, month: adViewMonth, day: d };
            renderAdminCalendar();
            //TODO: fetch admin queue/staff data for adSelectedDate from backend
            //what ~ moreno
        });
        adCalGrid.appendChild(el);
    }
    const totalCells = firstDay + daysInMonth;
    const trailing = (7 - (totalCells % 7)) % 7;
    for (let d = 1; d <= trailing; d++) {
        const el = document.createElement('div');
        el.className = 'ad-cal-day muted';
        el.textContent = d;
        adCalGrid.appendChild(el);
    }
}

document.getElementById('adCalPrev').addEventListener('click', () => {
    adViewMonth--;
    if (adViewMonth < 0) { adViewMonth = 11; adViewYear--; }
    renderAdminCalendar();
});
document.getElementById('adCalNext').addEventListener('click', () => {
    adViewMonth++;
    if (adViewMonth > 11) { adViewMonth = 0; adViewYear++; }
    renderAdminCalendar();
});

//Live queue snapshot for the Admin Dashboard (fed by refreshQueueStatus)
function updateAdminDashboardData(data) {
    adQueueStatus = {
        registrar: { ticket: data.registrarTicket === '—' ? null : data.registrarTicket, waiting: data.registrarWaiting },
        cashier: { ticket: data.cashierTicket === '—' ? null : data.cashierTicket, waiting: data.cashierWaiting }
    };
    adLoadState.queue = 'ok';
    renderAdQueue();
}

[document.getElementById('adminUser'), document.getElementById('adminPass')].forEach(input => {
    input.addEventListener('input', () => {
        input.classList.remove('invalid');
        document.getElementById('adminLoginError').classList.remove('show');
    });
});

//Login
const dashboardBtn = document.querySelector('.btn-dashboard');
dashboardBtn.addEventListener('click', async () => {
    const usernameInput = document.getElementById('user');
    const passwordInput = document.getElementById('pass');
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    //Validate both fields are filled
    let usernameValid = username !== '';
    let passwordValid = password !== '';

    //Mark fields as invalid if empty
    if (!usernameValid) {
        usernameInput.classList.add('invalid');
        usernameInput.closest('.field').classList.add('has-error');
        if (!usernameInput.closest('.field').querySelector('.error-text')) {
            const errorEl = document.createElement('div');
            errorEl.className = 'error-text';
            errorEl.textContent = 'Username is required.';
            usernameInput.closest('.field').appendChild(errorEl);
        }
    }

    if (!passwordValid) {
        passwordInput.classList.add('invalid');
        passwordInput.closest('.field').classList.add('has-error');
        if (!passwordInput.closest('.field').querySelector('.error-text')) {
            const errorEl = document.createElement('div');
            errorEl.className = 'error-text';
            errorEl.textContent = 'Password is required.';
            passwordInput.closest('.field').appendChild(errorEl);
        }
    }

    //If either field is empty, stop here
    if (!usernameValid || !passwordValid) {
        return;
    }

    //Both fields are filled — check the credentials against the backend
    const result = await loginRequest(username, password);
    const isStaff = result.ok && ['Registrar', 'Cashier'].includes(result.user.role);

    if (isStaff) {
        //Successful login — proceed directly to the Staff Portal
        //(now: counter selection first; the portal opens once a counter is picked)
        credentials.username = username.toLowerCase();
        credentials.fullName = result.user.name;
        credentials.role = result.user.role.toLowerCase();
        selectedCounter = null;
        sessionStorage.removeItem('lynxCounter');
        goToStep(4);
    } else {
        if (result.ok) await logoutRequest(); //an Admin account used the staff form

        //Invalid credentials
        usernameInput.classList.add('invalid');
        usernameInput.closest('.field').classList.add('has-error');
        if (usernameInput.closest('.field').querySelector('.error-text')) {
            usernameInput.closest('.field').querySelector('.error-text').textContent = 'Invalid username or password.';
        } else {
            const errorEl = document.createElement('div');
            errorEl.className = 'error-text';
            errorEl.textContent = 'Invalid username or password.';
            usernameInput.closest('.field').appendChild(errorEl);
        }
    }
});

//Clear login errors on input
const usernameInputField = document.getElementById('user');
const passwordInputField = document.getElementById('pass');

usernameInputField.addEventListener('input', () => {
    const field = usernameInputField.closest('.field');
    field.classList.remove('has-error');
    usernameInputField.classList.remove('invalid');
});

passwordInputField.addEventListener('input', () => {
    const field = passwordInputField.closest('.field');
    field.classList.remove('has-error');
    passwordInputField.classList.remove('invalid');
});


//Counter card selection
//Cards come from the server: occupied counters are blocked, and the claim is checked again on click.
async function loadCounterCards() {
    try {
        const response = await fetch('/staff/staff_counters');
        if (!response.ok) return;
        const counters = await response.json();
        document.querySelectorAll('.counter-card').forEach(card => {
            const info = counters.find(c => String(c.counter) === card.dataset.counter);
            const occupied = !!(info && info.occupied);
            card.classList.toggle('occupied', occupied);
            card.classList.toggle('available', !occupied);
            const status = card.querySelector('.counter-status');
            if (status) {
                status.classList.toggle('occupied', occupied);
                status.classList.toggle('available', !occupied);
                status.textContent = occupied ? 'Occupied' : 'Available';
            }
            const staff = card.querySelector('.counter-staff');
            if (staff) staff.textContent = occupied && info.staffName ? info.staffName : '';
        });
    } catch (error) {
        console.error(error);
    }
}

document.querySelectorAll('.counter-card').forEach(card => {
    card.addEventListener('click', async () => {
        if (card.classList.contains('occupied')) return;
        const counterNum = card.dataset.counter;
        try {
            const response = await fetch('/staff/staff_claimCounter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ counter: counterNum })
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                alert(body.message || 'Could not take that counter.');
                loadCounterCards();
                return;
            }
            selectedCounter = counterNum;
            sessionStorage.setItem('lynxCounter', counterNum);
            console.log('Selected counter:', counterNum);
            //Proceed to the Staff Portal view, only reachable once a vacant slot is confirmed
            goToStep(5);
        } catch (error) {
            console.error(error);
            alert('Network error');
        }
    });
});

//Back button on counter selection screen
//(also logs out, so the login form is not shown while the server still thinks you are logged in)
function backToLoginFromCounters() {
    logoutRequest();
    selectedCounter = null;
    sessionStorage.removeItem('lynxCounter');
    goToStep(0);
}
document.getElementById('backToLoginBtn').addEventListener('click', backToLoginFromCounters);
document.getElementById('backToLogin2').addEventListener('click', backToLoginFromCounters);

//Keep the counter screen current while it is open (a counter taken by someone else shows up without a refresh)
setInterval(() => {
    if (!counterTicket.classList.contains('hidden')) loadCounterCards();
}, 3000)

goToStep(0);

function togglePw(btn) {
    const input = btn.previousElementSibling;
    const isPw = input.type === 'password';
    input.type = isPw ? 'text' : 'password';
    btn.setAttribute('aria-label', isPw ? 'Hide password' : 'Show password');
    btn.innerHTML = isPw
        ? '<svg viewBox="0 0 24 24"><path d="M17.94 17.94A10.94 10.94 0 0112 20C5 20 1 12 1 12a19.6 19.6 0 015.06-6.06M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a19.6 19.6 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
}
//===== STAFF PORTAL LOGIC =====

//---------- Populate the Staff Portal from the in-memory staff context ----------
//Called every time goToStep(5) runs, since the same page/session carries
//the credentials + selectedCounter set earlier in the Staff Access flow.
const roleLabels = { registrar: 'Registrar Staff', cashier: 'Cashier Staff' };

function populateStaffPortal() {
    const roleLabel = roleLabels[credentials.role] || '';
    const displayName = credentials.fullName || credentials.username || 'Staff Member';

    //Header subtitle: "Staff Management Dashboard — Counter 2 · Registrar Staff"
    const hsubLine = document.getElementById('hsubLine');
    const subParts = [];
    if (selectedCounter) subParts.push('Counter ' + selectedCounter);
    if (roleLabel) subParts.push(roleLabel);
    hsubLine.textContent = subParts.length
        ? 'Staff Management Dashboard — ' + subParts.join(' · ')
        : 'Staff Management Dashboard';

    //Profile dropdown identity block
    document.getElementById('dropdownUserName').textContent = displayName;
    document.getElementById('dropdownUserMeta').textContent = subParts.length
        ? subParts.join(' · ')
        : (credentials.username ? 'Signed in' : 'Not signed in');

    //Show only the queue panel matching this staff member's role — not the other counter's
    const regCol = document.getElementById('regCounterCol');
    const cshCol = document.getElementById('cshCounterCol');
    const queueSplit = document.getElementById('queueSplit');
    if (credentials.role === 'registrar') {
        if (regCol) regCol.classList.remove('hidden');
        if (cshCol) cshCol.classList.add('hidden');
    } else if (credentials.role === 'cashier') {
        if (cshCol) cshCol.classList.remove('hidden');
        if (regCol) regCol.classList.add('hidden');
    } else {
        //Role unknown (shouldn't normally happen) — fall back to showing both
        if (regCol) regCol.classList.remove('hidden');
        if (cshCol) cshCol.classList.remove('hidden');
    }
    if (queueSplit) queueSplit.style.gridTemplateColumns = '1fr';
    loadQueuePage();
}

//Logout — returns to the Staff Access login screen within the same page
document.getElementById('logoutBtn').addEventListener('click', () => {
    logoutRequest();
    selectedCounter = null;
    sessionStorage.removeItem('lynxCounter');
    goToStep(0);
});

//---------- Queue Page ----------
//Shows inquiries based on role
const myCounter = {
    label: 'Counter',
    closed: false,
    transactionLimit: null,
    serving: null,
    waiting: [],
    onHold: [],
    history: [],
};


let isCalling = false;
let isActing = false;

let showingOnHold = false;

const counterTabsEl = document.getElementById('counterTabs');
const servingBodyEl = document.getElementById('servingBody');
const closeCounterBtn = document.getElementById('closeCounterBtn');
const waitingCountLabel = document.getElementById('waitingCountLabel');
const waitingListEl = document.getElementById('waitingList');
const callNextBtn = document.getElementById('callNextBtn');
const onHoldToggleBtn = document.getElementById('onHoldToggleBtn');
const onHoldCountEl = document.getElementById('onHoldCount');
const txnLimitBtn = document.getElementById('txnLimitBtn');
const historyTableBody = document.getElementById('historyTableBody');

//A single, non-interactive badge showing only this staff member's own counter —
//other counters are not visible or reachable from here.
function renderCounterTabs() {
    counterTabsEl.innerHTML = '';
    const badge = document.createElement('div');
    badge.className = 'counter-tab qactive';
    badge.textContent = myCounter.label;
    counterTabsEl.appendChild(badge);
}

function renderServing() {
    const c = myCounter;
    closeCounterBtn.textContent = c.closed ? 'Reopen Counter' : 'Close Counter';
    closeCounterBtn.classList.toggle('reopen', c.closed);

    if (c.closed) {
        servingBodyEl.innerHTML = `<div class="serving-empty">This counter is currently closed.</div>`;
        return;
    }

    if (c.serving) {
        servingBodyEl.innerHTML = `
        <div class="serving-ticket-num">${c.serving.ticket}</div>
        <div class="serving-name">${c.serving.name}</div>
        <div class="serving-actions">
          <button class="btn-hold" id="holdBtn" type="button">Hold</button>
          <button class="btn-complete" id="completeBtn" type="button">Complete</button>
        </div>
      `;
        document.getElementById('holdBtn').addEventListener('click', () => holdCurrent());
        document.getElementById('completeBtn').addEventListener('click', () => completeCurrent());
    } else {
        servingBodyEl.innerHTML = `<div class="serving-empty">No customer being served. Call the next customer to begin.</div>`;
    }
}

function renderWaiting() {
    const c = myCounter;
    const list = showingOnHold ? c.onHold : c.waiting;

    waitingCountLabel.textContent = showingOnHold
        ? c.onHold.length + ' on hold'
        : c.waiting.length + ' customer' + (c.waiting.length === 1 ? '' : 's') + ' waiting';

    onHoldCountEl.textContent = c.onHold.length;
    onHoldToggleBtn.classList.toggle('qactive', showingOnHold);

    if (list.length === 0) {
        waitingListEl.innerHTML = `<div class="waiting-list-empty">${showingOnHold ? 'No tickets on hold.' : 'No customers waiting.'}</div>`;
    } else {
        waitingListEl.innerHTML = list.map((item, i) => `
        <div class="waiting-row-item">
          <div class="waiting-pos">#${i + 1}</div>
          <div class="waiting-item-info">
            <div class="waiting-item-ticket">${item.ticket}</div>
            <div class="waiting-item-name">${item.name}</div>
          </div>
          ${showingOnHold
                ? `<button class="waiting-item-resume" data-ticket="${item.ticket}">Resume</button>`
                : `<div class="waiting-item-time">${item.waitMins} mins</div>`
            }
        </div>
      `).join('');

        if (showingOnHold) {
            waitingListEl.querySelectorAll('.waiting-item-resume').forEach(btn => {
                btn.addEventListener('click', () => resumeFromHold(btn.dataset.ticket));
            });
        }
    }

    const canCallNext = !c.closed && !c.serving && c.waiting.length > 0;
    callNextBtn.disabled = !canCallNext;
}

function renderHistory() {
    const c = myCounter;
    if (c.history.length === 0) {
        historyTableBody.innerHTML = `
        <tr class="history-empty-row"><td colspan="5">No completed or cancelled transactions yet today.</td></tr>
        <tr class="history-empty-row"><td colspan="5">&nbsp;</td></tr>
      `;
        return;
    }
    historyTableBody.innerHTML = c.history.map(h => `
      <tr>
        <td>${h.ticket}</td>
        <td>${h.name}</td>
        <td>${h.type}</td>
        <td><span class="history-status ${h.status}">${h.statusLabel}</span></td>
        <td>${h.time}</td>
      </tr>
    `).join('');
}

function nowTimeLabel() {
    const d = new Date();
    return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}

//Queue action (hold / complete / resume) - fetch
async function queueAction(action, ticket) {
    if (isActing) return;
    isActing = true;
    try {
        const response = await fetch('/staff/staff_queue' + action + '/' + encodeURIComponent(ticket), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ counter: selectedCounter })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) alert(body.message || 'Could not update the ticket.');
    } catch (error) {
        console.error(error);
        alert('Network error');
    }
    isActing = false;
    await loadQueuePage();
}

function holdCurrent() {
    const c = myCounter;
    if (!c.serving) return;
    queueAction('Hold', c.serving.ticket);
}

function completeCurrent() {
    const c = myCounter;
    if (!c.serving) return;
    queueAction('Complete', c.serving.ticket);
}

//Call Next Customer - fetch
async function callNextCustomer() {
    const c = myCounter;
    if (c.closed || c.serving || c.waiting.length === 0 || isCalling) return;
    isCalling = true;
    callNextBtn.disabled = true;
    try {
        const response = await fetch('/staff/staff_callNext', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ counter: selectedCounter })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) alert(body.message || 'Could not call the next customer.');
    } catch (error) {
        console.error(error);
        alert('Network error');
    }
    isCalling = false;
    await loadQueuePage();
}

function resumeFromHold(ticketNum) {
    queueAction('Resume', ticketNum);
}

//Queue Page Load - fetch
function escapeQueueText(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
async function loadQueuePage() {
    if (!selectedCounter) return;
    try {
        const response = await fetch('/staff/staff_queueMine?counter=' + encodeURIComponent(selectedCounter));
        if (response.status === 401) return;
        if (!response.ok) throw new Error('HTTP error: ' + response.status);
        const q = await response.json();
        myCounter.label = 'Counter ' + selectedCounter;
        myCounter.serving = q.serving ? { ticket: q.serving.ticket, name: escapeQueueText(q.serving.name) } : null;
        myCounter.waiting = q.waiting.map(w => ({ ticket: w.ticket, name: escapeQueueText(w.name), waitMins: w.waitMins }));
        myCounter.onHold = q.onHold.map(h => ({ ticket: h.ticket, name: escapeQueueText(h.name) }));
        myCounter.history = q.history.map(h => ({
            ticket: h.ticket,
            name: escapeQueueText(h.name),
            type: h.type,
            status: h.status,
            statusLabel: h.status === 'completed' ? 'Completed' : 'Cancelled',
            time: new Date(h.doneAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
        }));
        myCounter.transactionLimit = q.dailyLimit;
        myCounter.ticketsToday = q.ticketsToday;
        renderQueuePage();
    } catch (error) {
        console.error(error);
    }
}

setInterval(loadQueuePage, 5000);

function renderQueuePage() {
    renderCounterTabs();
    renderServing();
    renderWaiting();
    renderHistory();
}

closeCounterBtn.addEventListener('click', () => {
    myCounter.closed = !myCounter.closed;
    renderQueuePage();
    //TODO: PATCH /api/counters/{counter} { status: myCounter.closed ? 'closed' : 'open' }
});

callNextBtn.addEventListener('click', callNextCustomer);

onHoldToggleBtn.addEventListener('click', () => {
    showingOnHold = !showingOnHold;
    renderWaiting();
});

//Transaction Limit - fetch
txnLimitBtn.addEventListener('click', async () => {
    const c = myCounter;
    const input = window.prompt(
        'Set the daily ticket limit for this queue (tickets issued today: ' + (c.ticketsToday ?? 0) + '). Leave empty to use the default:',
        c.transactionLimit || ''
    );
    if (input === null) return;
    const trimmed = input.trim();
    const num = trimmed === '' ? null : Number(trimmed);
    if (num !== null && (!Number.isInteger(num) || num < 1)) {
        alert('Enter a whole number greater than 0.');
        return;
    }
    try {
        const response = await fetch('/staff/staff_queueLimit', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit: num })
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) alert(body.message || 'Could not save the limit.');
    } catch (error) {
        console.error(error);
        alert('Network error');
    }
    await loadQueuePage();
});

renderQueuePage();

//---------- Tab switching ----------
const tabs = document.querySelectorAll('.tab');
const views = document.querySelectorAll('.view');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        views.forEach(v => v.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('view-' + tab.dataset.view).classList.add('active');
    });
});

//---------- Header dropdowns ----------
const profileBtn = document.getElementById('profileBtn');
const profileDropdown = document.getElementById('profileDropdown');
const menuBtn = document.getElementById('menuBtn');
const menuDropdown = document.getElementById('menuDropdown');

function toggleDropdown(btn, dropdown, e) {
    e.stopPropagation();
    const willOpen = !dropdown.classList.contains('open');
    profileDropdown.classList.remove('open');
    menuDropdown.classList.remove('open');
    if (willOpen) dropdown.classList.add('open');
}
profileBtn.addEventListener('click', (e) => toggleDropdown(profileBtn, profileDropdown, e));
menuBtn.addEventListener('click', (e) => toggleDropdown(menuBtn, menuDropdown, e));
document.addEventListener('click', () => {
    profileDropdown.classList.remove('open');
    menuDropdown.classList.remove('open');
});

//---------- Calendar ----------
const calGrid = document.getElementById('calGrid');
const calTitle = document.getElementById('calTitle');
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let viewYear = 2026, viewMonth = 5; //June 2026 (0-indexed)
let selectedDate = { year: 2026, month: 5, day: 15 };
const today = new Date();

function renderCalendar() {
    calTitle.textContent = monthNames[viewMonth] + ' ' + viewYear;
    calGrid.innerHTML = '';
    ['SUN', 'MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'].forEach(d => {
        const el = document.createElement('div');
        el.className = 'cal-dow';
        el.textContent = d;
        calGrid.appendChild(el);
    });

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    //leading days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
        const el = document.createElement('div');
        el.className = 'cal-day muted';
        el.textContent = prevMonthDays - i;
        calGrid.appendChild(el);
    }
    //current month days
    for (let d = 1; d <= daysInMonth; d++) {
        const el = document.createElement('div');
        el.className = 'cal-day';
        el.textContent = d;
        const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;
        const isSelected = selectedDate.year === viewYear && selectedDate.month === viewMonth && selectedDate.day === d;
        if (isToday) el.classList.add('today');
        if (isSelected) el.classList.add('selected');
        el.addEventListener('click', () => {
            selectedDate = { year: viewYear, month: viewMonth, day: d };
            renderCalendar();
            //TODO: fetch queue/transaction data for selectedDate from backend
        });
        calGrid.appendChild(el);
    }
    //trailing days from next month to fill the grid
    const totalCells = firstDay + daysInMonth;
    const trailing = (7 - (totalCells % 7)) % 7;
    for (let d = 1; d <= trailing; d++) {
        const el = document.createElement('div');
        el.className = 'cal-day muted';
        el.textContent = d;
        calGrid.appendChild(el);
    }
}

document.getElementById('calPrev').addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
});
document.getElementById('calNext').addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
});
renderCalendar();

//---------- Bar charts ----------
function renderBarChart(containerId, data, peakKeys, wrapClass, valClass, barClass, xlabelClass) {
    wrapClass = wrapClass || 'bar-wrap';
    valClass = valClass || 'bar-val';
    barClass = barClass || 'bar';
    xlabelClass = xlabelClass || 'bar-xlabel';
    const container = document.getElementById(containerId);
    const max = Math.max(...data.map(d => d.value));
    container.innerHTML = '';
    data.forEach(d => {
        const wrap = document.createElement('div');
        wrap.className = wrapClass;
        const heightPct = Math.max(6, (d.value / max) * 100);
        const isPeak = peakKeys.includes(d.label);
        wrap.innerHTML = `
        <div class="${valClass}">${d.value}</div>
        <div class="${barClass}${isPeak ? ' peak' : ''}" style="height:${heightPct}%"></div>
        <div class="${xlabelClass}">${d.label}</div>
      `;
        container.appendChild(wrap);
    });
}

renderBarChart('hoursChart', [
    { label: '8 AM', value: 5 },
    { label: '10 AM', value: 8 },
    { label: '1 PM', value: 15 },
    { label: '2 PM', value: 13 },
    { label: '3 PM', value: 10 },
], ['1 PM', '2 PM']);

renderBarChart('seasonChart', [
    { label: 'JAN', value: 20 },
    { label: 'MAR', value: 80 },
    { label: 'MAY', value: 178 },
    { label: 'JUL', value: 160 },
    { label: 'SEP', value: 120 },
    { label: 'NOV', value: 60 },
], ['MAY', 'JUL']);

//---------- Mock real-time update hook ----------
//In production, replace this with a WebSocket or polling connection
//that pushes live counter/queue data from the backend database.

//Queue from Kiosk
refreshQueueStatus();
setInterval(refreshQueueStatus, 5000);
function updateDashboardData(data) {
    if (data.totalWaiting !== undefined) document.getElementById('statWaiting').textContent = data.totalWaiting;
    if (data.currentlyServing !== undefined) document.getElementById('statServing').textContent = data.currentlyServing;
    if (data.activeCounters !== undefined) document.getElementById('statCounters').innerHTML = data.activeCounters + '<small>/5</small>';
    if (data.registrarTicket) document.getElementById('regTicket').textContent = data.registrarTicket;
    if (data.registrarWaiting !== undefined) document.getElementById('regWaiting').textContent = data.registrarWaiting;
    if (data.cashierTicket) document.getElementById('cshTicket').textContent = data.cashierTicket;
    if (data.cashierWaiting !== undefined) document.getElementById('cshWaiting').textContent = data.cashierWaiting;
}
//Example: updateDashboardData({ totalWaiting: 7, registrarTicket: 'F113' });

//---------- Restore login after refresh ----------
//Login
(async () => {
    try {
        const response = await fetch('/auth/me');
        if (!response.ok) return;
        const user = await response.json();
        if (user.role === 'Admin') {
            openAdminDashboard();
        } else {
            credentials.fullName = user.name;
            credentials.role = user.role.toLowerCase();
            selectedCounter = sessionStorage.getItem('lynxCounter');
            goToStep(selectedCounter ? 5 : 4);
        }
    } catch (error) {
        console.error(error);
    } finally {
        document.body.style.visibility = '';
    }
})();