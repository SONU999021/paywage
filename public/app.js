// App State Configuration
const state = {
  currentView: 'dashboard',
  selectedMonth: '2026-05',
  employees: [],
  leaves: [],
  settings: {},
  payrollData: null, // For the current month
  editingEmployeeCode: null
};

// API Endpoints
const API = {
  getSettings: () => fetch('/api/settings').then(r => r.json()),
  saveSettings: (data) => fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  
  getEmployees: () => fetch('/api/employees').then(r => r.json()),
  saveEmployee: (emp, isEdit) => fetch(isEdit ? `/api/employees/${emp.employeeCode}` : '/api/employees', {
    method: isEdit ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emp)
  }).then(async r => {
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.error || 'Failed to save employee');
    }
    return r.json();
  }),
  deleteEmployee: (code) => fetch(`/api/employees/${code}`, { method: 'DELETE' }).then(r => r.json()),
  importExcel: () => fetch('/api/employees/import', { method: 'POST' }).then(r => r.json()),
  
  getLeaves: () => fetch('/api/leaves').then(r => r.json()),
  applyLeave: (leave) => fetch('/api/leaves', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leave)
  }).then(r => r.json()),
  updateLeave: (id, update) => fetch(`/api/leaves/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update)
  }).then(r => r.json()),
  deleteLeave: (id) => fetch(`/api/leaves/${id}`, { method: 'DELETE' }).then(r => r.json()),
  
  getPayroll: (month) => fetch(`/api/payroll/${month}`).then(r => r.json()),
  savePayroll: (month, records) => fetch(`/api/payroll/${month}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records })
  }).then(r => r.json())
};

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupEventListeners();
  loadAllData();
});

// Load everything
async function loadAllData() {
  try {
    state.settings = await API.getSettings();
    state.employees = await API.getEmployees();
    state.leaves = await API.getLeaves();
    
    // Sync month selectors
    document.getElementById('payroll-month-select').value = state.selectedMonth;
    
    // Refresh active views
    updateSettingsForm();
    await refreshPayrollData();
    refreshEmployeesView();
    refreshLeavesView();
    refreshDashboardView();
  } catch (err) {
    console.error('Data loading error:', err);
    alert('Error connecting to the server. Please ensure the backend is running.');
  }
}

