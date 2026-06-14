const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure database directory exists
async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

// Atomically write file to avoid corruption
async function writeAtomic(filePath, data) {
  await ensureDir();
  const tempPath = filePath + '.tmp';
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(tempPath, content, 'utf8');
  await fs.rename(tempPath, filePath);
}

// Read file, return default if not exists
async function readJson(filePath, defaultValue) {
  await ensureDir();
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeAtomic(filePath, defaultValue);
      return defaultValue;
    }
    throw err;
  }
}

const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');
const LEAVES_FILE = path.join(DATA_DIR, 'leaves.json');
const PAYROLL_FILE = path.join(DATA_DIR, 'payroll.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

module.exports = {
  getEmployees: () => readJson(EMPLOYEES_FILE, []),
  saveEmployees: (data) => writeAtomic(EMPLOYEES_FILE, data),
  
  getLeaves: () => readJson(LEAVES_FILE, []),
  saveLeaves: (data) => writeAtomic(LEAVES_FILE, data),
  
  getPayroll: () => readJson(PAYROLL_FILE, {}),
  savePayroll: (data) => writeAtomic(PAYROLL_FILE, data),
  
  getSettings: () => readJson(SETTINGS_FILE, {
    pfRate: 12,
    pfCap: 1800,
    esicRate: 0.75,
    esicThreshold: 21000,
    companyName: '88Academics India Private Limited',
    companyAddress: 'New Delhi, India'
  }),
  saveSettings: (data) => writeAtomic(SETTINGS_FILE, data)
};
