// ─── Interfaces ──────────────────────────────────────────────

export interface Instructor {
  id: string;
  name: string;
  title: string;
  bio: string;
  image: string;
  coursesCount: number;
  studentsCount: number;
  rating: number;
}

export interface Lesson {
  id: string;
  title: string;
  duration: number; // minutes
  type: 'video' | 'article' | 'quiz';
  isPreview?: boolean;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  instructor: string;
  instructorId: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number; // hours
  modules: Module[];
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  price: number | null;
  originalPrice?: number;
  discountPercent?: number;
  thumbnail: string;
  lessonCount: number;
  tags: string[];
  badge?: 'bestseller' | 'new' | 'free';
  lastUpdated: string;
  language: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  content: string;
  date: string;
}

export interface LiveClass {
  id: string;
  category: string;
  title: string;
  date: string;
  time: string;
  instructor: string;
  thumbnail: string;
}

export interface Batch {
  id: string;
  title: string;
  thumbnail: string;
}

// ─── Instructors ─────────────────────────────────────────────

export const instructors: Instructor[] = [
  {
    id: 'instr-1',
    name: 'Barrister Ahmed Khan',
    title: 'Senior Tax Consultant & SC Advocate',
    bio: 'With over 20 years of experience in Pakistani corporate law, Barrister Ahmed has successfully represented dozens of Fortune 100 companies in tax litigation before the Appellate Tribunals and High Courts. He is a frequent contributor to leading financial journals and a visiting professor at the National Academy of Taxation.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    coursesCount: 4,
    studentsCount: 4200,
    rating: 4.9,
  },
  {
    id: 'instr-2',
    name: 'Fatima Khan, FCA',
    title: 'Bookkeeping & Small Business Expert',
    bio: 'Dedicated to helping small business owners master bookkeeping and tax planning. Published author and frequent conference speaker with expertise in modern accounting software integration and FBR IRIS portal training.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    coursesCount: 3,
    studentsCount: 6800,
    rating: 4.8,
  },
  {
    id: 'instr-3',
    name: 'Muhammad Saleem, ACCA',
    title: 'Audit & Compliance Professional',
    bio: 'Specialist in internal and external audits with 15 years at Big Four firms. Expert in corporate governance, COSO frameworks, and regulatory compliance across Pakistan and the Middle East.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    coursesCount: 2,
    studentsCount: 2285,
    rating: 4.7,
  },
  {
    id: 'instr-4',
    name: 'Dr. Ayesha Ali, PhD',
    title: 'IFRS & Corporate Accounting Lead',
    bio: 'International accounting standards expert with 12 years in multinational corporations. IFRS-certified trainer who has trained over 5,000 professionals across South Asia.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    coursesCount: 3,
    studentsCount: 3540,
    rating: 4.9,
  },
];

// ─── Reviews ─────────────────────────────────────────────────

export const reviews: Review[] = [
  { id: 'rev-1', name: 'Saad M., CA Finalist', rating: 5, content: 'The clarity provided on Section 149 (Minimum Tax) is better than any textbook I\'ve read. Essential for anyone appearing in ICAP exams.', date: '2 weeks ago' },
  { id: 'rev-2', name: 'Farhan A.', rating: 5, content: 'Very high quality production. The case study on tax treaty conflicts was particularly eye-opening. Highly recommended for professionals.', date: '1 month ago' },
  { id: 'rev-3', name: 'Zara Sheikh', rating: 4, content: 'Comprehensive content with practical examples. Would have liked more interactive exercises, but overall excellent value.', date: '1 month ago' },
  { id: 'rev-4', name: 'Omar Raza', rating: 5, content: 'This course transformed how I approach client tax planning. The instructor\'s real-world experience shines through in every module.', date: '3 months ago' },
  { id: 'rev-5', name: 'Hina Tariq', rating: 4, content: 'Great course for beginners. The FBR portal walkthrough was especially helpful. Would love a follow-up advanced course.', date: '2 months ago' },
];

// ─── Categories ──────────────────────────────────────────────

