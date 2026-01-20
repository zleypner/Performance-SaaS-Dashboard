import { PrismaClient, CustomerStatus, TransactionType, TransactionStatus } from "@prisma/client";
import { hash } from "bcryptjs";
import { subDays, format } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corporation",
      slug: "acme-corp",
      plan: "PRO",
    },
  });
  console.log(`✅ Created organization: ${org.name}`);

  // Create demo user with hashed password
  const passwordHash = await hash("demo123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      passwordHash,
      role: "OWNER",
      organizationId: org.id,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Created user: ${user.email}`);

  // Generate customers
  const customerNames = [
    "TechStart Inc", "Global Solutions", "Digital Dynamics", "Cloud Nine Labs",
    "Quantum Computing Co", "Neural Networks LLC", "Data Driven Systems", "AI Innovations",
    "Smart Analytics", "Future Tech", "Cyber Security Pro", "Web Wizards",
    "Mobile Masters", "Code Crafters", "Dev Ops Elite", "Agile Accelerators",
    "Innovation Hub", "Tech Titans", "Digital Dreams", "Cloud Pioneers",
  ];

  const customers = await Promise.all(
    customerNames.map((name, index) => {
      const status: CustomerStatus = index < 15 ? "ACTIVE" : (index < 18 ? "CHURNED" : "TRIAL");
      const monthlyRevenue = Math.floor(Math.random() * 500 + 50) * 10; // $500 - $5500
      const createdAt = subDays(new Date(), Math.floor(Math.random() * 180) + 30);

      return prisma.customer.upsert({
        where: {
          organizationId_email: {
            organizationId: org.id,
            email: `contact@${name.toLowerCase().replace(/\s+/g, "")}.com`,
          }
        },
        update: {},
        create: {
          name,
          email: `contact@${name.toLowerCase().replace(/\s+/g, "")}.com`,
          status,
          monthlyRevenue,
          organizationId: org.id,
          createdAt,
          churnedAt: status === "CHURNED" ? subDays(new Date(), Math.floor(Math.random() * 30)) : null,
        },
      });
    })
  );
  console.log(`✅ Created ${customers.length} customers`);

  // Generate transactions for the last 90 days
  const transactions = [];
  for (let i = 0; i < 90; i++) {
    const date = subDays(new Date(), i);
    const numTransactions = Math.floor(Math.random() * 8) + 3; // 3-10 transactions per day

    for (let j = 0; j < numTransactions; j++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const amount = Math.floor(Math.random() * 300 + 50) * 10; // $500 - $3500
      const types: TransactionType[] = ["PAYMENT", "SUBSCRIPTION", "ONE_TIME"];
      const statuses: TransactionStatus[] = ["COMPLETED", "COMPLETED", "COMPLETED", "PENDING", "FAILED"];

      transactions.push({
        amount,
        currency: "USD",
        type: types[Math.floor(Math.random() * types.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        description: `Payment from ${customer.name}`,
        organizationId: org.id,
        customerId: customer.id,
        createdAt: date,
      });
    }
  }

  await prisma.transaction.createMany({
    data: transactions,
  });
  console.log(`✅ Created ${transactions.length} transactions`);

  // Generate daily metrics for the last 90 days
  for (let i = 0; i < 90; i++) {
    const date = subDays(new Date(), i);
    const dateStr = format(date, "yyyy-MM-dd");

    // Calculate metrics based on transactions for that day
    const dayTransactions = transactions.filter(
      (t) => format(t.createdAt, "yyyy-MM-dd") === dateStr && t.status === "COMPLETED"
    );
    const revenue = dayTransactions.reduce((sum, t) => sum + t.amount, 0);

    await prisma.dailyMetric.upsert({
      where: {
        organizationId_date: {
          organizationId: org.id,
          date: new Date(dateStr),
        },
      },
      update: {},
      create: {
        date: new Date(dateStr),
        revenue,
        transactionCount: dayTransactions.length,
        activeUsers: Math.floor(Math.random() * 200) + 800, // 800-1000 DAU
        newUsers: Math.floor(Math.random() * 30) + 10, // 10-40 new users
        totalCustomers: customers.length - Math.floor(i / 10),
        newCustomers: Math.floor(Math.random() * 3),
        churnedCustomers: Math.random() > 0.7 ? 1 : 0,
        conversionRate: Math.random() * 5 + 2, // 2-7% conversion
        organizationId: org.id,
      },
    });
  }
  console.log(`✅ Created 90 days of metrics`);

  console.log("\n🎉 Seeding complete!");
  console.log("\n📧 Demo credentials:");
  console.log("   Email: demo@example.com");
  console.log("   Password: demo123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
