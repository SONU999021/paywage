import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  Users, Clock, Wallet, FileText, Shield, BarChart3, CheckCircle, Star,
} from 'lucide-react';

const features = [
  { icon: Users, title: 'Employee Management', desc: 'Complete employee profiles with salary structure and compliance settings.' },
  { icon: Clock, title: 'Attendance Tracking', desc: 'Manual, biometric, Excel import, and API-based attendance management.' },
  { icon: Wallet, title: 'Payroll Engine', desc: 'Configurable payroll with rule builder, PF, ESI, and statutory deductions.' },
  { icon: FileText, title: 'Salary Slips', desc: 'Professional PDF salary slips with QR verification and multi-channel delivery.' },
  { icon: Shield, title: 'Compliance Ready', desc: 'PF, ESI, Professional Tax, and Labour Welfare Fund management.' },
  { icon: BarChart3, title: 'Advanced Reports', desc: 'Payroll register, attendance, leave, and department cost reports.' },
];

const pricing = [
  { name: 'Starter', price: '₹999', period: '/month', employees: 'Up to 25 employees', features: ['Payroll Processing', 'Attendance', 'Salary Slips', 'Email Support'] },
  { name: 'Professional', price: '₹2,499', period: '/month', employees: 'Up to 100 employees', popular: true, features: ['Everything in Starter', 'PF & ESI', 'Leave Management', 'Excel Import', 'Priority Support'] },
  { name: 'Enterprise', price: 'Custom', period: '', employees: 'Unlimited employees', features: ['Everything in Professional', 'Multi-company', 'API Access', 'Custom Rules', 'Dedicated Manager'] },
];

const faqs = [
  { q: 'Is PayWager suitable for Indian statutory compliance?', a: 'Yes. PayWager supports PF, ESI, Professional Tax, and LWF calculations as per Indian regulations.' },
  { q: 'Can I import existing employee data?', a: 'Yes. Use our Excel import wizard with sample formats, column mapping, and error reporting.' },
  { q: 'Does PayWager support multiple companies?', a: 'Yes. Enterprise plans support multi-company management with role-based access control.' },
  { q: 'How secure is my payroll data?', a: 'We use JWT authentication, encrypted passwords, audit trails, rate limiting, and role-based permissions.' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white">PW</div>
            <span className="text-xl font-bold text-text">PayWager</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted hover:text-text">Features</a>
            <a href="#pricing" className="text-sm text-muted hover:text-text">Pricing</a>
            <a href="#contact" className="text-sm text-muted hover:text-text">Contact</a>
            <Link to="/login" className="text-sm font-medium text-primary">Login</Link>
            <Link to="/register"><Button size="sm">Register</Button></Link>
          </div>
        </div>
      </nav>

      <section className="bg-gradient-to-b from-primary/5 to-background px-6 py-20">
        <div className="mx-auto max-w-7xl text-center">
          <LandingBadge>Enterprise Payroll SaaS</LandingBadge>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-text md:text-6xl">
            Smart Payroll.<br />
            <span className="text-primary">Simplified Workforce Management.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            Manage employees, attendance, leave, payroll, PF, ESI, and reports — all in one modern platform built for Indian businesses.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/register"><Button size="lg">Start Free Trial</Button></Link>
            <a href="#contact"><Button size="lg" variant="outline">Book Demo</Button></a>
          </div>
          <div className="mx-auto mt-16 max-w-4xl rounded-xl border border-border bg-card p-4 shadow-lg">
            <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-4 p-8">
                {['Dashboard', 'Payroll', 'Reports'].map((t) => (
                  <div key={t} className="rounded-lg border border-border bg-background p-4 text-sm font-medium text-text">{t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold text-text">Everything you need for payroll</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted">From startups to enterprises, PayWager scales with your workforce.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-text">{f.title}</h3>
                <p className="mt-2 text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold text-text">Why choose PayWager?</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {['Reduce payroll processing time by 80%', 'Automated statutory compliance', 'Role-based access for HR, Payroll & Employees', 'Audit trails for every action', 'Excel import with error reporting', 'Professional PDF salary slips'].map((b) => (
              <div key={b} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-success" />
                <span className="text-text">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold text-text">Simple, transparent pricing</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {pricing.map((plan) => (
              <div key={plan.name} className={`rounded-xl border p-8 ${plan.popular ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                {plan.popular && <LandingBadge className="bg-success/10 text-success">Most Popular</LandingBadge>}
                <h3 className="mt-4 text-xl font-bold text-text">{plan.name}</h3>
                <p className="mt-2 text-sm text-muted">{plan.employees}</p>
                <p className="mt-4">
                  <span className="text-4xl font-bold text-text">{plan.price}</span>
                  <span className="text-muted">{plan.period}</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted">
                      <CheckCircle className="h-4 w-4 text-success" />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="mt-8 block">
                  <Button variant={plan.popular ? 'primary' : 'outline'} className="w-full">Get Started</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold text-text">Trusted by businesses</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: 'Rajesh Kumar', role: 'HR Head, TechStart', text: 'PayWager reduced our monthly payroll time from 3 days to 4 hours.' },
              { name: 'Priya Sharma', role: 'Finance Director', text: 'PF and ESI compliance is now fully automated. Highly recommended.' },
              { name: 'Amit Patel', role: 'CEO, GrowthCorp', text: 'The rule engine and Excel import saved us weeks of manual work.' },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-background p-6">
                <div className="flex gap-1 text-warning">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-4 text-sm text-muted">&ldquo;{t.text}&rdquo;</p>
                <p className="mt-4 font-medium text-text">{t.name}</p>
                <p className="text-xs text-muted">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-text">Frequently asked questions</h2>
          <div className="mt-12 space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="rounded-xl border border-border bg-card p-6">
                <summary className="cursor-pointer font-medium text-text">{faq.q}</summary>
                <p className="mt-3 text-sm text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-primary px-6 py-20 text-white">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">Ready to simplify your payroll?</h2>
          <p className="mt-4 opacity-90">Contact us at sales@paywager.app or call +91 98765 43210</p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/register"><Button size="lg" className="bg-white text-primary hover:bg-white/90">Start Free Trial</Button></Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Book Demo</Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted">© 2026 PayWager. All rights reserved.</p>
          <p className="text-sm text-muted">Smart Payroll. Simplified Workforce Management.</p>
        </div>
      </footer>
    </div>
  );
}

function LandingBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ${className}`}>
      {children}
    </span>
  );
}
