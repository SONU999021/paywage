const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Header
} = require('docx');

// Helper to convert number to Indian currency words
function numberToWords(num) {
  if (!num || isNaN(num) || num === 0) return 'Zero Rupees Only';
  num = Math.round(num);
  
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function g(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
  }
  
  function h(n) {
    if (n === 0) return '';
    if (n < 100) return g(n);
    const remainder = n % 100;
    return a[Math.floor(n / 100)] + ' Hundred' + (remainder ? ' and ' + g(remainder) : '');
  }
  
  let str = '';
  
  const crores = Math.floor(num / 10000000);
  num %= 10000000;
  if (crores > 0) {
    str += h(crores) + ' Crore ';
  }
  
  const lakhs = Math.floor(num / 100000);
  num %= 100000;
  if (lakhs > 0) {
    str += h(lakhs) + ' Lakh ';
  }
  
  const thousands = Math.floor(num / 1000);
  num %= 1000;
  if (thousands > 0) {
    str += h(thousands) + ' Thousand ';
  }
  
  const remaining = num;
  if (remaining > 0) {
    str += h(remaining);
  }
  
  return 'Rupees ' + str.trim() + ' Only';
}

// Utility to create a styled table cell
function createCell(text, bold = false, size = 18, align = AlignmentType.LEFT, options = {}) {
  const runs = [
    new TextRun({
      text: String(text !== undefined && text !== null ? text : ''),
      bold,
      size,
      font: 'Calibri',
      color: options.color || '000000'
    })
  ];
  
  return new TableCell({
    children: [
      new Paragraph({
        children: runs,
        alignment: align,
        spacing: { before: 80, after: 80 }
      })
    ],
    width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
    shading: options.bg ? { fill: options.bg } : undefined,
    borders: options.borders || undefined,
    columnSpan: options.colspan || undefined,
    margins: {
      top: 100,
      bottom: 100,
      left: 100,
      right: 100
    }
  });
}

// Border definitions
const thinBorder = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: 'D0D0D0'
};

const doubleBorder = {
  style: BorderStyle.DOUBLE,
  size: 8,
  color: '000000'
};

const noBorder = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'FFFFFF'
};

const cellBorders = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder
};

