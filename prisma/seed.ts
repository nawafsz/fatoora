import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const seedPassword = process.env.SEED_PASSWORD ?? crypto.randomBytes(8).toString("hex");
  const passwordHash = await bcrypt.hash(seedPassword, 12);
  const adminHash = await bcrypt.hash(
    process.env.ADMIN_PASSWORD ?? "Aa102030",
    12
  );

  const demo = await prisma.user.upsert({
    where: { email: "demo@fatoora.sa" },
    update: {},
    create: {
      name: "مؤسسة فاتورة التجارية",
      email: "demo@fatoora.sa",
      phone: "0500000000",
      passwordHash,
      companyName: "مؤسسة فاتورة",
      taxNumber: "310122223500003",
      commercialReg: "1012345678",
      city: "الرياض",
      plan: "free",
      invoicesLimit: 5,
    },
  });

  console.log(`✅ Demo user created: ${demo.email}`);

  const admin = await prisma.user.upsert({
    where: { email: "nawaf@test.com" },
    update: {},
    create: {
      name: "مدير النظام",
      email: "nawaf@test.com",
      phone: "0500000001",
      passwordHash: adminHash,
      role: "admin",
      plan: "premium",
      invoicesLimit: 999999,
      active: true,
    },
  });

  console.log(`✅ Admin user created: ${admin.email}`);

  await prisma.settings.upsert({
    where: { userId: demo.id },
    update: {},
    create: {
      userId: demo.id,
      invoicePrefix: "INV-",
      defaultTaxRate: 15,
      nextNumber: 1,
      language: "ar",
      currency: "SAR",
    },
  });

  await prisma.settings.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      invoicePrefix: "INV-",
      defaultTaxRate: 15,
      nextNumber: 1,
      language: "ar",
      currency: "SAR",
    },
  });

  console.log("✅ Settings created");

  await prisma.zatcaConfig.upsert({
    where: { userId: demo.id },
    update: {},
    create: {
      userId: demo.id,
      environment: "sandbox",
      complianceStatus: "pending",
    },
  });

  await prisma.zatcaConfig.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      environment: "sandbox",
      complianceStatus: "pending",
    },
  });

  console.log("✅ ZATCA config created");

  // Create sample clients
  const client1 = await prisma.client.upsert({
    where: { id: "demo-client-1" },
    update: {},
    create: {
      id: "demo-client-1",
      name: "شركة الأفق للتجارة",
      phone: "0555000011",
      email: "info@horizon.sa",
      taxNumber: "310122223500001",
      address: "الرياض، حي العليا",
      userId: demo.id,
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: "demo-client-2" },
    update: {},
    create: {
      id: "demo-client-2",
      name: "مؤسسة النور للتقنية",
      phone: "0555000022",
      email: "info@alnoor-tech.sa",
      taxNumber: "310122223500002",
      address: "جدة، حي الشرفية",
      userId: demo.id,
    },
  });

  console.log(`✅ ${2} clients created`);

  // Create sample invoices
  const items1 = [
    { name: "خدمة استشارية", quantity: 1, unitPrice: 5000 },
    { name: "تصميم واجهات", quantity: 2, unitPrice: 3000 },
  ];
  const subtotal1 = 11000;
  const taxAmount1 = 1650;
  const total1 = 12650;

  await prisma.invoice.upsert({
    where: { id: "demo-invoice-1" },
    update: {},
    create: {
      id: "demo-invoice-1",
      invoiceNumber: "INV-00001",
      type: "CASH",
      status: "SUBMITTED",
      date: new Date(),
      items: items1,
      subtotal: subtotal1,
      discount: 0,
      taxAmount: taxAmount1,
      total: total1,
      userId: demo.id,
      clientId: client1.id,
    },
  });

  const items2 = [
    { name: "حقيبة تدريبية", quantity: 10, unitPrice: 450 },
  ];
  const subtotal2 = 4500;
  const taxAmount2 = 675;
  const total2 = 5175;

  await prisma.invoice.upsert({
    where: { id: "demo-invoice-2" },
    update: {},
    create: {
      id: "demo-invoice-2",
      invoiceNumber: "INV-00002",
      type: "CREDIT",
      status: "DRAFT",
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: items2,
      subtotal: subtotal2,
      discount: 0,
      taxAmount: taxAmount2,
      total: total2,
      userId: demo.id,
      clientId: client2.id,
    },
  });

  console.log(`✅ ${2} invoices created`);
  console.log("🌱 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
