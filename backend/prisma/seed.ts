import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  const company = await prisma.company.upsert({
    where: { email: 'admin@paywager.demo' },
    update: {},
    create: {
      name: 'PayWager Demo Corp',
      address: '123 Business Park, Mumbai, Maharashtra 400001',
      pan: 'AABCP1234D',
      gst: '27AABCP1234D1Z5',
      phone: '9876543210',
      email: 'admin@paywager.demo',
      users: {
        create: {
          email: 'admin@paywager.demo',
          passwordHash,
          firstName: 'Demo',
          lastName: 'Admin',
          role: 'COMPANY_ADMIN',
        },
      },
      departments: {
        createMany: {
          data: [
            { name: 'Management' },
            { name: 'IT' },
            { name: 'HR' },
            { name: 'Finance' },
          ],
        },
      },
      leaveTypes: {
        createMany: {
          data: [
            { name: 'Casual Leave', annualAllocation: 12, isPaid: true },
            { name: 'Sick Leave', annualAllocation: 10, isPaid: true },
            { name: 'Earned Leave', annualAllocation: 15, isPaid: true, carryForward: true },
            { name: 'Maternity Leave', annualAllocation: 180, isPaid: true },
            { name: 'Leave Without Pay', annualAllocation: 0, isPaid: false },
          ],
        },
      },
      payrollRules: {
        createMany: {
          data: [
            {
              name: 'Late Entry > 3 times',
              description: 'Deduct half day salary if late more than 3 times',
              condition: { field: 'lateMinutes', operator: '>', value: 180 },
              action: { type: 'DEDUCT_HALF_DAY' },
              priority: 1,
            },
            {
              name: 'Unpaid Leave Deduction',
              description: 'Deduct per day salary for unpaid leave',
              condition: { field: 'unpaidLeaveDays', operator: '>', value: 0 },
              action: { type: 'DEDUCT_UNPAID_LEAVE' },
              priority: 2,
            },
            {
              name: 'Overtime > 8 Hours',
              description: 'Add overtime pay for hours beyond 8',
              condition: { field: 'overtimeHours', operator: '>', value: 0 },
              action: { type: 'ADD_OVERTIME' },
              priority: 3,
            },
          ],
        },
      },
    },
    include: { departments: true },
  });

  const itDept = company.departments.find((d) => d.name === 'IT');

  await prisma.employee.create({
    data: {
      companyId: company.id,
      employeeCode: 'DEMO0001',
      firstName: 'John',
      lastName: 'Doe',
      designation: 'Software Engineer',
      departmentId: itDept?.id,
      dateOfJoining: new Date('2024-01-15'),
      basicSalary: 40000,
      hra: 16000,
      specialAllowance: 10000,
      grossSalary: 66000,
      ctc: 792000,
      pfEnabled: true,
      esiEnabled: false,
      status: 'ACTIVE',
    },
  });

  console.log('Seed completed. Login: admin@paywager.demo / Admin@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