export const categories = [
  'Income Tax',
  'Sales Tax & GST',
  'Corporate Accounting',
  'FBR Compliance',
  'Bookkeeping',
  'Audit & Assurance',
];

// ─── Courses ─────────────────────────────────────────────────

function makeModules(count: number, prefix: string): Module[] {
  const moduleNames = [
    'Legal Framework & Foundations',
    'Core Concepts & Principles',
    'Practical Application',
    'Advanced Topics',
    'Case Studies & Assessment',
  ];
  return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    id: `${prefix}-mod-${i + 1}`,
    title: moduleNames[i] || `Module ${i + 1}`,
    lessons: Array.from({ length: 3 + (i % 2) }, (_, j) => ({
      id: `${prefix}-l-${i}-${j}`,
      title: `Lesson ${i * 4 + j + 1}: ${['Introduction', 'Deep Dive', 'Practical Exercise', 'Assessment'][j] || 'Topic ' + (j + 1)}`,
      duration: 30 + (j * 15) + (i * 5),
      type: (j === 3 ? 'quiz' : j === 2 ? 'article' : 'video') as 'video' | 'article' | 'quiz',
      isPreview: i === 0 && j === 0,
    })),
  }));
}

export const courses: Course[] = [
  {
    id: 'course-1',
    slug: 'mastering-income-tax-ordinances-2001',
    title: 'Mastering Income Tax Ordinances 2001',
    description: 'Master the complete process of filing income tax returns with FBR. Updated for 2025 regulations.',
    longDescription: 'This comprehensive course covers everything you need to know about the Income Tax Ordinance 2001. Learn the latest regulations, forms, deadlines, and best practices. Perfect for professionals, self-employed individuals, and tax practitioners looking to master compliance. Includes practical walkthroughs of FBR IRIS portal, real-world case studies, and mock exam preparation.',
    instructor: 'Barrister Ahmed Khan',
    instructorId: 'instr-1',
    category: 'Income Tax',
    level: 'Intermediate',
    duration: 16,
    modules: makeModules(4, 'c1'),
    rating: 4.8,
    reviewCount: 342,
    enrollmentCount: 2150,
    price: 15500,
    originalPrice: 25000,
    discountPercent: 38,
    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=340&fit=crop',
    lessonCount: 150,
    tags: ['FBR', 'Tax', 'Compliance', '2025'],
    badge: 'bestseller',
    lastUpdated: 'May 2026',
    language: 'English & Urdu',
  },
  {
    id: 'course-2',
    slug: 'corporate-accounting-with-ifrs-standards',
    title: 'Corporate Accounting with IFRS Standards',
    description: 'Learn international financial reporting standards and corporate accounting principles.',
    longDescription: 'A deep dive into International Financial Reporting Standards (IFRS) and corporate accounting. Designed for finance professionals and accountants working in multinational corporations who need to master global reporting standards. Covers IFRS 9, 15, 16 and consolidation.',
    instructor: 'Dr. Ayesha Ali, PhD',
    instructorId: 'instr-4',
    category: 'Corporate Accounting',
    level: 'Advanced',
    duration: 24,
    modules: makeModules(5, 'c2'),
    rating: 4.9,
    reviewCount: 215,
    enrollmentCount: 890,
    price: 22500,
    originalPrice: 35000,
    discountPercent: 36,
    thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=340&fit=crop',
    lessonCount: 120,
    tags: ['IFRS', 'Accounting', 'Corporate'],
    lastUpdated: 'April 2026',
    language: 'English',
  },
  {
    id: 'course-3',
    slug: 'advanced-sales-tax-vat-compliance',
    title: 'Advanced Sales Tax & VAT Compliance',
    description: 'Complete guide to sales tax compliance, audit preparation, and VAT implementation.',
    longDescription: 'Master sales tax regulations, filing requirements, and audit defense strategies. Ideal for practitioners, business owners, and tax consultants working across multiple tax jurisdictions in Pakistan.',
    instructor: 'Fatima Khan, FCA',
    instructorId: 'instr-2',
    category: 'Sales Tax & GST',
    level: 'Intermediate',
    duration: 14,
    modules: makeModules(3, 'c3'),
    rating: 4.7,
    reviewCount: 189,
    enrollmentCount: 1420,
    price: 12000,
    originalPrice: 18000,
    discountPercent: 33,
    thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=340&fit=crop',
    lessonCount: 95,
    tags: ['Sales Tax', 'Compliance', 'Audit'],
    badge: 'new',
    lastUpdated: 'June 2026',
    language: 'English & Urdu',
  },
  {
    id: 'course-4',
    slug: 'bookkeeping-for-small-businesses',
    title: 'Bookkeeping for Small Businesses',
    description: 'Essential bookkeeping skills for entrepreneurs. No accounting background required.',
    longDescription: 'Learn the fundamentals of bookkeeping, from basic journal entries to preparing financial statements. This beginner-friendly course requires no prior accounting knowledge and will have you confidently managing your business books.',
    instructor: 'Fatima Khan, FCA',
    instructorId: 'instr-2',
    category: 'Bookkeeping',
    level: 'Beginner',
    duration: 12,
    modules: makeModules(3, 'c4'),
    rating: 4.6,
    reviewCount: 456,
    enrollmentCount: 3200,
    price: null,
    thumbnail: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=340&fit=crop',
    lessonCount: 60,
    tags: ['Bookkeeping', 'Beginner', 'Business'],
    badge: 'free',
    lastUpdated: 'March 2026',
    language: 'English & Urdu',
  },
  {
    id: 'course-5',
    slug: 'fbr-compliance-essentials-for-businesses',
    title: 'FBR Compliance Essentials for Businesses',
    description: 'Stay compliant with Federal Board of Revenue regulations and avoid penalties.',
    longDescription: 'A practical guide to understanding FBR requirements, documentation, and compliance strategies for businesses of all sizes operating in Pakistan. Covers registration, record-keeping, and audit preparation.',
    instructor: 'Barrister Ahmed Khan',
    instructorId: 'instr-1',
    category: 'FBR Compliance',
    level: 'Beginner',
    duration: 10,
    modules: makeModules(3, 'c5'),
    rating: 4.5,
    reviewCount: 178,
    enrollmentCount: 950,
    price: 8500,
    originalPrice: 14000,
    discountPercent: 39,
    thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=340&fit=crop',
    lessonCount: 85,
    tags: ['FBR', 'Compliance', 'Regulations'],
    lastUpdated: 'February 2026',
    language: 'English & Urdu',
  },
  {
    id: 'course-6',
    slug: 'practical-guide-to-tax-audits-assurance',
    title: 'Practical Guide to Tax Audits & Assurance',
    description: 'Introduction to audit processes, evidence collection, and reporting standards.',
    longDescription: 'Learn the principles of auditing, evidence collection, audit planning, and reporting. Essential for aspiring auditors and accounting professionals seeking to build a career in assurance services.',
    instructor: 'Muhammad Saleem, ACCA',
    instructorId: 'instr-3',
    category: 'Audit & Assurance',
    level: 'Intermediate',
    duration: 18,
    modules: makeModules(4, 'c6'),
    rating: 4.9,
    reviewCount: 234,
    enrollmentCount: 1560,
    price: 19000,
    originalPrice: 28000,
    discountPercent: 32,
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=340&fit=crop',
    lessonCount: 110,
    tags: ['Audit', 'Standards', 'Procedures'],
    badge: 'bestseller',
    lastUpdated: 'May 2026',
    language: 'English',
  },
  {
    id: 'course-7',
    slug: 'introduction-to-pakistani-tax-law',
    title: 'Introduction to Pakistani Tax Law',
    description: 'Foundational overview of Pakistan\'s tax system for beginners.',
    longDescription: 'A comprehensive introduction to the Pakistani tax landscape. Covers the constitution\'s tax provisions, federal vs provincial taxes, FBR structure, and fundamental concepts every citizen and business owner should understand.',
    instructor: 'Barrister Ahmed Khan',
    instructorId: 'instr-1',
    category: 'Income Tax',
    level: 'Beginner',
    duration: 8,
    modules: makeModules(2, 'c7'),
    rating: 4.4,
    reviewCount: 312,
    enrollmentCount: 4100,
    price: null,
    thumbnail: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&h=340&fit=crop',
    lessonCount: 45,
    tags: ['Tax Law', 'Beginner', 'Pakistan'],
    badge: 'free',
    lastUpdated: 'January 2026',
    language: 'English & Urdu',
  },
  {
    id: 'course-8',
    slug: 'forensic-accounting-fbr-e-filing',
    title: 'Forensic Accounting & FBR E-Filing',
    description: 'Analyze financial statements and master FBR electronic filing procedures.',
    longDescription: 'Learn to read, understand, and analyze financial statements with a forensic lens. Covers ratio analysis, trend analysis, fraud detection techniques, and a complete walkthrough of the FBR IRIS e-filing portal.',
    instructor: 'Dr. Ayesha Ali, PhD',
    instructorId: 'instr-4',
    category: 'Corporate Accounting',
    level: 'Intermediate',
    duration: 15,
    modules: makeModules(4, 'c8'),
    rating: 4.5,
    reviewCount: 267,
    enrollmentCount: 1850,
    price: 8500,
    originalPrice: 14000,
    discountPercent: 39,
    thumbnail: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=340&fit=crop',
    lessonCount: 90,
    tags: ['Forensic', 'E-filing', 'FBR'],
    lastUpdated: 'March 2026',
    language: 'English & Urdu',
  },
  {
    id: 'course-9',
    slug: 'international-taxation-treaty-obligations',
    title: 'International Taxation & Treaty Obligations',
    description: 'Complete guide to cross-border taxation and double taxation treaties.',
    longDescription: 'Understand international tax regulations, treaty networks, transfer pricing rules, and compliance requirements for businesses operating across borders from Pakistan.',
    instructor: 'Dr. Ayesha Ali, PhD',
    instructorId: 'instr-4',
    category: 'Income Tax',
    level: 'Advanced',
    duration: 13,
    modules: makeModules(3, 'c9'),
    rating: 4.8,
    reviewCount: 134,
    enrollmentCount: 580,
    price: 25000,
    originalPrice: 40000,
    discountPercent: 38,
    thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=340&fit=crop',
    lessonCount: 75,
    tags: ['International', 'Treaties', 'Transfer Pricing'],
    lastUpdated: 'May 2026',
    language: 'English',
  },
  {
    id: 'course-10',
    slug: 'withholding-tax-obligations-for-businesses',
    title: 'Withholding Tax Obligations for Businesses',
    description: 'Master withholding tax documentation and record-keeping best practices.',
    longDescription: 'Learn what documents to maintain, how to organize withholding obligations, and how to prepare for tax audits with proper record keeping under current FBR rules.',
    instructor: 'Barrister Ahmed Khan',
    instructorId: 'instr-1',
    category: 'Sales Tax & GST',
    level: 'Beginner',
    duration: 8,
    modules: makeModules(2, 'c10'),
    rating: 4.7,
    reviewCount: 89,
    enrollmentCount: 650,
    price: null,
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=340&fit=crop',
    lessonCount: 50,
    tags: ['Withholding', 'Records', 'Compliance'],
    badge: 'free',
    lastUpdated: 'February 2026',
    language: 'English & Urdu',
  },
  {
    id: 'course-11',
    slug: 'tax-planning-for-high-net-worth-individuals',
    title: 'Tax Planning for High-Net-Worth Individuals',
    description: 'Advanced tax optimization techniques for high-income earners and businesses.',
    longDescription: 'Advanced strategies for minimizing tax liability through legal tax planning methods. Covers corporate structures, investment strategies, and maximum deductions for sophisticated taxpayers.',
    instructor: 'Barrister Ahmed Khan',
    instructorId: 'instr-1',
    category: 'Income Tax',
    level: 'Advanced',
    duration: 20,
    modules: makeModules(5, 'c11'),
    rating: 4.8,
    reviewCount: 198,
    enrollmentCount: 620,
    price: 25000,
    originalPrice: 38000,
    discountPercent: 34,
    thumbnail: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=340&fit=crop',
    lessonCount: 130,
    tags: ['Tax Planning', 'Advanced', 'Strategy'],
    lastUpdated: 'April 2026',
    language: 'English',
  },
  {
    id: 'course-12',
    slug: 'filing-personal-income-tax-returns-iris',
    title: 'Filing Personal Income Tax Returns (IRIS)',
    description: 'Hands-on guide to personal tax filing using FBR IRIS portal.',
    longDescription: 'Practical training in using FBR IRIS portal for personal tax return filing, understanding tax slabs, and claiming maximum deductions. Step-by-step screen recordings included.',
    instructor: 'Fatima Khan, FCA',
    instructorId: 'instr-2',
    category: 'FBR Compliance',
    level: 'Beginner',
    duration: 16,
    modules: makeModules(4, 'c12'),
    rating: 4.8,
    reviewCount: 312,
    enrollmentCount: 2100,
    price: 9900,
    originalPrice: 15000,
    discountPercent: 34,
    thumbnail: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=600&h=340&fit=crop',
    lessonCount: 100,
    tags: ['Personal Tax', 'IRIS', 'Filing'],
    badge: 'bestseller',
    lastUpdated: 'June 2026',
    language: 'English & Urdu',
  },
  {
    id: 'course-13',
    slug: 'internal-controls-corporate-governance',
    title: 'Internal Controls & Corporate Governance',
    description: 'Build effective internal control systems and governance frameworks.',
    longDescription: 'Learn to design and implement internal controls, compliance frameworks, and corporate governance best practices aligned with COSO and international standards.',
    instructor: 'Muhammad Saleem, ACCA',
    instructorId: 'instr-3',
    category: 'Audit & Assurance',
    level: 'Advanced',
    duration: 22,
    modules: makeModules(5, 'c13'),
    rating: 4.7,
    reviewCount: 156,
    enrollmentCount: 725,
    price: null,
    thumbnail: 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=600&h=340&fit=crop',
    lessonCount: 70,
    tags: ['Governance', 'Controls', 'COSO'],
    badge: 'free',
    lastUpdated: 'March 2026',
    language: 'English',
  },
  {
    id: 'course-14',
    slug: 'record-keeping-audit-preparation',
    title: 'Record-Keeping & Audit Preparation',
    description: 'Master documentation requirements and audit-readiness best practices.',
    longDescription: 'Learn systematic record-keeping methods, document organization, and audit preparation strategies that will save you time and penalties. Includes checklists and templates.',
    instructor: 'Muhammad Saleem, ACCA',
    instructorId: 'instr-3',
    category: 'Bookkeeping',
    level: 'Intermediate',
    duration: 10,
    modules: makeModules(3, 'c14'),
    rating: 4.6,
    reviewCount: 143,
    enrollmentCount: 890,
    price: 5500,
    originalPrice: 9000,
    discountPercent: 39,
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=340&fit=crop',
    lessonCount: 40,
    tags: ['Records', 'Audit Prep', 'Documentation'],
    lastUpdated: 'January 2026',
    language: 'English & Urdu',
  },
  {
    id: 'course-15',
    slug: 'ca-exam-preparation-tax-module',
    title: 'CA Exam Preparation — Tax Module',
    description: 'Comprehensive CA exam prep covering all taxation topics.',
    longDescription: 'Intensive preparation for the CA examination tax module. Covers all major taxation topics with practice questions, mock exams, and detailed answer explanations aligned with ICAP requirements.',
    instructor: 'Dr. Ayesha Ali, PhD',
    instructorId: 'instr-4',
    category: 'Income Tax',
    level: 'Advanced',
    duration: 30,
    modules: makeModules(5, 'c15'),
    rating: 4.9,
    reviewCount: 287,
    enrollmentCount: 1340,
    price: 35000,
    originalPrice: 55000,
    discountPercent: 36,
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&h=340&fit=crop',
    lessonCount: 200,
    tags: ['CA Exam', 'ICAP', 'Preparation'],
    badge: 'bestseller',
    lastUpdated: 'June 2026',
    language: 'English',
  },
  {
    id: 'course-16',
    slug: 'payroll-management-eobi-compliance',
    title: 'Payroll Management & EOBI Compliance',
    description: 'End-to-end payroll management including EOBI and social security.',
    longDescription: 'Learn to manage payroll processes including salary calculations, tax deductions, EOBI contributions, social security obligations, and compliance reporting for Pakistani businesses.',
    instructor: 'Fatima Khan, FCA',
    instructorId: 'instr-2',
    category: 'Bookkeeping',
    level: 'Intermediate',
    duration: 12,
    modules: makeModules(3, 'c16'),
    rating: 4.5,
    reviewCount: 98,
    enrollmentCount: 560,
    price: 7500,
    originalPrice: 12000,
    discountPercent: 38,
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=340&fit=crop',
    lessonCount: 55,
    tags: ['Payroll', 'EOBI', 'Compliance'],
    lastUpdated: 'April 2026',
    language: 'English & Urdu',
  },
];

