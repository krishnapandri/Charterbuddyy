import { db } from "../server/db";
import { 
  topics, 
  questions, 
  practiceSets,
  users
} from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Function to hash password for creating test users
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  console.log("Starting database seeding...");

  try {
    // Check if the database already has topics
    const existingTopics = await db.select().from(topics);
    
    if (existingTopics.length > 0) {
      console.log("Database already has data. Skipping seeding.");
      return;
    }
    
    // Create an admin test user
    console.log("Creating admin user...");
    await db.insert(users).values({
      username: "admin",
      password: await hashPassword("admin123"),
      level: "Level I Candidate",
      streakDays: 0,
      lastLoginDate: new Date()
    });
    
    // Insert CFA Level I Topics
    console.log("Inserting CFA Level I topics...");
    const cfaTopics = [
      {
        name: "Ethical and Professional Standards",
        description: "Code of Ethics, Standards of Professional Conduct, and Global Investment Performance Standards (GIPS)",
        icon: "scale"
      },
      {
        name: "Quantitative Methods",
        description: "Time value of money, statistical concepts, probability theory, and investment analysis",
        icon: "calculator"
      },
      {
        name: "Economics",
        description: "Microeconomics, macroeconomics, and global economic analysis",
        icon: "line-chart"
      },
      {
        name: "Financial Statement Analysis",
        description: "Financial reporting standards, analysis of financial statements, and ratio analysis",
        icon: "file-text"
      },
      {
        name: "Corporate Finance",
        description: "Capital budgeting, cost of capital, and corporate governance",
        icon: "building"
      },
      {
        name: "Portfolio Management",
        description: "Modern portfolio theory, asset allocation, and portfolio construction",
        icon: "briefcase"
      },
      {
        name: "Equity Investments",
        description: "Equity markets, fundamental analysis, and equity valuation models",
        icon: "trending-up"
      },
      {
        name: "Fixed Income",
        description: "Debt securities, yield measures, and valuation of fixed income securities",
        icon: "dollar-sign"
      },
      {
        name: "Derivatives",
        description: "Futures, forwards, options, swaps, and hedging strategies",
        icon: "git-branch"
      },
      {
        name: "Alternative Investments",
        description: "Real estate, private equity, hedge funds, and commodities",
        icon: "database"
      }
    ];
    
    for (const topic of cfaTopics) {
      const result = await db.insert(topics).values(topic).returning();
      console.log(`Added topic: ${topic.name}`);
    }
    
    // Get all topic IDs to reference in questions
    const allTopics = await db.select().from(topics);
    const topicsMap = new Map(allTopics.map(t => [t.name, t.id]));
    
    // Sample questions for Ethics
    console.log("Adding sample questions...");
    const ethicsQuestions = [
      {
        topicId: topicsMap.get("Ethical and Professional Standards")!,
        subtopic: "Code of Ethics",
        questionText: "Which of the following actions would most likely violate the CFA Institute's Code of Ethics?",
        optionA: "Maintaining the confidentiality of current client information",
        optionB: "Using soft dollars to purchase research that benefits all clients",
        optionC: "Trading personal investments after client transactions are executed",
        optionD: "Using material nonpublic information to make investment decisions",
        correctOption: "D",
        explanation: "Using material nonpublic information to make investment decisions is insider trading, which violates the CFA Institute's Code of Ethics and Standards of Professional Conduct, specifically Standard II(A) Material Nonpublic Information.",
        difficulty: 2
      },
      {
        topicId: topicsMap.get("Ethical and Professional Standards")!,
        subtopic: "Standards of Professional Conduct",
        questionText: "An investment manager allocates IPO shares to client accounts. According to the Standards of Practice Handbook, this allocation must be done:",
        optionA: "To maximize client returns regardless of client objectives",
        optionB: "In proportion to the assets under management for each client",
        optionC: "In a fair and equitable manner across all eligible clients",
        optionD: "Exclusively to the clients with the highest fee structures",
        correctOption: "C",
        explanation: "According to Standard III(B) Fair Dealing, investment professionals must deal fairly and objectively with all clients when providing investment analysis, making investment recommendations, taking investment actions, or engaging in other professional activities. IPO allocations should be conducted in a fair and equitable manner across all eligible clients.",
        difficulty: 2
      }
    ];
    
    // Sample questions for Quantitative Methods
    const quantQuestions = [
      {
        topicId: topicsMap.get("Quantitative Methods")!,
        subtopic: "Time Value of Money",
        questionText: "An investment offers $1,000 per year for 5 years, with the first payment occurring one year from now. If the discount rate is 6%, what is the approximate present value of this annuity?",
        optionA: "$3,500",
        optionB: "$4,212",
        optionC: "$5,000",
        optionD: "$5,637",
        correctOption: "B",
        explanation: "This is a 5-year ordinary annuity of $1,000 with a 6% discount rate. The PV formula is PV = PMT × [1 - 1/(1+r)^n]/r = $1,000 × [1 - 1/(1.06)^5]/0.06 = $4,212.",
        difficulty: 2
      },
      {
        topicId: topicsMap.get("Quantitative Methods")!,
        subtopic: "Probability Theory",
        questionText: "If two events A and B are independent, and P(A) = 0.3 and P(B) = 0.4, what is P(A and B)?",
        optionA: "0.12",
        optionB: "0.7",
        optionC: "0.58",
        optionD: "0.35",
        correctOption: "A",
        explanation: "For independent events, P(A and B) = P(A) × P(B) = 0.3 × 0.4 = 0.12.",
        difficulty: 1
      }
    ];
    
    // Sample questions for Economics
    const econQuestions = [
      {
        topicId: topicsMap.get("Economics")!,
        subtopic: "Macroeconomics",
        questionText: "When a central bank engages in quantitative easing, it is most likely to:",
        optionA: "Increase interest rates to combat inflation",
        optionB: "Purchase government securities to increase money supply",
        optionC: "Reduce government spending to decrease budget deficits",
        optionD: "Impose higher reserve requirements on commercial banks",
        correctOption: "B",
        explanation: "Quantitative easing involves a central bank purchasing government securities or other securities from the market to increase the money supply and encourage lending and investment. It is typically used when interest rates are near zero and conventional monetary policy has become ineffective.",
        difficulty: 2
      },
      {
        topicId: topicsMap.get("Economics")!,
        subtopic: "Microeconomics",
        questionText: "In a perfectly competitive market, what happens to the market price and quantity in the long run if firms are earning economic profits?",
        optionA: "Price increases, quantity decreases",
        optionB: "Price decreases, quantity increases",
        optionC: "Price and quantity both increase",
        optionD: "Price and quantity both decrease",
        correctOption: "B",
        explanation: "In a perfectly competitive market, economic profits attract new entrants. As new firms enter the market, the supply increases, which leads to a decrease in price and an increase in quantity until economic profits return to zero in the long run.",
        difficulty: 3
      }
    ];

    // Sample questions for Financial Statement Analysis
    const fsaQuestions = [
      {
        topicId: topicsMap.get("Financial Statement Analysis")!,
        subtopic: "Financial Ratios",
        questionText: "A company has current assets of $2 million, total assets of $10 million, current liabilities of $1.5 million, and total liabilities of $4 million. What is the company's debt-to-equity ratio?",
        optionA: "0.4",
        optionB: "0.67",
        optionC: "1.5",
        optionD: "2.5",
        correctOption: "B",
        explanation: "Debt-to-equity ratio = Total Liabilities / Total Equity. Total Equity = Total Assets - Total Liabilities = $10M - $4M = $6M. Therefore, Debt-to-equity ratio = $4M / $6M = 0.67.",
        difficulty: 2
      },
      {
        topicId: topicsMap.get("Financial Statement Analysis")!,
        subtopic: "Income Statement Analysis",
        questionText: "Which of the following items would NOT be found on an income statement prepared under IFRS?",
        optionA: "Revenue",
        optionB: "Cost of goods sold",
        optionC: "Unrealized gain on available-for-sale securities",
        optionD: "Interest expense",
        correctOption: "C",
        explanation: "Under IFRS, unrealized gains or losses on available-for-sale securities are recorded in other comprehensive income and appear in the statement of comprehensive income, not on the income statement itself.",
        difficulty: 1
      }
    ];

    // Add all questions
    const allQuestions = [
      ...ethicsQuestions,
      ...quantQuestions,
      ...econQuestions,
      ...fsaQuestions
    ];

    for (const question of allQuestions) {
      await db.insert(questions).values(question);
    }

    console.log(`Added ${allQuestions.length} sample questions.`);
    
    // Create practice sets
    console.log("Creating practice sets...");
    const practiceSetsData = [
      {
        name: "Ethics Fundamentals",
        topicId: topicsMap.get("Ethical and Professional Standards")!,
        subtopic: "Code of Ethics",
        questionCount: 10,
        estimatedTime: 15,
        difficulty: 1,
        isRecommended: true,
        status: "new"
      },
      {
        name: "Time Value of Money Practice",
        topicId: topicsMap.get("Quantitative Methods")!,
        subtopic: "Time Value of Money",
        questionCount: 15,
        estimatedTime: 25,
        difficulty: 2,
        isRecommended: true,
        status: "new"
      },
      {
        name: "Macroeconomic Concepts",
        topicId: topicsMap.get("Economics")!,
        subtopic: "Macroeconomics",
        questionCount: 12,
        estimatedTime: 20,
        difficulty: 2,
        isRecommended: false,
        status: "new"
      },
      {
        name: "Financial Statement Deep Dive",
        topicId: topicsMap.get("Financial Statement Analysis")!,
        subtopic: "Financial Ratios",
        questionCount: 20,
        estimatedTime: 30,
        difficulty: 3,
        isRecommended: true,
        status: "new"
      }
    ];
    
    for (const set of practiceSetsData) {
      await db.insert(practiceSets).values(set);
    }
    
    console.log(`Added ${practiceSetsData.length} practice sets.`);
    console.log("Database seeding completed successfully!");
  
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  });