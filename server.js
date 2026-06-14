const express = require('express');
const cors = require('cors');
const path = require('path');
const xlsx = require('xlsx');
const JSZip = require('jszip');

const db = require('./db');
const { generatePaySlipBuffer } = require('./docxGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------
// SETTINGS ENDPOINTS
// ----------------------------------------------------
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const current = await db.getSettings();
    const updated = { ...current, ...req.body };
    await db.saveSettings(updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ----------------------------------------------------
// EMPLOYEE ENDPOINTS
// ----------------------------------------------------
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await db.getEmployees();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve employees' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const employees = await db.getEmployees();
    const newEmp = req.body;
    
    if (!newEmp.employeeCode || !newEmp.employeeName) {
      return res.status(400).json({ error: 'Employee Code and Name are required' });
    }
    
    const exists = employees.some(e => e.employeeCode === newEmp.employeeCode);
    if (exists) {
      return res.status(400).json({ error: 'Employee Code already exists' });
    }
    
    // Default values
    newEmp.allowances = newEmp.allowances || [];
    newEmp.basicSalary = parseFloat(newEmp.basicSalary) || 0;
    newEmp.pfEligible = newEmp.pfEligible !== undefined ? newEmp.pfEligible : true;
    newEmp.esicEligible = newEmp.esicEligible !== undefined ? newEmp.esicEligible : false;
    
    employees.push(newEmp);
    await db.saveEmployees(employees);
    res.status(201).json(newEmp);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

app.put('/api/employees/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const employees = await db.getEmployees();
    const index = employees.findIndex(e => e.employeeCode === code);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const updated = { ...employees[index], ...req.body };
    updated.basicSalary = parseFloat(updated.basicSalary) || 0;
    updated.allowances = updated.allowances || [];
    
    employees[index] = updated;
    await db.saveEmployees(employees);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

app.delete('/api/employees/:code', async (req, res) => {
  try {
    const { code } = req.params;
    let employees = await db.getEmployees();
    const exists = employees.some(e => e.employeeCode === code);
    
    if (!exists) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    employees = employees.filter(e => e.employeeCode !== code);
    await db.saveEmployees(employees);
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// Import employees from local Excel file
app.post('/api/employees/import', async (req, res) => {
  try {
    const filePath = path.join(__dirname, "May Payroll Data'2026.xlsx");
    const workbook = xlsx.readFile(filePath);
    const sheetName = 'Draft-Paysheet May 2026';
    
    if (!workbook.SheetNames.includes(sheetName)) {
      return res.status(400).json({ error: `Sheet "${sheetName}" not found in Excel file` });
    }
    
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    if (data.length < 5) {
      return res.status(400).json({ error: 'Insufficient data rows in Excel sheet' });
    }
    
    const headers = data[3];
    const employeesToImport = [];
    
    // We import from Row 4 (index 4) up to Row 57 (index 57) - the 54 employees
    for (let r = 4; r < data.length; r++) {
      const row = data[r];
      if (!row || row.length === 0) continue;
      
      const empCode = String(row[1] || '').trim();
      const empName = String(row[2] || '').trim();
      const nationality = String(row[19] || '').trim();
      
      // Skip if code/name is empty, or if this is the TOTAL row
      if (!empCode || !empName || nationality === 'TOTAL') {
        continue;
      }
      
      // Map Excel column indexes
      const joiningDate = row[3] || '';
      const gender = row[4] || '';
      const dateOfBirth = row[5] || '';
      const fatherName = row[7] || '';
      const department = row[8] || '';
      const designation = row[9] || '';
      const pan = row[13] || '';
      const aadhaar = row[14] || '';
      const bankName = row[15] || '';
      const accountNo = String(row[16] || '').trim();
      const ifscCode = String(row[17] || '').trim();
      const mobile = row[20] || '';
      const email = row[21] || '';
      
      const basic = parseFloat(row[25]) || 0;
      const hra = parseFloat(row[27]) || 0;
      const specialAllowance = parseFloat(row[29]) || 0;
      
      const pfVal = parseFloat(row[34]) || 0;
      const pfEligible = pfVal > 0;
      
      const allowances = [];
      if (hra > 0) allowances.push({ name: 'House Rent Allowance', amount: hra });
      if (specialAllowance > 0) allowances.push({ name: 'Special Allowance', amount: specialAllowance });
      
      employeesToImport.push({
        employeeCode: empCode,
        employeeName: empName,
        joiningDate,
        gender,
        dateOfBirth,
        fatherName,
        department,
        designation,
        pan,
        aadhaar,
        bankName,
        accountNo,
        ifscCode,
        mobileNumber: mobile,
        emailId: email,
        basicSalary: basic,
        allowances,
        pfEligible,
        esicEligible: false // default false, can enable in UI
      });
    }
    
    // Save to database (merge or replace)
    const existing = await db.getEmployees();
    const merged = [...existing];
    
    let importedCount = 0;
    for (const emp of employeesToImport) {
      const idx = merged.findIndex(e => e.employeeCode === emp.employeeCode);
      if (idx !== -1) {
        // Update existing employee
        merged[idx] = { ...merged[idx], ...emp };
      } else {
        // Add new employee
        merged.push(emp);
        importedCount++;
      }
    }
    
    await db.saveEmployees(merged);
    res.json({
      message: `Excel import completed successfully.`,
      totalImported: employeesToImport.length,
      newEmployeesAdded: importedCount,
      totalEmployees: merged.length
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: `Import failed: ${err.message}` });
  }
});

// ----------------------------------------------------
// LEAVES ENDPOINTS
// ----------------------------------------------------
app.get('/api/leaves', async (req, res) => {
  try {
    const leaves = await db.getLeaves();
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve leaves' });
  }
});

app.post('/api/leaves', async (req, res) => {
  try {
    const leaves = await db.getLeaves();
    const newLeave = req.body;
    
    if (!newLeave.employeeCode || !newLeave.startDate || !newLeave.endDate || !newLeave.days) {
      return res.status(400).json({ error: 'Employee Code, dates and number of days are required' });
    }
    
    newLeave.id = Date.now().toString();
    newLeave.status = newLeave.status || 'Pending';
    newLeave.leaveType = newLeave.leaveType || 'LOP'; // LOP is default unpaid leave
    
    leaves.push(newLeave);
    await db.saveLeaves(leaves);
    res.status(201).json(newLeave);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create leave application' });
  }
});

app.put('/api/leaves/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const leaves = await db.getLeaves();
    const index = leaves.findIndex(l => l.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    leaves[index] = { ...leaves[index], ...req.body };
    await db.saveLeaves(leaves);
    res.json(leaves[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update leave request' });
  }
});

app.delete('/api/leaves/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let leaves = await db.getLeaves();
    const exists = leaves.some(l => l.id === id);
    
    if (!exists) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    leaves = leaves.filter(l => l.id !== id);
    await db.saveLeaves(leaves);
    res.json({ message: 'Leave request deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete leave request' });
  }
});

// ----------------------------------------------------
// PAYROLL RUN ENDPOINTS
// ----------------------------------------------------
app.get('/api/payroll/:month', async (req, res) => {
  try {
    const { month } = req.params; // format: YYYY-MM
    const employees = await db.getEmployees();
    const leaves = await db.getLeaves();
    const allPayroll = await db.getPayroll();
    const settings = await db.getSettings();
    
    const [year, monthNum] = month.split('-').map(Number);
    const stdDays = new Date(year, monthNum, 0).getDate();
    
    // Check if payroll is already locked/saved for this month
    const savedRun = allPayroll[month];
    
    // Calculate values dynamically for each employee
    const calculations = employees.map(emp => {
      // Find saved override if it exists
      const savedEmpPayroll = savedRun ? savedRun.records.find(r => r.employeeCode === emp.employeeCode) : null;
      
      // Calculate LOP days from approved unpaid leaves
      // Unpaid leaves count if they overlap with the month and are approved
      let calculatedLopDays = 0;
      if (savedEmpPayroll && savedEmpPayroll.lopDaysOverridden) {
        calculatedLopDays = savedEmpPayroll.lopDays;
      } else {
        const approvedLopLeaves = leaves.filter(l => 
          l.employeeCode === emp.employeeCode && 
          l.status === 'Approved' && 
          (l.leaveType === 'LOP' || l.leaveType === 'Unpaid')
        );
        
        // Count days in current month
        // For simplicity, we sum up l.days if the leave starts in this month,
        // or write a more precise check if needed. Summing l.days is standard unless dates cross months.
        approvedLopLeaves.forEach(l => {
          const start = new Date(l.startDate);
          const end = new Date(l.endDate);
          // Check if start is within this month
          if (start.getFullYear() === year && (start.getMonth() + 1) === monthNum) {
            calculatedLopDays += parseFloat(l.days) || 0;
          }
        });
      }
      
      const basic = emp.basicSalary || 0;
      const lopDays = calculatedLopDays;
      const wrkDays = Math.max(0, stdDays - lopDays);
      
      // Basic Earned
      const earnedBasic = Math.round(basic - (basic * lopDays / stdDays));
      
      // Allowances Earned
      let earnedAllowancesSum = 0;
      const allowancesDetail = (emp.allowances || []).map(allow => {
        const amt = allow.amount || 0;
        const earnedAmt = Math.round(amt - (amt * lopDays / stdDays));
        earnedAllowancesSum += earnedAmt;
        return {
          name: allow.name,
          original: amt,
          earned: earnedAmt
        };
      });
      
      const grossFixed = basic + (emp.allowances || []).reduce((sum, a) => sum + a.amount, 0);
      const grossEarned = earnedBasic + earnedAllowancesSum;
      
      // Deductions
      // PF: 12% of Basic, capped at pfCap (1800)
      let pf = 0;
      if (emp.pfEligible) {
        const pfCalculated = Math.round(earnedBasic * (settings.pfRate / 100));
        pf = Math.min(pfCalculated, settings.pfCap);
      }
      
      // ESIC: 0.75% of Gross if Gross <= threshold (21000)
      let esic = 0;
      if (emp.esicEligible && grossEarned <= settings.esicThreshold) {
        esic = Math.round(grossEarned * (settings.esicRate / 100));
      }
      
      // TDS & Other Deductions: default 0 or saved overrides
      const tds = savedEmpPayroll ? (savedEmpPayroll.tds || 0) : 0;
      const otherDeduction = savedEmpPayroll ? (savedEmpPayroll.otherDeduction || 0) : 0;
      
      const totalDeductions = pf + esic + tds + otherDeduction;
      const netPayable = grossEarned - totalDeductions;
      
      return {
        employeeCode: emp.employeeCode,
        employeeName: emp.employeeName,
        designation: emp.designation,
        bankName: emp.bankName,
        accountNo: emp.accountNo,
        ifscCode: emp.ifscCode,
        stdDays,
        lopDays,
        wrkDays,
        basicSalary: basic,
        earnedBasic,
        allowances: allowancesDetail,
        grossFixed,
        grossEarned,
        pf,
        esic,
        tds,
        otherDeduction,
        totalDeductions,
        netPayable,
        lopDaysOverridden: savedEmpPayroll ? !!savedEmpPayroll.lopDaysOverridden : false
      };
    });
    
    res.json({
      month,
      stdDays,
      locked: !!savedRun,
      records: calculations
    });
  } catch (err) {
    console.error('Payroll calculation error:', err);
    res.status(500).json({ error: 'Failed to calculate payroll' });
  }
});

app.post('/api/payroll/:month/save', async (req, res) => {
  try {
    const { month } = req.params;
    const { records } = req.body;
    
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Records array is required' });
    }
    
    const allPayroll = await db.getPayroll();
    allPayroll[month] = {
      savedAt: new Date().toISOString(),
      records: records.map(r => ({
        employeeCode: r.employeeCode,
        lopDays: parseFloat(r.lopDays) || 0,
        lopDaysOverridden: !!r.lopDaysOverridden,
        pf: parseFloat(r.pf) || 0,
        esic: parseFloat(r.esic) || 0,
        tds: parseFloat(r.tds) || 0,
        otherDeduction: parseFloat(r.otherDeduction) || 0
      }))
    };
    
    await db.savePayroll(allPayroll);
    res.json({ message: 'Payroll saved successfully', locked: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save payroll' });
  }
});

// ----------------------------------------------------
// DOCUMENT DOWNLOAD ENDPOINTS
// ----------------------------------------------------

// Convert Month Number to Name (e.g. 5 -> May 2026)
function getMonthYearString(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

// Single slip download
app.get('/api/payroll/:month/download/:code', async (req, res) => {
  try {
    const { month, code } = req.params;
    const employees = await db.getEmployees();
    const employee = employees.find(e => e.employeeCode === code);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const settings = await db.getSettings();
    const allPayroll = await db.getPayroll();
    
    // Calculate payroll parameters for this month
    const [year, monthNum] = month.split('-').map(Number);
    const stdDays = new Date(year, monthNum, 0).getDate();
    
    // Find saved run or calculate defaults
    const savedRun = allPayroll[month];
    const savedEmp = savedRun ? savedRun.records.find(r => r.employeeCode === code) : null;
    
    let lopDays = 0;
    let pf = 0;
    let esic = 0;
    let tds = 0;
    let otherDeduction = 0;
    
    if (savedEmp) {
      lopDays = savedEmp.lopDays;
      pf = savedEmp.pf;
      esic = savedEmp.esic;
      tds = savedEmp.tds;
      otherDeduction = savedEmp.otherDeduction;
    } else {
      // Dynamic calculation
      const leaves = await db.getLeaves();
      const approvedLopLeaves = leaves.filter(l => 
        l.employeeCode === code && 
        l.status === 'Approved' && 
        (l.leaveType === 'LOP' || l.leaveType === 'Unpaid')
      );
      approvedLopLeaves.forEach(l => {
        const start = new Date(l.startDate);
        if (start.getFullYear() === year && (start.getMonth() + 1) === monthNum) {
          lopDays += parseFloat(l.days) || 0;
        }
      });
      
      const basic = employee.basicSalary || 0;
      const earnedBasic = Math.round(basic - (basic * lopDays / stdDays));
      const allowancesSum = (employee.allowances || []).reduce((sum, a) => sum + a.amount, 0);
      const grossEarned = earnedBasic + Math.round(allowancesSum - (allowancesSum * lopDays / stdDays));
      
      if (employee.pfEligible) {
        pf = Math.min(Math.round(earnedBasic * (settings.pfRate / 100)), settings.pfCap);
      }
      if (employee.esicEligible && grossEarned <= settings.esicThreshold) {
        esic = Math.round(grossEarned * (settings.esicRate / 100));
      }
    }
    
    const payrollRun = { stdDays, lopDays, pf, esic, tds, otherDeduction };
    const monthYearString = getMonthYearString(month);
    
    const buffer = await generatePaySlipBuffer(employee, payrollRun, settings, monthYearString);
    
    const fileName = `Payslip_${code}_${employee.employeeName.replace(/\s+/g, '_')}_${month}.docx`;
    
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (err) {
    console.error('Download single error:', err);
    res.status(500).json({ error: `Failed to generate salary slip: ${err.message}` });
  }
});

// Bulk slips download
app.get('/api/payroll/:month/download-bulk', async (req, res) => {
  try {
    const { month } = req.params;
    const employees = await db.getEmployees();
    
    if (employees.length === 0) {
      return res.status(400).json({ error: 'No employees in database' });
    }
    
    const settings = await db.getSettings();
    const allPayroll = await db.getPayroll();
    const leaves = await db.getLeaves();
    
    const [year, monthNum] = month.split('-').map(Number);
    const stdDays = new Date(year, monthNum, 0).getDate();
    const savedRun = allPayroll[month];
    
    const zip = new JSZip();
    const monthYearString = getMonthYearString(month);
    
    for (const employee of employees) {
      const code = employee.employeeCode;
      const savedEmp = savedRun ? savedRun.records.find(r => r.employeeCode === code) : null;
      
      let lopDays = 0;
      let pf = 0;
      let esic = 0;
      let tds = 0;
      let otherDeduction = 0;
      
      if (savedEmp) {
        lopDays = savedEmp.lopDays;
        pf = savedEmp.pf;
        esic = savedEmp.esic;
        tds = savedEmp.tds;
        otherDeduction = savedEmp.otherDeduction;
      } else {
        // Dynamic calculation
        const approvedLopLeaves = leaves.filter(l => 
          l.employeeCode === code && 
          l.status === 'Approved' && 
          (l.leaveType === 'LOP' || l.leaveType === 'Unpaid')
        );
        approvedLopLeaves.forEach(l => {
          const start = new Date(l.startDate);
          if (start.getFullYear() === year && (start.getMonth() + 1) === monthNum) {
            lopDays += parseFloat(l.days) || 0;
          }
        });
        
        const basic = employee.basicSalary || 0;
        const earnedBasic = Math.round(basic - (basic * lopDays / stdDays));
        const allowancesSum = (employee.allowances || []).reduce((sum, a) => sum + a.amount, 0);
        const grossEarned = earnedBasic + Math.round(allowancesSum - (allowancesSum * lopDays / stdDays));
        
        if (employee.pfEligible) {
          pf = Math.min(Math.round(earnedBasic * (settings.pfRate / 100)), settings.pfCap);
        }
        if (employee.esicEligible && grossEarned <= settings.esicThreshold) {
          esic = Math.round(grossEarned * (settings.esicRate / 100));
        }
      }
      
      const payrollRun = { stdDays, lopDays, pf, esic, tds, otherDeduction };
      const buffer = await generatePaySlipBuffer(employee, payrollRun, settings, monthYearString);
      
      const fileName = `Payslip_${code}_${employee.employeeName.replace(/\s+/g, '_')}.docx`;
      zip.file(fileName, buffer);
    }
    
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    res.setHeader('Content-Disposition', `attachment; filename=Bulk_Payslips_${month}.zip`);
    res.setHeader('Content-Type', 'application/zip');
    res.send(zipBuffer);
  } catch (err) {
    console.error('Download bulk error:', err);
    res.status(500).json({ error: `Failed to generate bulk slips: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
