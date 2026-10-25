const TECH_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
  'Swift', 'Kotlin', 'Dart', 'Scala', 'R', 'MATLAB', 'Perl', 'HTML', 'CSS', 'SASS', 'SCSS',
  'React', 'Next.js', 'Angular', 'Vue', 'Vue.js', 'Nuxt.js', 'Svelte', 'Redux', 'Tailwind CSS',
  'Bootstrap', 'Node.js', 'Express', 'Express.js', 'NestJS', 'Django', 'Flask', 'FastAPI',
  'Spring', 'Spring Boot', 'Laravel', 'ASP.NET', 'Ruby on Rails', 'GraphQL', 'REST API',
  'Microservices', 'MySQL', 'PostgreSQL', 'SQLite', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB',
  'Oracle', 'Firebase', 'Supabase', 'SQL', 'NoSQL', 'Prisma', 'Hibernate', 'Docker', 'Kubernetes',
  'AWS', 'Azure', 'GCP', 'Google Cloud', 'Linux', 'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins',
  'Terraform', 'Ansible', 'DevOps', 'Agile', 'Scrum', 'Jira', 'Machine Learning', 'Deep Learning',
  'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Data Science', 'Data Analysis', 'Pandas',
  'NumPy', 'OpenCV', 'NLP', 'Computer Vision', 'LLM', 'Artificial Intelligence', 'Power BI',
  'Tableau', 'Excel', 'Android', 'iOS', 'Flutter', 'React Native', 'SwiftUI', 'AutoCAD',
  'SolidWorks', 'ANSYS', 'CATIA', 'VLSI', 'Embedded Systems', 'Arduino', 'Raspberry Pi', 'Verilog',
  'VHDL', 'Microcontrollers', 'PLC', 'SCADA', 'Cybersecurity', 'Ethical Hacking', 'Penetration Testing',
  'Cryptography', 'Network Security', 'Networking', 'Cloud Computing', 'Blockchain', 'Web3',
  'Solidity', 'Smart Contracts', 'IoT', 'Robotics', 'SAP'
];

/**
 * Generate unique receipt number: RCPT-YYYY-XXXX
 */
function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RCPT-${year}-${random}`;
}

/**
 * Calculate fine based on due date and return date (or current date)
 */
function calculateFine(dueDate, returnDate = new Date(), finePerDay = 2) {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);

  if (returned <= due) {
    return { daysOverdue: 0, amount: 0 };
  }

  const diffTime = returned.getTime() - due.getTime();
  const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const amount = daysOverdue * Number(finePerDay);

  return { daysOverdue, amount };
}

/**
 * Parse text and extract matching skills
 */
function parseSkills(text) {
  if (!text || typeof text !== 'string') return [];
  const matched = new Set();
  const lowerText = text.toLowerCase();

  for (const skill of TECH_SKILLS) {
    // Escape special regex characters like +, #, .
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    // For single letters like C, require distinct word boundary
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#+])${escaped}(?:$|[^a-zA-Z0-9_#+])`, 'i');
    if (regex.test(text)) {
      matched.add(skill);
    }
  }

  return Array.from(matched);
}

/**
 * Helper to record audit log
 */
async function createAuditLog(prisma, userId, action, entity, entityId, meta = null) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: String(entityId),
        meta: meta ? (typeof meta === 'string' ? meta : JSON.stringify(meta)) : null
      }
    });
  } catch (err) {
    console.error('Failed to create audit log:', err.message);
  }
}

/**
 * Helper to create notification
 */
async function createNotification(prisma, userId, title, message, type = 'INFO', link = null) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link
      }
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

module.exports = {
  TECH_SKILLS,
  generateReceiptNumber,
  calculateFine,
  parseSkills,
  createAuditLog,
  createNotification
};