// ─── Live Classes ────────────────────────────────────────────

export const liveClasses: LiveClass[] = [
  { id: 'live-1', category: 'Tax Filing LIVE', title: 'LIVE Doubt Session | Income Tax Return Filing 2025', date: 'Jun 15, 2026', time: '08:00 PM', instructor: 'Barrister Ahmed Khan', thumbnail: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=450&fit=crop' },
  { id: 'live-2', category: 'FBR Compliance LIVE', title: 'FBR IRIS Portal | E-Filing Walkthrough', date: 'Jun 16, 2026', time: '07:00 PM', instructor: 'Fatima Khan, FCA', thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=450&fit=crop' },
  { id: 'live-3', category: 'Sales Tax LIVE', title: 'Sales Tax & GST | Provincial Compliance', date: 'Jun 17, 2026', time: '09:00 PM', instructor: 'Dr. Ayesha Ali, PhD', thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=450&fit=crop' },
  { id: 'live-4', category: 'Bookkeeping LIVE', title: 'QuickBooks for Pakistani Businesses | Session 8', date: 'Jun 18, 2026', time: '06:00 PM', instructor: 'Muhammad Saleem, ACCA', thumbnail: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=450&fit=crop' },
];

// ─── Batches ─────────────────────────────────────────────────

export const batches: Batch[] = [
  { id: 'batch-1', title: 'Income Tax Filing Masterclass — Jan 2026', thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=700&h=400&fit=crop' },
  { id: 'batch-2', title: 'Sales Tax & GST Compliance — Feb 2026', thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=700&h=400&fit=crop' },
  { id: 'batch-3', title: 'IFRS & Corporate Accounting — Mar 2026', thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=700&h=400&fit=crop' },
  { id: 'batch-4', title: 'FBR Compliance & E-Filing — Apr 2026', thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=700&h=400&fit=crop' },
  { id: 'batch-5', title: 'Audit & Assurance Professional — May 2026', thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700&h=400&fit=crop' },
  { id: 'batch-6', title: 'Tax Planning Strategies — Jun 2026', thumbnail: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=700&h=400&fit=crop' },
  { id: 'batch-7', title: 'CA Exam Intensive Prep — Jul 2026', thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=700&h=400&fit=crop' },
  { id: 'batch-8', title: 'International Taxation — Aug 2026', thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=700&h=400&fit=crop' },
  { id: 'batch-9', title: 'Forensic Accounting & Fraud — Sep 2026', thumbnail: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=700&h=400&fit=crop' },
];

// ─── Helpers ─────────────────────────────────────────────────

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function getInstructorById(id: string): Instructor | undefined {
  return instructors.find((i) => i.id === id);
}

export function getTotalLessons(course: Course): number {
  return course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
}

export function getTotalDurationMinutes(course: Course): number {
  return course.modules.reduce(
    (acc, mod) => acc + mod.lessons.reduce((a, l) => a + l.duration, 0),
    0
  );
}