// Main function to generate a single payslip document
function generatePaySlipDoc(employee, payrollRun, settings, monthYearString) {
  const companyName = settings.companyName || '88Academics India Private Limited';
  const companyAddress = settings.companyAddress || 'New Delhi, India';
  
  // Calculate earnings and deductions details
  const basic = employee.basicSalary || 0;
  const stdDays = payrollRun.stdDays || 31;
  const lopDays = payrollRun.lopDays || 0;
  const wrkDays = stdDays - lopDays;
  
  // Pro-rated earnings
  const earnedBasic = Math.round(basic - (basic * lopDays / stdDays));
  
  // Process allowances
  const allowancesList = employee.allowances || [];
  const earnedAllowances = allowancesList.map(allow => {
    const amt = allow.amount || 0;
    const earnedAmt = Math.round(amt - (amt * lopDays / stdDays));
    return {
      name: allow.name,
      original: amt,
      earned: earnedAmt
    };
  });
  
  // Total Gross Fixed & Earned
  const totalFixedGross = basic + allowancesList.reduce((sum, a) => sum + a.amount, 0);
  const totalEarnedGross = earnedBasic + earnedAllowances.reduce((sum, a) => sum + a.earned, 0);
  
  // Deductions
  const pf = payrollRun.pf || 0;
  const esic = payrollRun.esic || 0;
  const tds = payrollRun.tds || 0;
  const otherDeduction = payrollRun.otherDeduction || 0;
  const totalDeductions = pf + esic + tds + otherDeduction;
  
  // Net Payable
  const netPayable = totalEarnedGross - totalDeductions;
  
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Company Header
          new Paragraph({
            children: [
              new TextRun({
                text: companyName.toUpperCase(),
                bold: true,
                size: 28,
                color: '1A365D',
                font: 'Calibri'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: companyAddress,
                size: 18,
                color: '4A5568',
                font: 'Calibri'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          
          // Payslip Title
          new Paragraph({
            children: [
              new TextRun({
                text: `PAYSLIP FOR THE MONTH OF ${monthYearString.toUpperCase()}`,
                bold: true,
                size: 22,
                color: '2C5282',
                font: 'Calibri'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 }
          }),
          
          // Employee Details Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell('Employee Code:', true, 18, AlignmentType.LEFT, { width: 20, bg: 'F7FAFC' }),
                  createCell(employee.employeeCode, false, 18, AlignmentType.LEFT, { width: 30 }),
                  createCell('Employee Name:', true, 18, AlignmentType.LEFT, { width: 20, bg: 'F7FAFC' }),
                  createCell(employee.employeeName, false, 18, AlignmentType.LEFT, { width: 30 })
                ]
              }),
              new TableRow({
                children: [
                  createCell('Designation:', true, 18, AlignmentType.LEFT, { bg: 'F7FAFC' }),
                  createCell(employee.designation, false, 18, AlignmentType.LEFT),
                  createCell('Department:', true, 18, AlignmentType.LEFT, { bg: 'F7FAFC' }),
                  createCell(employee.department || 'N/A', false, 18, AlignmentType.LEFT)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Date of Joining:', true, 18, AlignmentType.LEFT, { bg: 'F7FAFC' }),
                  createCell(employee.joiningDate || 'N/A', false, 18, AlignmentType.LEFT),
                  createCell('Date of Birth:', true, 18, AlignmentType.LEFT, { bg: 'F7FAFC' }),
                  createCell(employee.dateOfBirth || 'N/A', false, 18, AlignmentType.LEFT)
                ]
              }),
              new TableRow({
                children: [
                  createCell('PAN:', true, 18, AlignmentType.LEFT, { bg: 'F7FAFC' }),
                  createCell(employee.pan || 'N/A', false, 18, AlignmentType.LEFT),
                  createCell('Aadhaar Number:', true, 18, AlignmentType.LEFT, { bg: 'F7FAFC' }),
                  createCell(employee.aadhaar || 'N/A', false, 18, AlignmentType.LEFT)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Bank Name:', true, 18, AlignmentType.LEFT, { bg: 'F7FAFC' }),
                  createCell(employee.bankName, false, 18, AlignmentType.LEFT),
                  createCell('Account Number:', true, 18, AlignmentType.LEFT, { bg: 'F7FAFC' }),
                  createCell(employee.accountNo, false, 18, AlignmentType.LEFT)
                ]
              }),
              new TableRow({
                children: [
                  createCell('IFSC Code:', true, 18, AlignmentType.LEFT, { bg: 'F7FAFC' }),
                  createCell(employee.ifscCode, false, 18, AlignmentType.LEFT),
                  createCell('Days Summary:', true, 18, AlignmentType.LEFT, { bg: 'F7FAFC' }),
                  createCell(`Std Days: ${stdDays} | Worked: ${wrkDays} | LOP: ${lopDays}`, false, 18, AlignmentType.LEFT)
                ]
              })
            ]
          }),
          
          // Spacer
          new Paragraph({ text: '', spacing: { after: 200 } }),
          
          // Earnings and Deductions Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Header Row
              new TableRow({
                children: [
                  createCell('EARNINGS', true, 20, AlignmentType.LEFT, { width: 35, bg: '1A365D', color: 'FFFFFF' }),
                  createCell('FIXED (Rs.)', true, 20, AlignmentType.RIGHT, { width: 15, bg: '1A365D', color: 'FFFFFF' }),
                  createCell('EARNED (Rs.)', true, 20, AlignmentType.RIGHT, { width: 15, bg: '1A365D', color: 'FFFFFF' }),
                  createCell('DEDUCTIONS', true, 20, AlignmentType.LEFT, { width: 20, bg: '1A365D', color: 'FFFFFF' }),
                  createCell('AMOUNT (Rs.)', true, 20, AlignmentType.RIGHT, { width: 15, bg: '1A365D', color: 'FFFFFF' })
                ]
              }),
              
              // Basic Row
              new TableRow({
                children: [
                  createCell('Basic Salary', false, 18, AlignmentType.LEFT, { borders: cellBorders }),
                  createCell(basic.toLocaleString(), false, 18, AlignmentType.RIGHT, { borders: cellBorders }),
                  createCell(earnedBasic.toLocaleString(), false, 18, AlignmentType.RIGHT, { borders: cellBorders }),
                  createCell('Provident Fund (PF)', false, 18, AlignmentType.LEFT, { borders: cellBorders }),
                  createCell(pf.toLocaleString(), false, 18, AlignmentType.RIGHT, { borders: cellBorders })
                ]
              }),
              
              // Dynamic Allowance rows merged with deductions
              ...Array.from({ length: Math.max(earnedAllowances.length, 3) }).map((_, i) => {
                const allow = earnedAllowances[i];
                let dedName = '';
                let dedVal = '';
                
                if (i === 0) {
                  dedName = 'ESIC';
                  dedVal = esic > 0 ? esic.toLocaleString() : '0';
                } else if (i === 1) {
                  dedName = 'TDS / Income Tax';
                  dedVal = tds > 0 ? tds.toLocaleString() : '0';
                } else if (i === 2) {
                  dedName = 'Other Deductions';
                  dedVal = otherDeduction > 0 ? otherDeduction.toLocaleString() : '0';
                }
                
                return new TableRow({
                  children: [
                    createCell(allow ? allow.name : '', false, 18, AlignmentType.LEFT, { borders: cellBorders }),
                    createCell(allow ? allow.original.toLocaleString() : '', false, 18, AlignmentType.RIGHT, { borders: cellBorders }),
                    createCell(allow ? allow.earned.toLocaleString() : '', false, 18, AlignmentType.RIGHT, { borders: cellBorders }),
                    createCell(dedName, false, 18, AlignmentType.LEFT, { borders: cellBorders }),
                    createCell(dedVal, false, 18, AlignmentType.RIGHT, { borders: cellBorders })
                  ]
                });
              }),
              
              // Totals Row
              new TableRow({
                children: [
                  createCell('Total Earnings', true, 18, AlignmentType.LEFT, { bg: 'F7FAFC', borders: cellBorders }),
                  createCell(totalFixedGross.toLocaleString(), true, 18, AlignmentType.RIGHT, { bg: 'F7FAFC', borders: cellBorders }),
                  createCell(totalEarnedGross.toLocaleString(), true, 18, AlignmentType.RIGHT, { bg: 'F7FAFC', borders: cellBorders }),
                  createCell('Total Deductions', true, 18, AlignmentType.LEFT, { bg: 'F7FAFC', borders: cellBorders }),
                  createCell(totalDeductions.toLocaleString(), true, 18, AlignmentType.RIGHT, { bg: 'F7FAFC', borders: cellBorders })
                ]
              })
            ]
          }),
          
          // Spacer
          new Paragraph({ text: '', spacing: { after: 160 } }),
          
          // Net Payable Section
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell('NET SALARY PAYABLE:', true, 20, AlignmentType.LEFT, { width: 35, bg: 'E2E8F0' }),
                  createCell(`Rs. ${netPayable.toLocaleString()} /-`, true, 22, AlignmentType.LEFT, { width: 65, bg: 'E2E8F0', color: '1A365D' })
                ]
              }),
              new TableRow({
                children: [
                  createCell('In Words:', true, 18, AlignmentType.LEFT),
                  createCell(numberToWords(netPayable), false, 18, AlignmentType.LEFT)
                ]
              })
            ]
          }),
          
          // Spacer
          new Paragraph({ text: '', spacing: { after: 800 } }),
          
          // Signatures Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: '___________________________', size: 18, font: 'Calibri' })],
                        alignment: AlignmentType.CENTER
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: 'Employee Signature', bold: true, size: 18, font: 'Calibri' })],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 80 }
                      })
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: '___________________________', size: 18, font: 'Calibri' })],
                        alignment: AlignmentType.CENTER
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: 'Authorized Signatory', bold: true, size: 18, font: 'Calibri' })],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 80 }
                      })
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }
                  })
                ]
              })
            ]
          })
        ]
      }
    ]
  });
  
  return doc;
}

// Generate buffer for docx
async function generatePaySlipBuffer(employee, payrollRun, settings, monthYearString) {
  const doc = generatePaySlipDoc(employee, payrollRun, settings, monthYearString);
  return await Packer.toBuffer(doc);
}

module.exports = {
  generatePaySlipDoc,
  generatePaySlipBuffer,
  numberToWords
};