// ----------------------------------------------------
// NAVIGATION HANDLING
// ----------------------------------------------------
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-menu .nav-item');
  const panels = document.querySelectorAll('.view-panel');
  const headings = {
    dashboard: { title: 'Dashboard Summary', sub: 'A summary of the current monthly payroll activities.' },
    employees: { title: 'Employee Directory', sub: 'Manage your personnel records, salaries, and allowances.' },
    leaves: { title: 'Leaves Tracker & Approvals', sub: 'Approve, disapprove, and record employee leaves.' },
    payroll: { title: 'Payroll Calculation Run', sub: 'Calculate monthly wages, edit LOP/TDS, and export salary slips.' },
    settings: { title: 'System Configuration', sub: 'Adjust tax parameters, PF eligibility caps, and company metadata.' }
  };

  function switchView(targetId) {
    navItems.forEach(item => {
      if (item.getAttribute('href') === `#${targetId}`) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    panels.forEach(panel => {
      if (panel.id === `view-${targetId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Update Topbar Title
    const h = headings[targetId] || { title: 'Payroll System', sub: '' };
    document.getElementById('page-heading').textContent = h.title;
    document.getElementById('page-subheading').textContent = h.sub;
    
    state.currentView = targetId;
    
    // Perform view specific refresh
    if (targetId === 'dashboard') refreshDashboardView();
    if (targetId === 'employees') refreshEmployeesView();
    if (targetId === 'leaves') refreshLeavesView();
    if (targetId === 'payroll') refreshPayrollData();
  }

  // Bind sidebar clicks
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('href').substring(1);
      window.location.hash = targetId;
      switchView(targetId);
    });
  });

  // Manage initial hash
  const initialHash = window.location.hash.substring(1);
  if (headings[initialHash]) {
    switchView(initialHash);
  }
}

// ----------------------------------------------------
// EVENT LISTENERS BINDING
// ----------------------------------------------------
function setupEventListeners() {
  // Global Month selector changes
  document.getElementById('payroll-month-select').addEventListener('change', async (e) => {
    state.selectedMonth = e.target.value;
    await refreshPayrollData();
    refreshDashboardView();
  });
  
  // Dashboard links
  document.getElementById('link-all-leaves').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('btn-nav-leaves').click();
  });
  
  document.getElementById('btn-quick-import').addEventListener('click', () => {
    triggerExcelImport();
  });

  // Settings profile form submit
  document.getElementById('form-settings-company').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const companyName = document.getElementById('settings-company-name').value;
      const companyAddress = document.getElementById('settings-company-address').value;
      
      state.settings = await API.saveSettings({ companyName, companyAddress });
      alert('Company profile saved successfully!');
    } catch (err) {
      alert('Failed to save company settings: ' + err.message);
    }
  });

  // Settings rates form submit
  document.getElementById('form-settings-rates').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const pfRate = parseFloat(document.getElementById('settings-pf-rate').value);
      const pfCap = parseFloat(document.getElementById('settings-pf-cap').value);
      const esicRate = parseFloat(document.getElementById('settings-esic-rate').value);
      const esicThreshold = parseFloat(document.getElementById('settings-esic-threshold').value);
      
      state.settings = await API.saveSettings({ pfRate, pfCap, esicRate, esicThreshold });
      alert('Statutory parameters updated successfully!');
      await refreshPayrollData(); // Recalculate payroll
    } catch (err) {
      alert('Failed to save parameters: ' + err.message);
    }
  });

  // Settings Excel load click
  document.getElementById('btn-settings-import').addEventListener('click', () => {
    triggerExcelImport();
  });

  // Add Employee Modal triggers
  document.getElementById('btn-add-employee').addEventListener('click', () => {
    openEmployeeModal(null);
  });
  document.getElementById('btn-close-employee-modal').addEventListener('click', closeEmployeeModal);
  document.getElementById('btn-cancel-employee-form').addEventListener('click', closeEmployeeModal);
  
  // Add Allowance row click inside Employee Modal
  document.getElementById('btn-add-allowance-row').addEventListener('click', () => {
    appendAllowanceRow('', 0);
  });
  
  // Employee Form submission
  document.getElementById('form-employee').addEventListener('submit', handleEmployeeFormSubmit);

  // Apply Leave Modal triggers
  document.getElementById('btn-apply-leave').addEventListener('click', openLeaveModal);
  document.getElementById('btn-close-leave-modal').addEventListener('click', closeLeaveModal);
  document.getElementById('btn-cancel-leave-form').addEventListener('click', closeLeaveModal);
  
  // Leave Form submission
  document.getElementById('form-leave').addEventListener('submit', handleLeaveFormSubmit);

  // Payroll save/lock button
  document.getElementById('btn-save-payroll').addEventListener('click', handleSavePayroll);

  // Bulk ZIP download
  document.getElementById('btn-bulk-download').addEventListener('click', () => {
    window.location.href = `/api/payroll/${state.selectedMonth}/download-bulk`;
  });

  // Global search employee list filter
  document.getElementById('global-search').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    
    if (state.currentView === 'employees') {
      const rows = document.querySelectorAll('#employee-list-body tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(val) ? '' : 'none';
      });
    } else if (state.currentView === 'payroll') {
      const rows = document.querySelectorAll('#payroll-calculation-body tr');
      rows.forEach(row => {
        // Skip last total row
        if (row.classList.contains('payroll-row-total')) return;
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(val) ? '' : 'none';
      });
    }
  });
}

// ----------------------------------------------------
// EXCEL IMPORT TRIGGER
// ----------------------------------------------------
async function triggerExcelImport() {
  const statusEl = document.getElementById('excel-import-status');
  if (statusEl) statusEl.textContent = 'Importing... Please wait.';
  
  try {
    const res = await API.importExcel();
    alert(`${res.message}\nTotal employees imported/updated: ${res.totalImported}`);
    
    if (statusEl) statusEl.textContent = 'Last import: Successful';
    
    // Reload employees & calculations
    state.employees = await API.getEmployees();
    refreshEmployeesView();
    await refreshPayrollData();
    refreshDashboardView();
  } catch (err) {
    alert('Import failed: ' + err.message);
    if (statusEl) statusEl.textContent = 'Last import: Failed';
  }
}

// ----------------------------------------------------
// DASHBOARD PANEL LOGIC
// ----------------------------------------------------
function refreshDashboardView() {
  document.getElementById('stat-active-employees').textContent = state.employees.length;
  
  // Pending leaves count
  const pendingLeaves = state.leaves.filter(l => l.status === 'Pending');
  document.getElementById('stat-pending-leaves').textContent = pendingLeaves.length;
  
  // Date and Standard days
  const [year, monthNum] = state.selectedMonth.split('-').map(Number);
  const stdDays = new Date(year, monthNum, 0).getDate();
  document.getElementById('stat-std-days').textContent = stdDays;
  
  // Total Net Payroll
  if (state.payrollData && state.payrollData.records) {
    const sum = state.payrollData.records.reduce((acc, r) => acc + r.netPayable, 0);
    document.getElementById('stat-payroll-total').textContent = `₹${sum.toLocaleString()}`;
  } else {
    document.getElementById('stat-payroll-total').textContent = '₹0';
  }
  
  // Dashboard pending leaves table
  const tbody = document.getElementById('dashboard-pending-leaves-body');
  tbody.innerHTML = '';
  
  if (pendingLeaves.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No pending leave requests</td></tr>`;
    return;
  }
  
  pendingLeaves.slice(0, 5).forEach(leave => {
    const emp = state.employees.find(e => e.employeeCode === leave.employeeCode) || { employeeName: 'Unknown' };
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="text-semibold">${emp.employeeName}</div>
        <div class="text-muted text-semibold" style="font-size: 11px;">Code: ${leave.employeeCode}</div>
      </td>
      <td>${leave.leaveType}</td>
      <td>${leave.startDate} to ${leave.endDate}</td>
      <td class="text-center text-semibold">${leave.days}</td>
      <td>
        <div class="action-buttons-group">
          <button class="btn btn-success btn-sm" onclick="handleDashboardLeaveAction('${leave.id}', 'Approved')">
            <i class="fa-solid fa-check"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="handleDashboardLeaveAction('${leave.id}', 'Disapproved')">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function handleDashboardLeaveAction(id, newStatus) {
  try {
    await API.updateLeave(id, { status: newStatus });
    state.leaves = await API.getLeaves();
    await refreshPayrollData();
    refreshDashboardView();
    refreshLeavesView();
  } catch (err) {
    alert('Failed to update leave status: ' + err.message);
  }
}
// Expose to global scope for HTML inline clicks
window.handleDashboardLeaveAction = handleDashboardLeaveAction;

// ----------------------------------------------------
// EMPLOYEES PANEL LOGIC
// ----------------------------------------------------
function refreshEmployeesView() {
  const tbody = document.getElementById('employee-list-body');
  tbody.innerHTML = '';
  
  if (state.employees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No employee records found. Click "Add New Employee" or "Bootstrap from Excel".</td></tr>`;
    return;
  }
  
  state.employees.forEach(emp => {
    const allowancesCount = emp.allowances ? emp.allowances.length : 0;
    const allowancesSum = emp.allowances ? emp.allowances.reduce((sum, a) => sum + a.amount, 0) : 0;
    const gross = (emp.basicSalary || 0) + allowancesSum;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="text-semibold">${emp.employeeCode}</td>
      <td>
        <div class="text-semibold">${emp.employeeName}</div>
        <div class="text-muted" style="font-size: 12px;">Email: ${emp.emailId || 'N/A'}</div>
      </td>
      <td>
        <div>${emp.designation || 'N/A'}</div>
        <div class="text-muted" style="font-size: 12px;">Dept: ${emp.department || 'N/A'}</div>
      </td>
      <td class="text-semibold">₹${(emp.basicSalary || 0).toLocaleString()}</td>
      <td>
        <div>${allowancesCount} Allowances</div>
        <div class="text-muted" style="font-size: 12px;">Total: ₹${allowancesSum.toLocaleString()}</div>
      </td>
      <td>
        <div>${emp.bankName || 'N/A'}</div>
        <div class="text-muted" style="font-size: 12px;">A/C: ${emp.accountNo || 'N/A'}</div>
      </td>
      <td>
        <div class="text-semibold" style="font-size: 12px;">PF: ${emp.pfEligible ? '<span class="text-emerald">YES</span>' : '<span class="text-danger">NO</span>'}</div>
        <div class="text-semibold" style="font-size: 12px;">ESIC: ${emp.esicEligible ? '<span class="text-emerald">YES</span>' : '<span class="text-danger">NO</span>'}</div>
      </td>
      <td>
        <div class="action-buttons-group">
          <button class="btn btn-secondary btn-sm" onclick="openEmployeeModal('${emp.employeeCode}')">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="handleDeleteEmployee('${emp.employeeCode}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openEmployeeModal(code) {
  state.editingEmployeeCode = code;
  const modal = document.getElementById('modal-employee');
  const title = document.getElementById('employee-modal-title');
  const form = document.getElementById('form-employee');
  const container = document.getElementById('allowances-rows-container');
  
  container.innerHTML = '';
  form.reset();
  
  if (code) {
    title.textContent = 'Edit Employee Details';
    const emp = state.employees.find(e => e.employeeCode === code);
    if (emp) {
      document.getElementById('emp-code').value = emp.employeeCode;
      document.getElementById('emp-code').disabled = true; // Cannot edit code
      document.getElementById('emp-name').value = emp.employeeName;
      document.getElementById('emp-joining').value = emp.joiningDate || '';
      document.getElementById('emp-dob').value = emp.dateOfBirth || '';
      document.getElementById('emp-designation').value = emp.designation || '';
      document.getElementById('emp-department').value = emp.department || '';
      document.getElementById('emp-pan').value = emp.pan || '';
      document.getElementById('emp-aadhaar').value = emp.aadhaar || '';
      document.getElementById('emp-mobile').value = emp.mobileNumber || '';
      document.getElementById('emp-email').value = emp.emailId || '';
      
      document.getElementById('emp-bank-name').value = emp.bankName || '';
      document.getElementById('emp-account-no').value = emp.accountNo || '';
      document.getElementById('emp-ifsc').value = emp.ifscCode || '';
      
      document.getElementById('emp-basic').value = emp.basicSalary || 0;
      document.getElementById('emp-pf-eligible').checked = emp.pfEligible !== undefined ? emp.pfEligible : true;
      document.getElementById('emp-esic-eligible').checked = !!emp.esicEligible;
      
      // Load allowances
      if (emp.allowances && emp.allowances.length > 0) {
        emp.allowances.forEach(allow => {
          appendAllowanceRow(allow.name, allow.amount);
        });
      }
    }
  } else {
    title.textContent = 'Add New Employee';
    document.getElementById('emp-code').disabled = false;
    document.getElementById('emp-pf-eligible').checked = true;
    document.getElementById('emp-esic-eligible').checked = false;
    
    // Add default allowance placeholders (HRA, Special Allowance)
    appendAllowanceRow('House Rent Allowance', 0);
    appendAllowanceRow('Special Allowance', 0);
  }
  
  modal.classList.add('show');
}

function closeEmployeeModal() {
  document.getElementById('modal-employee').classList.remove('show');
}

function appendAllowanceRow(name = '', amount = 0) {
  const container = document.getElementById('allowances-rows-container');
  const div = document.createElement('div');
  div.className = 'allowance-row';
  div.innerHTML = `
    <input type="text" class="form-control allowance-name" placeholder="Allowance Name (e.g. TA)" value="${name}" required style="flex: 2;">
    <input type="number" class="form-control allowance-amount" placeholder="Amount" value="${amount}" required style="flex: 1;">
    <button type="button" class="btn-remove-row" onclick="this.parentElement.remove()"><i class="fa-solid fa-trash"></i></button>
  `;
  container.appendChild(div);
}

async function handleEmployeeFormSubmit(e) {
  e.preventDefault();
  
  try {
    const isEdit = state.editingEmployeeCode !== null;
    const employeeCode = document.getElementById('emp-code').value;
    const employeeName = document.getElementById('emp-name').value;
    const joiningDate = document.getElementById('emp-joining').value;
    const dateOfBirth = document.getElementById('emp-dob').value;
    const designation = document.getElementById('emp-designation').value;
    const department = document.getElementById('emp-department').value;
    const pan = document.getElementById('emp-pan').value;
    const aadhaar = document.getElementById('emp-aadhaar').value;
    const mobileNumber = document.getElementById('emp-mobile').value;
    const emailId = document.getElementById('emp-email').value;
    
    const bankName = document.getElementById('emp-bank-name').value;
    const accountNo = document.getElementById('emp-account-no').value;
    const ifscCode = document.getElementById('emp-ifsc').value;
    
    const basicSalary = parseFloat(document.getElementById('emp-basic').value) || 0;
    const pfEligible = document.getElementById('emp-pf-eligible').checked;
    const esicEligible = document.getElementById('emp-esic-eligible').checked;
    
    // Compile allowances
    const allowanceRows = document.querySelectorAll('.allowance-row');
    const allowances = [];
    allowanceRows.forEach(row => {
      const name = row.querySelector('.allowance-name').value.trim();
      const amt = parseFloat(row.querySelector('.allowance-amount').value) || 0;
      if (name) {
        allowances.push({ name, amount: amt });
      }
    });
    
    const empData = {
      employeeCode, employeeName, joiningDate, dateOfBirth, designation, department,
      pan, aadhaar, mobileNumber, emailId, bankName, accountNo, ifscCode,
      basicSalary, pfEligible, esicEligible, allowances
    };
    
    await API.saveEmployee(empData, isEdit);
    alert(`Employee ${isEdit ? 'updated' : 'added'} successfully!`);
    closeEmployeeModal();
    
    // Reload state
    state.employees = await API.getEmployees();
    refreshEmployeesView();
    await refreshPayrollData();
    refreshDashboardView();
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeleteEmployee(code) {
  if (!confirm(`Are you sure you want to delete employee ${code}?`)) return;
  try {
    await API.deleteEmployee(code);
    alert('Employee deleted successfully.');
    
    // Reload
    state.employees = await API.getEmployees();
    refreshEmployeesView();
    await refreshPayrollData();
    refreshDashboardView();
  } catch (err) {
    alert('Failed to delete employee: ' + err.message);
  }
}

// Bind to window for click access
window.openEmployeeModal = openEmployeeModal;
window.handleDeleteEmployee = handleDeleteEmployee;

// ----------------------------------------------------
// LEAVES PANEL LOGIC
// ----------------------------------------------------
function refreshLeavesView() {
  const tbody = document.getElementById('leaves-list-body');
  tbody.innerHTML = '';
  
  // Sort leaves by status (pending first) then date desc
  const sorted = [...state.leaves].sort((a, b) => {
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (a.status !== 'Pending' && b.status === 'Pending') return 1;
    return new Date(b.startDate) - new Date(a.startDate);
  });
  
  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">No leave applications found. Click "Apply Leave" to record.</td></tr>`;
    return;
  }
  
  sorted.forEach(leave => {
    const emp = state.employees.find(e => e.employeeCode === leave.employeeCode) || { employeeName: 'Unknown' };
    const tr = document.createElement('tr');
    
    let statusClass = 'badge-pending';
    if (leave.status === 'Approved') statusClass = 'badge-approved';
    if (leave.status === 'Disapproved') statusClass = 'badge-disapproved';
    
    let actionsHtml = '';
    if (leave.status === 'Pending') {
      actionsHtml = `
        <div class="action-buttons-group">
          <button class="btn btn-success btn-sm" onclick="handleLeaveStatusUpdate('${leave.id}', 'Approved')">
            <i class="fa-solid fa-check"></i> Approve
          </button>
          <button class="btn btn-danger btn-sm" onclick="handleLeaveStatusUpdate('${leave.id}', 'Disapproved')">
            <i class="fa-solid fa-xmark"></i> Disapprove
          </button>
        </div>
      `;
    } else {
      actionsHtml = `
        <button class="btn btn-secondary btn-sm" onclick="handleDeleteLeave('${leave.id}')">
          <i class="fa-solid fa-trash-can"></i> Delete
        </button>
      `;
    }
    
    tr.innerHTML = `
      <td class="text-semibold">${leave.employeeCode}</td>
      <td class="text-semibold">${emp.employeeName}</td>
      <td>${leave.leaveType === 'LOP' || leave.leaveType === 'Unpaid' ? 'Loss Of Pay (Unpaid)' : leave.leaveType}</td>
      <td>${leave.startDate}</td>
      <td>${leave.endDate}</td>
      <td class="text-center text-semibold">${leave.days}</td>
      <td>${leave.reason || 'N/A'}</td>
      <td><span class="badge ${statusClass}">${leave.status}</span></td>
      <td>${actionsHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}

function openLeaveModal() {
  const select = document.getElementById('leave-emp-select');
  select.innerHTML = '<option value="">-- Choose Employee --</option>';
  
  state.employees.forEach(emp => {
    const opt = document.createElement('option');
    opt.value = emp.employeeCode;
    opt.textContent = `[${emp.employeeCode}] ${emp.employeeName}`;
    select.appendChild(opt);
  });
  
  document.getElementById('form-leave').reset();
  document.getElementById('modal-leave').classList.add('show');
}

function closeLeaveModal() {
  document.getElementById('modal-leave').classList.remove('show');
}

async function handleLeaveFormSubmit(e) {
  e.preventDefault();
  
  const employeeCode = document.getElementById('leave-emp-select').value;
  const leaveType = document.getElementById('leave-type').value;
  const days = parseFloat(document.getElementById('leave-days').value);
  const startDate = document.getElementById('leave-start').value;
  const endDate = document.getElementById('leave-end').value;
  const reason = document.getElementById('leave-reason').value;
  
  try {
    await API.applyLeave({ employeeCode, leaveType, days, startDate, endDate, reason });
    alert('Leave request submitted successfully!');
    closeLeaveModal();
    
    // Reload
    state.leaves = await API.getLeaves();
    refreshLeavesView();
    await refreshPayrollData();
    refreshDashboardView();
  } catch (err) {
    alert('Failed to submit leave: ' + err.message);
  }
}

async function handleLeaveStatusUpdate(id, newStatus) {
  try {
    await API.updateLeave(id, { status: newStatus });
    
    // Reload
    state.leaves = await API.getLeaves();
    refreshLeavesView();
    await refreshPayrollData();
    refreshDashboardView();
  } catch (err) {
    alert('Failed to update leave: ' + err.message);
  }
}

async function handleDeleteLeave(id) {
  if (!confirm('Are you sure you want to delete this leave record?')) return;
  try {
    await API.deleteLeave(id);
    alert('Leave record deleted.');
    
    // Reload
    state.leaves = await API.getLeaves();
    refreshLeavesView();
    await refreshPayrollData();
    refreshDashboardView();
  } catch (err) {
    alert('Failed to delete leave: ' + err.message);
  }
}

window.handleLeaveStatusUpdate = handleLeaveStatusUpdate;
window.handleDeleteLeave = handleDeleteLeave;

// ----------------------------------------------------
// PAYROLL CALCULATION PANEL LOGIC
// ----------------------------------------------------
async function refreshPayrollData() {
  try {
    state.payrollData = await API.getPayroll(state.selectedMonth);
    renderPayrollCalculations();
  } catch (err) {
    console.error('Payroll fetch error:', err);
  }
}

function renderPayrollCalculations() {
  const tbody = document.getElementById('payroll-calculation-body');
  tbody.innerHTML = '';
  
  const badge = document.getElementById('payroll-status-badge');
  if (state.payrollData.locked) {
    badge.textContent = 'Calculations Saved & Locked';
    badge.className = 'badge badge-approved';
    document.getElementById('btn-save-payroll').innerHTML = '<i class="fa-solid fa-unlock-keyhole"></i> Update & Re-Save';
  } else {
    badge.textContent = 'Calculation Draft';
    badge.className = 'badge badge-pending';
    document.getElementById('btn-save-payroll').innerHTML = '<i class="fa-solid fa-lock"></i> Save & Lock Calculations';
  }
  
  const records = state.payrollData.records || [];
  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="text-center text-muted">No employees available for payroll calculations. Load employee directory first.</td></tr>`;
    return;
  }
  
  // Sum counters
  let totalFixedGrossSum = 0;
  let totalBasicSum = 0;
  let totalAllowSum = 0;
  let totalPfSum = 0;
  let totalEsicSum = 0;
  let totalTdsSum = 0;
  let totalOtherSum = 0;
  let totalNetPaySum = 0;
  
  records.forEach((rec, index) => {
    totalFixedGrossSum += rec.grossFixed;
    totalBasicSum += rec.earnedBasic;
    const allowancesEarnedVal = rec.allowances.reduce((sum, a) => sum + a.earned, 0);
    totalAllowSum += allowancesEarnedVal;
    totalPfSum += rec.pf;
    totalEsicSum += rec.esic;
    totalTdsSum += rec.tds;
    totalOtherSum += rec.otherDeduction;
    totalNetPaySum += rec.netPayable;
    
    const tr = document.createElement('tr');
    tr.id = `payroll-row-${rec.employeeCode}`;
    tr.innerHTML = `
      <td>
        <div class="text-semibold">${rec.employeeName}</div>
        <div class="text-muted" style="font-size: 11px;">Code: ${rec.employeeCode} | ${rec.designation}</div>
      </td>
      <td class="text-semibold">₹${rec.grossFixed.toLocaleString()}</td>
      <td>
        <div class="inline-label">STD / LOP / WRK</div>
        <div>
          <span class="text-muted">${rec.stdDays} / </span>
          <input type="number" step="0.5" min="0" max="${rec.stdDays}" class="inline-input lop-override-input" 
            value="${rec.lopDays}" data-code="${rec.employeeCode}">
          <span class="text-muted"> / ${rec.wrkDays}</span>
        </div>
      </td>
      <td class="text-semibold">₹${rec.earnedBasic.toLocaleString()}</td>
      <td class="text-semibold">₹${allowancesEarnedVal.toLocaleString()}</td>
      <td>₹${rec.pf.toLocaleString()}</td>
      <td>₹${rec.esic.toLocaleString()}</td>
      <td>
        <input type="number" class="inline-input tds-override-input" 
          value="${rec.tds}" data-code="${rec.employeeCode}">
      </td>
      <td>
        <input type="number" class="inline-input other-override-input" 
          value="${rec.otherDeduction}" data-code="${rec.employeeCode}">
      </td>
      <td class="text-semibold text-emerald" style="font-size: 15px;">₹${rec.netPayable.toLocaleString()}</td>
      <td>
        <a class="btn btn-secondary btn-sm" href="/api/payroll/${state.selectedMonth}/download/${rec.employeeCode}">
          <i class="fa-solid fa-file-word"></i> Word Slip
        </a>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  // Append Totals Row
  const totalTr = document.createElement('tr');
  totalTr.className = 'payroll-row-total';
  totalTr.innerHTML = `
    <td>TOTALS (${records.length} Employees)</td>
    <td>₹${totalFixedGrossSum.toLocaleString()}</td>
    <td></td>
    <td>₹${totalBasicSum.toLocaleString()}</td>
    <td>₹${totalAllowSum.toLocaleString()}</td>
    <td>₹${totalPfSum.toLocaleString()}</td>
    <td>₹${totalEsicSum.toLocaleString()}</td>
    <td>₹${totalTdsSum.toLocaleString()}</td>
    <td>₹${totalOtherSum.toLocaleString()}</td>
    <td class="text-emerald" style="font-size: 16px;">₹${totalNetPaySum.toLocaleString()}</td>
    <td></td>
  `;
  tbody.appendChild(totalTr);
  
  // Set up listeners for inline changes
  setupPayrollTableInputs();
}

function setupPayrollTableInputs() {
  // Recalculate employee rows reactively when inputs change
  const lopInputs = document.querySelectorAll('.lop-override-input');
  const tdsInputs = document.querySelectorAll('.tds-override-input');
  const otherInputs = document.querySelectorAll('.other-override-input');
  
  function triggerRecalculation(code) {
    const row = document.getElementById(`payroll-row-${code}`);
    const recIndex = state.payrollData.records.findIndex(r => r.employeeCode === code);
    if (recIndex === -1) return;
    
    const rec = state.payrollData.records[recIndex];
    const emp = state.employees.find(e => e.employeeCode === code);
    
    // Read current input overrides
    const newLop = parseFloat(row.querySelector('.lop-override-input').value) || 0;
    const newTds = parseFloat(row.querySelector('.tds-override-input').value) || 0;
    const newOther = parseFloat(row.querySelector('.other-override-input').value) || 0;
    
    // Check if LOP changed from calculated
    rec.lopDays = newLop;
    rec.lopDaysOverridden = true;
    rec.tds = newTds;
    rec.otherDeduction = newOther;
    
    // Recompute
    const basic = emp.basicSalary || 0;
    rec.wrkDays = Math.max(0, rec.stdDays - newLop);
    rec.earnedBasic = Math.round(basic - (basic * newLop / rec.stdDays));
    
    let allowancesEarnedSum = 0;
    rec.allowances = (emp.allowances || []).map(allow => {
      const amt = allow.amount || 0;
      const earnedAmt = Math.round(amt - (amt * newLop / rec.stdDays));
      allowancesEarnedSum += earnedAmt;
      return {
        name: allow.name,
        original: amt,
        earned: earnedAmt
      };
    });
    
    rec.grossEarned = rec.earnedBasic + allowancesEarnedSum;
    
    // PF Calculation
    if (emp.pfEligible) {
      const pfCalculated = Math.round(rec.earnedBasic * (state.settings.pfRate / 100));
      rec.pf = Math.min(pfCalculated, state.settings.pfCap);
    } else {
      rec.pf = 0;
    }
    
    // ESIC Calculation
    if (emp.esicEligible && rec.grossEarned <= state.settings.esicThreshold) {
      rec.esic = Math.round(rec.grossEarned * (state.settings.esicRate / 100));
    } else {
      rec.esic = 0;
    }
    
    rec.totalDeductions = rec.pf + rec.esic + rec.tds + rec.otherDeduction;
    rec.netPayable = rec.grossEarned - rec.totalDeductions;
    
    // Re-render only this employee's numbers to keep input focus
    // We update the inline text cells
    // Cells: 3 (Earned Basic), 4 (Earned Allow), 5 (PF), 6 (ESIC), 9 (Net Pay)
    const tdsCell = row.querySelectorAll('td');
    tdsCell[3].textContent = `₹${rec.earnedBasic.toLocaleString()}`;
    tdsCell[4].textContent = `₹${allowancesEarnedSum.toLocaleString()}`;
    tdsCell[5].textContent = `₹${rec.pf.toLocaleString()}`;
    tdsCell[6].textContent = `₹${rec.esic.toLocaleString()}`;
    tdsCell[9].textContent = `₹${rec.netPayable.toLocaleString()}`;
    
    // Update worked days display text
    const wrkDaysLabel = tdsCell[2].querySelector('span:last-child');
    wrkDaysLabel.textContent = ` / ${rec.wrkDays}`;
    
    // Recalculate totals
    updatePayrollTotals();
  }
  
  lopInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const code = e.target.getAttribute('data-code');
      triggerRecalculation(code);
    });
  });
  
  tdsInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const code = e.target.getAttribute('data-code');
      triggerRecalculation(code);
    });
  });
  
  otherInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const code = e.target.getAttribute('data-code');
      triggerRecalculation(code);
    });
  });
}

function updatePayrollTotals() {
  const records = state.payrollData.records || [];
  let totalFixedGrossSum = 0;
  let totalBasicSum = 0;
  let totalAllowSum = 0;
  let totalPfSum = 0;
  let totalEsicSum = 0;
  let totalTdsSum = 0;
  let totalOtherSum = 0;
  let totalNetPaySum = 0;
  
  records.forEach(rec => {
    totalFixedGrossSum += rec.grossFixed;
    totalBasicSum += rec.earnedBasic;
    const allowancesEarnedVal = rec.allowances.reduce((sum, a) => sum + a.earned, 0);
    totalAllowSum += allowancesEarnedVal;
    totalPfSum += rec.pf;
    totalEsicSum += rec.esic;
    totalTdsSum += rec.tds;
    totalOtherSum += rec.otherDeduction;
    totalNetPaySum += rec.netPayable;
  });
  
  const totalRow = document.querySelector('.payroll-row-total');
  if (totalRow) {
    const tds = totalRow.querySelectorAll('td');
    tds[1].textContent = `₹${totalFixedGrossSum.toLocaleString()}`;
    tds[3].textContent = `₹${totalBasicSum.toLocaleString()}`;
    tds[4].textContent = `₹${totalAllowSum.toLocaleString()}`;
    tds[5].textContent = `₹${totalPfSum.toLocaleString()}`;
    tds[6].textContent = `₹${totalEsicSum.toLocaleString()}`;
    tds[7].textContent = `₹${totalTdsSum.toLocaleString()}`;
    tds[8].textContent = `₹${totalOtherSum.toLocaleString()}`;
    tds[9].textContent = `₹${totalNetPaySum.toLocaleString()}`;
  }
}

async function handleSavePayroll() {
  try {
    const records = state.payrollData.records.map(rec => ({
      employeeCode: rec.employeeCode,
      lopDays: rec.lopDays,
      lopDaysOverridden: rec.lopDaysOverridden,
      pf: rec.pf,
      esic: rec.esic,
      tds: rec.tds,
      otherDeduction: rec.otherDeduction
    }));
    
    await API.savePayroll(state.selectedMonth, records);
    alert('Monthly payroll run saved and locked successfully!');
    await refreshPayrollData();
    refreshDashboardView();
  } catch (err) {
    alert('Failed to save payroll calculation: ' + err.message);
  }
}

// ----------------------------------------------------
// SETTINGS LOGIC
// ----------------------------------------------------
function updateSettingsForm() {
  document.getElementById('settings-company-name').value = state.settings.companyName || '';
  document.getElementById('settings-company-address').value = state.settings.companyAddress || '';
  
  document.getElementById('settings-pf-rate').value = state.settings.pfRate || 12;
  document.getElementById('settings-pf-cap').value = state.settings.pfCap || 1800;
  document.getElementById('settings-esic-rate').value = state.settings.esicRate || 0.75;
  document.getElementById('settings-esic-threshold').value = state.settings.esicThreshold || 21000;
}
