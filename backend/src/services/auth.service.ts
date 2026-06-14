import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { validatePAN, validateGST, validateEmail, validatePassword } from '../utils/validators.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

export const registerSchema = z.object({
  companyName: z.string().min(2),
  address: z.string().min(5),
  pan: z.string().transform((v) => v.toUpperCase()),
  gst: z.string().optional().transform((v) => v?.toUpperCase()),
  phone: z.string().min(10),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export async function registerCompany(data: z.infer<typeof registerSchema>) {
  if (!validatePAN(data.pan)) throw new AppError(400, 'Invalid PAN number');
  if (data.gst && !validateGST(data.gst)) throw new AppError(400, 'Invalid GST number');
  if (!validateEmail(data.email)) throw new AppError(400, 'Invalid email');
  const pwCheck = validatePassword(data.password);
  if (!pwCheck.valid) throw new AppError(400, pwCheck.errors.join(', '));

  const existing = await prisma.company.findFirst({
    where: { OR: [{ email: data.email }, { pan: data.pan }] },
  });
  if (existing) throw new AppError(409, 'Company already registered with this email or PAN');

  const passwordHash = await bcrypt.hash(data.password, 12);

  const company = await prisma.company.create({
    data: {
      name: data.companyName,
      address: data.address,
      pan: data.pan,
      gst: data.gst,
      phone: data.phone,
      email: data.email,
      users: {
        create: {
          email: data.email,
          passwordHash,
          firstName: 'Admin',
          lastName: data.companyName,
          role: 'COMPANY_ADMIN',
        },
      },
      leaveTypes: {
        createMany: {
          data: [
            { name: 'Casual Leave', annualAllocation: 12, isPaid: true },
            { name: 'Sick Leave', annualAllocation: 10, isPaid: true },
            { name: 'Earned Leave', annualAllocation: 15, isPaid: true, carryForward: true },
            { name: 'Leave Without Pay', annualAllocation: 0, isPaid: false },
          ],
        },
      },
    },
    include: { users: true },
  });

  return { companyId: company.id, message: 'Registration successful. Please login.' };
}

export async function loginUser(data: z.infer<typeof loginSchema>) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { company: true },
  });

  if (!user || !user.isActive) throw new AppError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company?.name,
    },
  };
}

export async function refreshAccessToken(token: string) {
  const { verifyRefreshToken } = await import('../utils/jwt.js');
  const payload = verifyRefreshToken(token);

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.refreshToken !== token) throw new AppError(401, 'Invalid refresh token');

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  });

  return { accessToken };
}
