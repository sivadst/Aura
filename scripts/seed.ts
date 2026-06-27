import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding QuickAnalysis table for demo mode...");

  // Get or create a default organization
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Demo Organization",
      },
    });
  }

  const sampleData = [
    {
      category: "LEAD",
      priority: "HIGH",
      intent: "buy",
      sentiment: "positive",
      leadScore: 85,
      summary: "Interested in purchasing enterprise plan.",
      draft: "Thank you for your interest! We would be happy to discuss the enterprise plan with you.",
      status: "analyzed",
    },
    {
      category: "CUSTOMER",
      priority: "MEDIUM",
      intent: "support",
      sentiment: "neutral",
      leadScore: 40,
      summary: "Needs help with integration.",
      draft: "I understand you need help with integration. Here are some resources.",
      status: "used",
    },
    {
      category: "SPAM",
      priority: "LOW",
      intent: "other",
      sentiment: "negative",
      leadScore: 5,
      summary: "Unrelated marketing email.",
      draft: "",
      status: "analyzed",
    },
    {
      category: "LEAD",
      priority: "HIGH",
      intent: "demo",
      sentiment: "positive",
      leadScore: 92,
      summary: "Wants a demo next week.",
      draft: "I can set up a demo for you next Tuesday or Thursday at 10am.",
      status: "sent",
    },
    {
      category: "PARTNER",
      priority: "MEDIUM",
      intent: "other",
      sentiment: "positive",
      leadScore: 60,
      summary: "Proposal for partnership.",
      draft: "Thanks for reaching out! We're always open to partnerships.",
      status: "edited",
    },
    {
      category: "LEAD",
      priority: "MEDIUM",
      intent: "demo",
      sentiment: "neutral",
      leadScore: 65,
      summary: "Curious about features.",
      draft: "Our features include X, Y, and Z. Would you like a demo?",
      status: "used",
    },
    {
      category: "CUSTOMER",
      priority: "HIGH",
      intent: "support",
      sentiment: "negative",
      leadScore: 20,
      summary: "Experiencing critical bug.",
      draft: "We apologize for the inconvenience. Our team is looking into this immediately.",
      status: "sent",
    },
    {
      category: "LEAD",
      priority: "LOW",
      intent: "buy",
      sentiment: "neutral",
      leadScore: 55,
      summary: "Asking for pricing details.",
      draft: "Our pricing starts at $99/mo. Let me know if you have any questions.",
      status: "analyzed",
    },
    {
      category: "OTHER",
      priority: "LOW",
      intent: "unsubscribe",
      sentiment: "negative",
      leadScore: 0,
      summary: "Wants to unsubscribe from emails.",
      draft: "You have been unsubscribed successfully.",
      status: "used",
    },
    {
      category: "LEAD",
      priority: "HIGH",
      intent: "buy",
      sentiment: "positive",
      leadScore: 88,
      summary: "Ready to upgrade to pro plan.",
      draft: "That's great! Here is the link to upgrade your account.",
      status: "sent",
    }
  ];

  for (let i = 0; i < sampleData.length; i++) {
    const data = sampleData[i];
    await prisma.quickAnalysis.create({
      data: {
        orgId: org.id,
        content: `Sample email content ${i + 1}`,
        category: data.category,
        priority: data.priority,
        intent: data.intent,
        sentiment: data.sentiment,
        leadScore: data.leadScore,
        summary: data.summary,
        draft: data.draft,
        status: data.status,
      },
    });
  }

  console.log("Successfully seeded 10 QuickAnalysis records!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
