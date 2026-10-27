const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting College ERP Database Seeding ---');

  // 1. Clean existing records in correct relation order
  console.log('Cleaning existing records...');
  await prisma.roundResult.deleteMany();
  await prisma.interviewRound.deleteMany();
  await prisma.application.deleteMany();
  await prisma.placementDrive.deleteMany();
  await prisma.companyUser.deleteMany();
  await prisma.company.deleteMany();
  await prisma.mentorSession.deleteMany();
  await prisma.mentorshipRequest.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.donationCampaign.deleteMany();
  await prisma.alumni.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.bookIssue.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.bookCopy.deleteMany();
  await prisma.book.deleteMany();
  await prisma.digitalResource.deleteMany();
  await prisma.parsedResume.deleteMany();
  await prisma.student.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.user.deleteMany();

  // 2. App Settings
  console.log('Seeding App Settings...');
  const settings = [
    { key: 'loanPeriodDays', value: '14' },
    { key: 'finePerDay', value: '2' },
    { key: 'collegeName', value: 'Kirti M Doongursee College of Arts, Science & Commerce' },
    { key: 'academicYear', value: '2024-25' }
  ];
  for (const s of settings) {
    await prisma.appSetting.create({ data: s });
  }

  // Common password hash for demo accounts: "Password@123"
  const defaultPasswordHash = bcrypt.hashSync('Password@123', 10);

  // 3. Create Companies
  console.log('Seeding Companies...');
  const companiesData = [
    { name: 'TCS', industry: 'IT Services & Consulting', email: 'careers@tcs.com', website: 'https://www.tcs.com', phone: '+91 22 6778 9999', status: 'APPROVED' },
    { name: 'Infosys', industry: 'Software & Cloud Services', email: 'campus@infosys.com', website: 'https://www.infosys.com', phone: '+91 80 2852 0261', status: 'APPROVED' },
    { name: 'Google India', industry: 'Internet & Cloud Technology', email: 'recruitment@google.com', website: 'https://careers.google.com', phone: '+91 80 6721 8000', status: 'APPROVED' },
    { name: 'Microsoft IDC', industry: 'Software Engineering', email: 'indiarecruiting@microsoft.com', website: 'https://careers.microsoft.com', phone: '+91 40 6695 0000', status: 'APPROVED' },
    { name: 'Amazon India', industry: 'E-commerce & Cloud Computing', email: 'campus-in@amazon.com', website: 'https://amazon.jobs', phone: '+91 80 4335 0000', status: 'APPROVED' },
    { name: 'Wipro Technologies', industry: 'Information Technology', email: 'campus.hiring@wipro.com', website: 'https://www.wipro.com', phone: '+91 80 2844 0011', status: 'APPROVED' },
    { name: 'HCL Technologies', industry: 'Engineering R&D Services', email: 'freshers@hcl.com', website: 'https://www.hcltech.com', phone: '+91 120 401 3000', status: 'APPROVED' },
    { name: 'Accenture India', industry: 'Management Consulting & IT', email: 'campus.india@accenture.com', website: 'https://www.accenture.com', phone: '+91 22 4044 4000', status: 'APPROVED' },
    { name: 'Cognizant', industry: 'Digital Business Solutions', email: 'campusrecruitment@cognizant.com', website: 'https://www.cognizant.com', phone: '+91 44 4209 6000', status: 'APPROVED' },
    { name: 'Zoho Corporation', industry: 'SaaS & Enterprise Applications', email: 'recruit@zohocorp.com', website: 'https://www.zoho.com', phone: '+91 44 6744 7070', status: 'APPROVED' }
  ];

  const createdCompanies = {};
  for (const c of companiesData) {
    const comp = await prisma.company.create({ data: c });
    createdCompanies[c.name] = comp;
  }

  // 4. Create Demo Users (6 demo users - one for each role)
  console.log('Seeding Demo Users...');

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@erp.edu',
      password: defaultPasswordHash,
      name: 'Dr. Rajesh Sharma',
      role: 'ADMIN',
      staff: {
        create: {
          department: 'Administration',
          designation: 'Principal & Chief Administrator',
          employeeId: 'ADM-001'
        }
      }
    }
  });

  // Librarian
  const librarianUser = await prisma.user.create({
    data: {
      email: 'librarian@erp.edu',
      password: defaultPasswordHash,
      name: 'Sunita Rao',
      role: 'LIBRARIAN',
      staff: {
        create: {
          department: 'Central Library',
          designation: 'Head Librarian',
          employeeId: 'LIB-001'
        }
      }
    }
  });

  // Placement Officer
  const placementUser = await prisma.user.create({
    data: {
      email: 'placement@erp.edu',
      password: defaultPasswordHash,
      name: 'Prof. Vikram Malhotra',
      role: 'PLACEMENT_OFFICER',
      staff: {
        create: {
          department: 'Training & Placement Cell',
          designation: 'Head Placement Officer',
          employeeId: 'TPO-001'
        }
      }
    }
  });

  // Company User
  const companyUser = await prisma.user.create({
    data: {
      email: 'company@erp.edu',
      password: defaultPasswordHash,
      name: 'Pooja Hegde (TCS Talent Acquisition)',
      role: 'COMPANY',
      companyUser: {
        create: {
          companyId: createdCompanies['TCS'].id
        }
      }
    }
  });

  // Demo Student
  const demoStudentUser = await prisma.user.create({
    data: {
      email: 'student@erp.edu',
      password: defaultPasswordHash,
      name: 'Aarav Patel',
      role: 'STUDENT',
      student: {
        create: {
          rollNumber: '22CS001',
          branch: 'CSE',
          batch: 2022,
          semester: 5,
          cgpa: 8.85,
          backlogs: 0,
          phone: '+91 98765 43210',
          address: '42 MG Road, Indiranagar, Bengaluru, Karnataka',
          skills: JSON.stringify(['JavaScript', 'React', 'Node.js', 'Express', 'Python', 'SQL', 'Git'])
        }
      }
    },
    include: { student: true }
  });

  // Demo Alumni
  const demoAlumniUser = await prisma.user.create({
    data: {
      email: 'alumni@erp.edu',
      password: defaultPasswordHash,
      name: 'Rohan Verma',
      role: 'ALUMNI',
      alumni: {
        create: {
          rollNumber: '18CS045',
          branch: 'CSE',
          batch: 2018,
          graduationYear: 2022,
          currentCompany: 'Google India',
          currentRole: 'Senior Software Engineer',
          location: 'Bengaluru, Karnataka',
          linkedin: 'https://linkedin.com/in/rohanverma-demo',
          skills: JSON.stringify(['Distributed Systems', 'Go', 'Kubernetes', 'Cloud Computing', 'System Design']),
          bio: 'Passionate software engineer building resilient cloud architectures. Proud alumnus eager to mentor juniors.',
          offersmentoring: true,
          mentoringAreas: JSON.stringify(['FAANG Interview Prep', 'System Design', 'Backend Engineering']),
          availability: 'Saturdays 3 PM - 6 PM IST',
          isVerified: true
        }
      }
    },
    include: { alumni: true }
  });

  // 5. Create 32 More Students (Total 33 Students across CSE, ECE, MECH, IT, CIVIL, EEE)
  console.log('Seeding 32 more students...');
  const studentSeedProfiles = [
    { name: 'Ananya Sharma', email: 'ananya.sharma@erp.edu', roll: '22CS002', branch: 'CSE', batch: 2022, sem: 5, cgpa: 9.30, backlogs: 0, skills: ['Python', 'Machine Learning', 'TensorFlow', 'Data Science', 'SQL'] },
    { name: 'Aditya Verma', email: 'aditya.verma@erp.edu', roll: '22CS003', branch: 'CSE', batch: 2022, sem: 5, cgpa: 8.45, backlogs: 0, skills: ['Java', 'Spring Boot', 'Microservices', 'Docker', 'MySQL'] },
    { name: 'Diya Reddy', email: 'diya.reddy@erp.edu', roll: '22CS004', branch: 'CSE', batch: 2022, sem: 5, cgpa: 7.75, backlogs: 1, skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Tailwind CSS'] },
    { name: 'Ishan Iyer', email: 'ishan.iyer@erp.edu', roll: '22CS005', branch: 'CSE', batch: 2022, sem: 5, cgpa: 9.60, backlogs: 0, skills: ['C++', 'Algorithms', 'Competitive Programming', 'Go', 'Linux'] },
    { name: 'Kavya Nair', email: 'kavya.nair@erp.edu', roll: '22CS006', branch: 'CSE', batch: 2022, sem: 5, cgpa: 8.20, backlogs: 0, skills: ['Flutter', 'Android', 'Dart', 'Firebase', 'REST API'] },
    { name: 'Simran Kaur', email: 'simran.kaur@erp.edu', roll: '22CS007', branch: 'CSE', batch: 2022, sem: 5, cgpa: 9.05, backlogs: 0, skills: ['AWS', 'DevOps', 'Docker', 'Kubernetes', 'Python'] },
    { name: 'Rahul Deshmukh', email: 'rahul.deshmukh@erp.edu', roll: '22EC001', branch: 'ECE', batch: 2022, sem: 5, cgpa: 7.90, backlogs: 0, skills: ['Embedded Systems', 'VLSI', 'Verilog', 'Arduino', 'C'] },
    { name: 'Sneha Kulkarni', email: 'sneha.kulkarni@erp.edu', roll: '22EC002', branch: 'ECE', batch: 2022, sem: 5, cgpa: 8.65, backlogs: 0, skills: ['MATLAB', 'Signals and Systems', 'Python', 'Digital Electronics'] },
    { name: 'Rohan Nambiar', email: 'rohan.nambiar@erp.edu', roll: '22EC003', branch: 'ECE', batch: 2022, sem: 5, cgpa: 6.85, backlogs: 1, skills: ['Microcontrollers', 'Raspberry Pi', 'IoT', 'C++'] },
    { name: 'Pooja Hegde EC', email: 'pooja.ec@erp.edu', roll: '22EC004', branch: 'ECE', batch: 2022, sem: 5, cgpa: 8.95, backlogs: 0, skills: ['VLSI', 'Cadence', 'Semiconductors', 'VHDL'] },
    { name: 'Arjun Mehta', email: 'arjun.mehta@erp.edu', roll: '22ME001', branch: 'MECH', batch: 2022, sem: 5, cgpa: 7.40, backlogs: 1, skills: ['AutoCAD', 'SolidWorks', 'ANSYS', 'Thermodynamics'] },
    { name: 'Priya Sundaram', email: 'priya.sundaram@erp.edu', roll: '22ME002', branch: 'MECH', batch: 2022, sem: 5, cgpa: 8.35, backlogs: 0, skills: ['Robotics', 'MATLAB', 'Manufacturing', 'CATIA'] },
    { name: 'Nikhil Joshi', email: 'nikhil.joshi@erp.edu', roll: '22ME003', branch: 'MECH', batch: 2022, sem: 5, cgpa: 6.95, backlogs: 2, skills: ['SolidWorks', 'Mechatronics', 'Fluid Mechanics'] },
    { name: 'Tanvi Bhat', email: 'tanvi.bhat@erp.edu', roll: '22IT001', branch: 'IT', batch: 2022, sem: 5, cgpa: 8.80, backlogs: 0, skills: ['JavaScript', 'Node.js', 'React', 'MongoDB', 'Cloud Computing'] },
    { name: 'Varun Kapoor', email: 'varun.kapoor@erp.edu', roll: '22IT002', branch: 'IT', batch: 2022, sem: 5, cgpa: 8.10, backlogs: 0, skills: ['Cybersecurity', 'Ethical Hacking', 'Networking', 'Linux', 'Python'] },
    { name: 'Meera Sen', email: 'meera.sen@erp.edu', roll: '22IT003', branch: 'IT', batch: 2022, sem: 5, cgpa: 9.15, backlogs: 0, skills: ['Deep Learning', 'PyTorch', 'Data Science', 'SQL', 'NLP'] },
    { name: 'Siddharth Rao', email: 'siddharth.rao@erp.edu', roll: '22CV001', branch: 'CIVIL', batch: 2022, sem: 5, cgpa: 7.55, backlogs: 0, skills: ['AutoCAD', 'STAAD Pro', 'Structural Analysis', 'Surveying'] },
    { name: 'Neha Agarwal', email: 'neha.agarwal@erp.edu', roll: '22CV002', branch: 'CIVIL', batch: 2022, sem: 5, cgpa: 8.40, backlogs: 0, skills: ['Revit', 'GIS', 'Project Management', 'Hydraulics'] },
    { name: 'Karthik Menon', email: 'karthik.menon@erp.edu', roll: '22EE001', branch: 'EEE', batch: 2022, sem: 5, cgpa: 7.65, backlogs: 1, skills: ['Power Systems', 'MATLAB', 'PLC', 'SCADA', 'Electrical Machines'] },
    { name: 'Riya Mukherjee', email: 'riya.mukherjee@erp.edu', roll: '22EE002', branch: 'EEE', batch: 2022, sem: 5, cgpa: 8.70, backlogs: 0, skills: ['Control Systems', 'Power Electronics', 'Smart Grids', 'Renewable Energy'] },
    { name: 'Abhinav Gupta', email: 'abhinav.gupta@erp.edu', roll: '23CS001', branch: 'CSE', batch: 2023, sem: 3, cgpa: 8.90, backlogs: 0, skills: ['Java', 'Data Structures', 'Web Development', 'SQL'] },
    { name: 'Shreya Pillai', email: 'shreya.pillai@erp.edu', roll: '23CS002', branch: 'CSE', batch: 2023, sem: 3, cgpa: 9.40, backlogs: 0, skills: ['Python', 'React', 'Node.js', 'Machine Learning'] },
    { name: 'Manasvi Chawla', email: 'manasvi.chawla@erp.edu', roll: '23CS003', branch: 'CSE', batch: 2023, sem: 3, cgpa: 7.30, backlogs: 1, skills: ['C++', 'HTML', 'CSS', 'JavaScript'] },
    { name: 'Yash Singhal', email: 'yash.singhal@erp.edu', roll: '23EC001', branch: 'ECE', batch: 2023, sem: 3, cgpa: 8.20, backlogs: 0, skills: ['Arduino', 'C', 'Digital Electronics', 'IoT'] },
    { name: 'Aishwarya Das', email: 'aishwarya.das@erp.edu', roll: '23EC002', branch: 'ECE', batch: 2023, sem: 3, cgpa: 8.75, backlogs: 0, skills: ['Signals & Systems', 'Python', 'VLSI'] },
    { name: 'Gaurav Pandey', email: 'gaurav.pandey@erp.edu', roll: '23ME001', branch: 'MECH', batch: 2023, sem: 3, cgpa: 7.15, backlogs: 2, skills: ['AutoCAD', 'Material Science', 'Manufacturing'] },
    { name: 'Divya Chauhan', email: 'divya.chauhan@erp.edu', roll: '23ME002', branch: 'MECH', batch: 2023, sem: 3, cgpa: 8.10, backlogs: 0, skills: ['SolidWorks', 'Thermodynamics', 'Robotics'] },
    { name: 'Harish Ranganathan', email: 'harish.r@erp.edu', roll: '23IT001', branch: 'IT', batch: 2023, sem: 3, cgpa: 8.50, backlogs: 0, skills: ['Python', 'SQL', 'Web Development', 'Git'] },
    { name: 'Swati Mishra', email: 'swati.mishra@erp.edu', roll: '23IT002', branch: 'IT', batch: 2023, sem: 3, cgpa: 9.00, backlogs: 0, skills: ['Data Structures', 'TypeScript', 'Next.js', 'MongoDB'] },
    { name: 'Deepak Varma', email: 'deepak.varma@erp.edu', roll: '23CV001', branch: 'CIVIL', batch: 2023, sem: 3, cgpa: 7.45, backlogs: 0, skills: ['Surveying', 'AutoCAD', 'Concrete Technology'] },
    { name: 'Bhavna Roy', email: 'bhavna.roy@erp.edu', roll: '23EE001', branch: 'EEE', batch: 2023, sem: 3, cgpa: 8.30, backlogs: 0, skills: ['Circuit Theory', 'MATLAB', 'Electrical Machines'] },
    { name: 'Pranav Kothari', email: 'pranav.kothari@erp.edu', roll: '23EE002', branch: 'EEE', batch: 2023, sem: 3, cgpa: 7.95, backlogs: 0, skills: ['Power Electronics', 'Sensors', 'Embedded C'] }
  ];

  const allStudents = [demoStudentUser.student];

  for (const s of studentSeedProfiles) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        password: defaultPasswordHash,
        name: s.name,
        role: 'STUDENT',
        student: {
          create: {
            rollNumber: s.roll,
            branch: s.branch,
            batch: s.batch,
            semester: s.sem,
            cgpa: s.cgpa,
            backlogs: s.backlogs,
            phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
            address: `${Math.floor(10 + Math.random() * 900)}, Park Street, Bengaluru, Karnataka`,
            skills: JSON.stringify(s.skills)
          }
        }
      },
      include: { student: true }
    });
    allStudents.push(user.student);
  }

  // 6. Create 14 More Alumni (Total 15 Alumni)
  console.log('Seeding 14 more alumni...');
  const alumniSeedData = [
    { name: 'Priya Krishnan', email: 'priya.k@alumni.erp.edu', roll: '17EC012', branch: 'ECE', batch: 2017, gradYear: 2021, company: 'Microsoft IDC', role: 'Hardware Engineer II', loc: 'Hyderabad', skills: ['VLSI', 'Verilog', 'ASIC', 'FPGA'], bio: 'Specialist in high-speed hardware architecture.', mentoring: true, areas: ['Hardware Roles', 'VLSI Interviews'] },
    { name: 'Amitav Banerjee', email: 'amitav.b@alumni.erp.edu', roll: '16CS089', branch: 'CSE', batch: 2016, gradYear: 2020, company: 'Amazon India', role: 'Software Development Engineer II', loc: 'Bengaluru', skills: ['AWS', 'Distributed Storage', 'Java', 'NoSQL'], bio: 'Working on core AWS storage infrastructure.', mentoring: true, areas: ['Cloud Systems', 'Amazon Interview Loop'] },
    { name: 'Divya Swaminathan', email: 'divya.s@alumni.erp.edu', roll: '18IT034', branch: 'IT', batch: 2018, gradYear: 2022, company: 'TCS', role: 'Digital Systems Specialist', loc: 'Chennai', skills: ['React', 'Node.js', 'Azure', 'Microservices'], bio: 'Helping enterprises modernize web applications.', mentoring: false, areas: null },
    { name: 'Sandeep Gowda', email: 'sandeep.g@alumni.erp.edu', roll: '15ME022', branch: 'MECH', batch: 2015, gradYear: 2019, company: 'Tesla India', role: 'Mechanical Design Lead', loc: 'Pune', skills: ['SolidWorks', 'Electric Powertrain', 'Thermal Management'], bio: 'Automotive and EV enthusiast.', mentoring: true, areas: ['EV Careers', 'Mechanical Design'] },
    { name: 'Neha Saxena', email: 'neha.saxena@alumni.erp.edu', roll: '17CS044', branch: 'CSE', batch: 2017, gradYear: 2021, company: 'Google India', role: 'Product Manager', loc: 'Bengaluru', skills: ['Product Strategy', 'Data Analytics', 'Agile', 'User Research'], bio: 'Bridging engineering and user experience.', mentoring: true, areas: ['Product Management', 'APM Programs'] },
    { name: 'Arvind Rajan', email: 'arvind.r@alumni.erp.edu', roll: '18EC055', branch: 'ECE', batch: 2018, gradYear: 2022, company: 'Qualcomm', role: 'Firmware Engineer', loc: 'Bengaluru', skills: ['Embedded C', '5G Modem', 'RTOS', 'Linux Kernel'], bio: 'Building low-level wireless protocols.', mentoring: false, areas: null },
    { name: 'Snehal Patil', email: 'snehal.p@alumni.erp.edu', roll: '19IT015', branch: 'IT', batch: 2019, gradYear: 2023, company: 'Zoho Corporation', role: 'Software Developer', loc: 'Chennai', skills: ['Java', 'PostgreSQL', 'SaaS', 'API Development'], bio: 'Building scalable enterprise CRM suites.', mentoring: true, areas: ['Zoho Hiring Process', 'Fullstack Basics'] },
    { name: 'Tarun Bhargava', email: 'tarun.b@alumni.erp.edu', roll: '14CV010', branch: 'CIVIL', batch: 2014, gradYear: 2018, company: 'Larsen & Toubro', role: 'Senior Project Engineer', loc: 'Mumbai', skills: ['Infrastructure', 'BIM', 'Project Management', 'Structural Design'], bio: 'Managing mega metro rail projects.', mentoring: false, areas: null },
    { name: 'Anjali Menon', email: 'anjali.m@alumni.erp.edu', roll: '17CS005', branch: 'CSE', batch: 2017, gradYear: 2021, company: 'Accenture', role: 'Cloud Consultant', loc: 'Gurugram', skills: ['AWS', 'Terraform', 'DevOps', 'Security'], bio: 'Consulting Fortune 500 companies on cloud migration.', mentoring: true, areas: ['Consulting Careers', 'Cloud Certifications'] },
    { name: 'Vijay Nair', email: 'vijay.n@alumni.erp.edu', roll: '16EE030', branch: 'EEE', batch: 2016, gradYear: 2020, company: 'Cisco', role: 'Network Automation Specialist', loc: 'Bengaluru', skills: ['Python', 'Networking', 'BGP', 'SDN'], bio: 'Designing resilient enterprise networks.', mentoring: false, areas: null },
    { name: 'Shalini Nambiar', email: 'shalini.n@alumni.erp.edu', roll: '18CS088', branch: 'CSE', batch: 2018, gradYear: 2022, company: 'Adobe India', role: 'Computer Scientist I', loc: 'Noida', skills: ['C++', 'Computer Graphics', 'Machine Learning', 'Algorithms'], bio: 'Working on next-generation creative tools.', mentoring: true, areas: ['Competitive Coding', 'Adobe Hiring'] },
    { name: 'Harish Kumar', email: 'harish.k@alumni.erp.edu', roll: '17CS067', branch: 'CSE', batch: 2017, gradYear: 2021, company: 'Uber', role: 'Backend Engineer II', loc: 'Hyderabad', skills: ['Go', 'Kafka', 'Microservices', 'Distributed Systems'], bio: 'Scaling high throughput dispatch systems.', mentoring: true, areas: ['High Scale Backends', 'Uber Prep'] },
    { name: 'Ritu Chawla', email: 'ritu.c@alumni.erp.edu', roll: '15EC029', branch: 'ECE', batch: 2015, gradYear: 2019, company: 'Intel India', role: 'SoC Design Engineer', loc: 'Bengaluru', skills: ['SystemVerilog', 'UVM', 'Computer Architecture'], bio: 'Working on cutting-edge Intel processor silicon.', mentoring: false, areas: null },
    { name: 'Kunal Shah', email: 'kunal.s@alumni.erp.edu', roll: '16ME041', branch: 'MECH', batch: 2016, gradYear: 2020, company: 'Deloitte', role: 'Operations & Strategy Consultant', loc: 'Bengaluru', skills: ['Supply Chain', 'Strategy', 'Analytics', 'Power BI'], bio: 'From Mechanical Engineering to Tier-1 Management Consulting.', mentoring: true, areas: ['Transition to Consulting', 'MBA Preparation'] }
  ];

  const allAlumni = [demoAlumniUser.alumni];

  for (const a of alumniSeedData) {
    const user = await prisma.user.create({
      data: {
        email: a.email,
        password: defaultPasswordHash,
        name: a.name,
        role: 'ALUMNI',
        alumni: {
          create: {
            rollNumber: a.roll,
            branch: a.branch,
            batch: a.batch,
            graduationYear: a.gradYear,
            currentCompany: a.company,
            currentRole: a.role,
            location: a.loc,
            linkedin: `https://linkedin.com/in/${a.name.toLowerCase().replace(/ /g, '')}`,
            skills: JSON.stringify(a.skills),
            bio: a.bio,
            offersmentoring: a.mentoring,
            mentoringAreas: a.areas ? JSON.stringify(a.areas) : null,
            availability: a.mentoring ? 'Weekends 2 PM - 5 PM' : null,
            isVerified: true
          }
        }
      },
      include: { alumni: true }
    });
    allAlumni.push(user.alumni);
  }

  // 7. Seed 52 Books across Indian academic categories
  console.log('Seeding 52 academic books and copies...');
  const booksData = [
    // Computer Science (14)
    { title: 'Introduction to Algorithms (CLRS)', author: 'Thomas H. Cormen, Charles Leiserson, Ronald Rivest, Clifford Stein', isbn: '978-0262033848', category: 'Computer Science', publisher: 'MIT Press / PHI', edition: '3rd Edition', shelf: 'CS-A1-01' },
    { title: 'Computer Networks', author: 'Andrew S. Tanenbaum, David J. Wetherall', isbn: '978-0132126953', category: 'Computer Science', publisher: 'Pearson India', edition: '5th Edition', shelf: 'CS-A1-02' },
    { title: 'Database System Concepts', author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan', isbn: '978-0078022159', category: 'Computer Science', publisher: 'McGraw-Hill India', edition: '7th Edition', shelf: 'CS-A2-01' },
    { title: 'Operating System Concepts', author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne', isbn: '978-1118063330', category: 'Computer Science', publisher: 'Wiley India', edition: '9th Edition', shelf: 'CS-A2-02' },
    { title: 'Software Engineering: A Practitioner Approach', author: 'Roger S. Pressman, Bruce R. Maxim', isbn: '978-0078022128', category: 'Computer Science', publisher: 'McGraw-Hill', edition: '8th Edition', shelf: 'CS-A3-01' },
    { title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', isbn: '978-0132350884', category: 'Computer Science', publisher: 'Prentice Hall', edition: '1st Edition', shelf: 'CS-A3-02' },
    { title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', isbn: '978-0201633610', category: 'Computer Science', publisher: 'Addison-Wesley', edition: '1st Edition', shelf: 'CS-A4-01' },
    { title: 'Introduction to Automata Theory, Languages, and Computation', author: 'John E. Hopcroft, Rajeev Motwani, Jeffrey D. Ullman', isbn: '978-0321455369', category: 'Computer Science', publisher: 'Pearson India', edition: '3rd Edition', shelf: 'CS-A4-02' },
    { title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell, Peter Norvig', isbn: '978-0136042594', category: 'Computer Science', publisher: 'Pearson India', edition: '4th Edition', shelf: 'CS-B1-01' },
    { title: 'Computer Organization and Design (RISC-V Edition)', author: 'David A. Patterson, John L. Hennessy', isbn: '978-0128122754', category: 'Computer Science', publisher: 'Morgan Kaufmann', edition: '2nd Edition', shelf: 'CS-B1-02' },
    { title: 'Java: The Complete Reference', author: 'Herbert Schildt', isbn: '978-1260440232', category: 'Computer Science', publisher: 'McGraw-Hill Education', edition: '11th Edition', shelf: 'CS-B2-01' },
    { title: 'Let Us C', author: 'Yashavant Kanetkar', isbn: '978-8183331630', category: 'Computer Science', publisher: 'BPB Publications', edition: '17th Edition', shelf: 'CS-B2-02' },
    { title: 'Python Programming Using Problem Solving Approach', author: 'Reema Thareja', isbn: '978-0199480176', category: 'Computer Science', publisher: 'Oxford University Press', edition: '1st Edition', shelf: 'CS-B3-01' },
    { title: 'Compilers: Principles, Techniques, and Tools (Dragon Book)', author: 'Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman', isbn: '978-0321486813', category: 'Computer Science', publisher: 'Pearson India', edition: '2nd Edition', shelf: 'CS-B3-02' },

    // Electronics & Communication (10)
    { title: 'Microelectronic Circuits: Theory and Applications', author: 'Adel S. Sedra, Kenneth C. Smith', isbn: '978-0199460024', category: 'Electronics', publisher: 'Oxford University Press', edition: '7th Edition', shelf: 'EC-A1-01' },
    { title: 'Electronic Devices and Circuit Theory', author: 'Robert L. Boylestad, Louis Nashelsky', isbn: '978-0132622264', category: 'Electronics', publisher: 'Pearson India', edition: '11th Edition', shelf: 'EC-A1-02' },
    { title: 'Integrated Electronics', author: 'Jacob Millman, Christos C. Halkias', isbn: '978-0074622452', category: 'Electronics', publisher: 'Tata McGraw-Hill', edition: '2nd Edition', shelf: 'EC-A2-01' },
    { title: 'Signals and Systems', author: 'Alan V. Oppenheim, Alan S. Willsky, S. Hamid Nawab', isbn: '978-0138147570', category: 'Electronics', publisher: 'Pearson India', edition: '2nd Edition', shelf: 'EC-A2-02' },
    { title: 'Digital Logic and Computer Design', author: 'M. Morris Mano', isbn: '978-9332542525', category: 'Electronics', publisher: 'Pearson Education', edition: '1st Edition', shelf: 'EC-A3-01' },
    { title: 'Communication Systems', author: 'Simon Haykin, Michael Moher', isbn: '978-0471697909', category: 'Electronics', publisher: 'Wiley India', edition: '5th Edition', shelf: 'EC-A3-02' },
    { title: 'Microprocessor Architecture, Programming, and Applications with the 8085', author: 'Ramesh S. Gaonkar', isbn: '978-8187972884', category: 'Electronics', publisher: 'Penram International', edition: '6th Edition', shelf: 'EC-B1-01' },
    { title: 'Basic VLSI Design', author: 'Douglas A. Pucknell, Kamran Eshraghian', isbn: '978-8120309869', category: 'Electronics', publisher: 'Prentice Hall of India', edition: '3rd Edition', shelf: 'EC-B1-02' },
    { title: 'Control Systems Engineering', author: 'I.J. Nagrath, M. Gopal', isbn: '978-8122420081', category: 'Electronics', publisher: 'New Age International', edition: '5th Edition', shelf: 'EC-B2-01' },
    { title: 'Elements of Electromagnetics', author: 'Matthew N.O. Sadiku', isbn: '978-0199321384', category: 'Electronics', publisher: 'Oxford University Press', edition: '6th Edition', shelf: 'EC-B2-02' },

    // Mathematics (8)
    { title: 'Higher Engineering Mathematics', author: 'Dr. B.S. Grewal', isbn: '978-8174091955', category: 'Mathematics', publisher: 'Khanna Publishers', edition: '44th Edition', shelf: 'MATH-A1-01' },
    { title: 'Advanced Engineering Mathematics', author: 'Erwin Kreyszig', isbn: '978-0470458365', category: 'Mathematics', publisher: 'Wiley India', edition: '10th Edition', shelf: 'MATH-A1-02' },
    { title: 'Discrete Mathematical Structures with Applications to Computer Science', author: 'J.P. Tremblay, R. Manohar', isbn: '978-0074631133', category: 'Mathematics', publisher: 'Tata McGraw-Hill', edition: '1st Edition', shelf: 'MATH-A2-01' },
    { title: 'Introduction to Linear Algebra', author: 'Gilbert Strang', isbn: '978-0980232776', category: 'Mathematics', publisher: 'Wellesley-Cambridge Press', edition: '5th Edition', shelf: 'MATH-A2-02' },
    { title: 'Probability and Statistics for Engineers and Scientists', author: 'Ronald E. Walpole, Raymond H. Myers', isbn: '978-0321629111', category: 'Mathematics', publisher: 'Pearson India', edition: '9th Edition', shelf: 'MATH-B1-01' },
    { title: 'Differential Equations', author: 'Shepley L. Ross', isbn: '978-8126515370', category: 'Mathematics', publisher: 'John Wiley & Sons', edition: '3rd Edition', shelf: 'MATH-B1-02' },
    { title: 'Numerical Methods for Scientific and Engineering Computation', author: 'M.K. Jain, S.R.K. Iyengar, R.K. Jain', isbn: '978-8122420012', category: 'Mathematics', publisher: 'New Age International', edition: '6th Edition', shelf: 'MATH-B2-01' },
    { title: 'Calculus and Analytic Geometry', author: 'George B. Thomas, Ross L. Finney', isbn: '978-8177583250', category: 'Mathematics', publisher: 'Pearson India', edition: '9th Edition', shelf: 'MATH-B2-02' },

    // Physics (6)
    { title: 'Concepts of Physics (Part 1)', author: 'Dr. H.C. Verma', isbn: '978-8177091878', category: 'Physics', publisher: 'Bharati Bhawan', edition: '2020 Edition', shelf: 'PHY-A1-01' },
    { title: 'Concepts of Physics (Part 2)', author: 'Dr. H.C. Verma', isbn: '978-8177092325', category: 'Physics', publisher: 'Bharati Bhawan', edition: '2020 Edition', shelf: 'PHY-A1-02' },
    { title: 'Engineering Physics', author: 'R.K. Gaur, S.L. Gupta', isbn: '978-8174090132', category: 'Physics', publisher: 'Dhanpat Rai Publications', edition: '8th Edition', shelf: 'PHY-A2-01' },
    { title: 'Fundamentals of Physics', author: 'David Halliday, Robert Resnick, Jearl Walker', isbn: '978-1118230718', category: 'Physics', publisher: 'Wiley India', edition: '10th Edition', shelf: 'PHY-A2-02' },
    { title: 'Introduction to Solid State Physics', author: 'Charles Kittel', isbn: '978-0471415268', category: 'Physics', publisher: 'Wiley India', edition: '8th Edition', shelf: 'PHY-B1-01' },
    { title: 'Optics', author: 'Ajoy Ghatak', isbn: '978-1259004346', category: 'Physics', publisher: 'McGraw-Hill India', edition: '6th Edition', shelf: 'PHY-B1-02' },

    // Management & Business (7)
    { title: 'Principles of Management', author: 'Harold Koontz, Heinz Weihrich', isbn: '978-0070682139', category: 'Management', publisher: 'Tata McGraw-Hill', edition: '9th Edition', shelf: 'MGMT-A1-01' },
    { title: 'Marketing Management: An Indian Perspective', author: 'Philip Kotler, Kevin Lane Keller, Abraham Koshy, Mithileshwar Jha', isbn: '978-8131716830', category: 'Management', publisher: 'Pearson India', edition: '14th Edition', shelf: 'MGMT-A1-02' },
    { title: 'Financial Management: Theory and Practice', author: 'Prasanna Chandra', isbn: '978-9353166526', category: 'Management', publisher: 'McGraw-Hill Education', edition: '10th Edition', shelf: 'MGMT-A2-01' },
    { title: 'Organizational Behavior', author: 'Stephen P. Robbins, Timothy A. Judge', isbn: '978-0136124016', category: 'Management', publisher: 'Pearson India', edition: '18th Edition', shelf: 'MGMT-A2-02' },
    { title: 'Human Resource Management', author: 'Gary Dessler, Biju Varkkey', isbn: '978-9353066499', category: 'Management', publisher: 'Pearson India', edition: '16th Edition', shelf: 'MGMT-B1-01' },
    { title: 'Competitive Strategy: Techniques for Analyzing Industries', author: 'Michael E. Porter', isbn: '978-0684841489', category: 'Management', publisher: 'Free Press', edition: '1st Edition', shelf: 'MGMT-B1-02' },
    { title: 'Operations Management: Sustainability and Supply Chain', author: 'Jay Heizer, Barry Render, Chuck Munson', isbn: '978-0134130422', category: 'Management', publisher: 'Pearson', edition: '12th Edition', shelf: 'MGMT-B2-01' },

    // Literature & Humanities (7)
    { title: 'Wings of Fire: An Autobiography', author: 'A.P.J. Abdul Kalam, Arun Tiwari', isbn: '978-8173711466', category: 'Literature', publisher: 'Universities Press', edition: '1st Edition', shelf: 'LIT-A1-01' },
    { title: 'The Discovery of India', author: 'Jawaharlal Nehru', isbn: '978-0143031031', category: 'Literature', publisher: 'Penguin India', edition: 'Centenary Edition', shelf: 'LIT-A1-02' },
    { title: 'High School English Grammar and Composition', author: 'P.C. Wren, H. Martin', isbn: '978-9352530144', category: 'Literature', publisher: 'S. Chand Publishing', edition: 'Revised Edition', shelf: 'LIT-A2-01' },
    { title: 'Technical Communication: Principles and Practice', author: 'Meenakshi Raman, Sangeeta Sharma', isbn: '978-0199457499', category: 'Literature', publisher: 'Oxford University Press', edition: '3rd Edition', shelf: 'LIT-A2-02' },
    { title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey', isbn: '978-1471131820', category: 'Literature', publisher: 'Simon & Schuster', edition: '30th Anniversary', shelf: 'LIT-B1-01' },
    { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '978-0374533557', category: 'Literature', publisher: 'Farrar, Straus and Giroux', edition: '1st Edition', shelf: 'LIT-B1-02' },
    { title: 'The Alchemist', author: 'Paulo Coelho', isbn: '978-8172234980', category: 'Literature', publisher: 'HarperCollins India', edition: '25th Anniversary', shelf: 'LIT-B2-01' }
  ];

  let barcodeCounter = 1;
  const createdBooks = [];
  const allCopies = [];

  for (const b of booksData) {
    const copiesCount = (barcodeCounter % 2 === 0) ? 3 : 2; // alternate 2 or 3 copies
    const book = await prisma.book.create({
      data: {
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        category: b.category,
        publisher: b.publisher,
        edition: b.edition,
        language: 'English',
        shelfLocation: b.shelf,
        totalCopies: copiesCount
      }
    });
    createdBooks.push(book);

    for (let c = 1; c <= copiesCount; c++) {
      const barcode = `BC${String(barcodeCounter).padStart(4, '0')}`;
      barcodeCounter++;
      const copy = await prisma.bookCopy.create({
        data: {
          bookId: book.id,
          barcode,
          status: 'AVAILABLE',
          condition: 'GOOD',
          acquisitionDate: new Date('2023-08-01')
        }
      });
      allCopies.push({ copy, book });
    }
  }

  // 8. Create at least 22 Book Issues (Current, Overdue, Returned)
  console.log('Seeding 22+ book issues and fines...');
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // 8a. 10 Active, Non-Overdue Issues
  for (let i = 0; i < 10; i++) {
    const student = allStudents[i % allStudents.length];
    const copyObj = allCopies[i];
    const issuedAt = new Date(now.getTime() - (i + 1) * dayMs);
    const dueDate = new Date(issuedAt.getTime() + 14 * dayMs);

    await prisma.bookIssue.create({
      data: {
        bookCopyId: copyObj.copy.id,
        studentId: student.id,
        issuedAt,
        dueDate,
        issuedById: librarianUser.id
      }
    });

    await prisma.bookCopy.update({
      where: { id: copyObj.copy.id },
      data: { status: 'ISSUED' }
    });
  }

  // 8b. 6 Active, Overdue Issues (Due in the past)
  for (let i = 10; i < 16; i++) {
    const student = allStudents[i % allStudents.length];
    const copyObj = allCopies[i];
    const daysAgo = 20 + (i - 10) * 3;
    const issuedAt = new Date(now.getTime() - daysAgo * dayMs);
    const dueDate = new Date(issuedAt.getTime() + 14 * dayMs); // overdue by (daysAgo - 14) days

    const issue = await prisma.bookIssue.create({
      data: {
        bookCopyId: copyObj.copy.id,
        studentId: student.id,
        issuedAt,
        dueDate,
        issuedById: librarianUser.id
      }
    });

    await prisma.bookCopy.update({
      where: { id: copyObj.copy.id },
      data: { status: 'ISSUED' }
    });

    // Unpaid fine for overdue issue
    const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / dayMs);
    await prisma.fine.create({
      data: {
        bookIssueId: issue.id,
        studentId: student.id,
        amount: daysOverdue * 2,
        daysOverdue,
        isPaid: false
      }
    });
  }

  // 8c. 6 Returned Issues (Some on time, some late with paid/waived fines)
  for (let i = 16; i < 22; i++) {
    const student = allStudents[i % allStudents.length];
    const copyObj = allCopies[i];
    const issuedAt = new Date(now.getTime() - 40 * dayMs);
    const dueDate = new Date(issuedAt.getTime() + 14 * dayMs);
    const returnedAt = new Date(issuedAt.getTime() + (10 + (i - 16) * 4) * dayMs);

    const issue = await prisma.bookIssue.create({
      data: {
        bookCopyId: copyObj.copy.id,
        studentId: student.id,
        issuedAt,
        dueDate,
        returnedAt,
        issuedById: librarianUser.id,
        returnedById: librarianUser.id
      }
    });

    // If returned late, create fine
    if (returnedAt > dueDate) {
      const daysOverdue = Math.ceil((returnedAt.getTime() - dueDate.getTime()) / dayMs);
      const isPaid = (i % 2 === 0);
      await prisma.fine.create({
        data: {
          bookIssueId: issue.id,
          studentId: student.id,
          amount: daysOverdue * 2,
          daysOverdue,
          isPaid,
          paidAt: isPaid ? new Date(returnedAt.getTime() + 1 * dayMs) : null,
          isWaived: !isPaid,
          waivedAt: !isPaid ? new Date(returnedAt.getTime() + 1 * dayMs) : null,
          waivedById: !isPaid ? librarianUser.id : null,
          receiptNumber: isPaid ? `RCPT-2024-${8000 + i}` : null
        }
      });
    }
  }

  // 9. Create 6 Reservations in queue
  console.log('Seeding reservations...');
  const resBooks = [createdBooks[0], createdBooks[5], createdBooks[10]];
  for (let r = 0; r < 6; r++) {
    const book = resBooks[r % resBooks.length];
    const student = allStudents[(r + 5) % allStudents.length];
    const queuePos = Math.floor(r / resBooks.length) + 1;

    await prisma.reservation.create({
      data: {
        bookId: book.id,
        studentId: student.id,
        queuePosition: queuePos,
        status: r === 0 ? 'NOTIFIED' : 'PENDING',
        notifiedAt: r === 0 ? now : null,
        expiresAt: r === 0 ? new Date(now.getTime() + 48 * 60 * 60 * 1000) : null
      }
    });
  }

  // 10. Seed 5 Digital Resources
  console.log('Seeding digital resources...');
  const digitalResources = [
    { title: 'Machine Learning Algorithms & Implementations Handbook', author: 'Dr. Andrew Ng, Stanford AI Lab', category: 'Computer Science', type: 'EBOOK', fileUrl: '/uploads/digital/ml-handbook.pdf', fileSize: 15420000, description: 'Comprehensive guide covering supervised and unsupervised ML.' },
    { title: 'IEEE Transactions on VLSI Systems (Special 2024 Issue)', author: 'IEEE Circuits & Systems Society', category: 'Electronics', type: 'JOURNAL', fileUrl: '/uploads/digital/ieee-vlsi-2024.pdf', fileSize: 8900000, description: 'Peer-reviewed research on FinFET, sub-nanometer logic and cryogenic circuits.' },
    { title: 'Discrete Mathematics and Graph Theory Lecture Series', author: 'MIT OpenCourseWare', category: 'Mathematics', type: 'PAPER', fileUrl: '/uploads/digital/discrete-math-notes.pdf', fileSize: 6200000, description: 'Complete reference notes for combinatorics, recurrence, and trees.' },
    { title: 'Quantum Mechanics for Semiconductor Engineers', author: 'Prof. David Miller', category: 'Physics', type: 'EBOOK', fileUrl: '/uploads/digital/quantum-semiconductors.pdf', fileSize: 12400000, description: 'Essential quantum physical principles powering modern microelectronics.' },
    { title: 'Harvard Business Review: Tech Startup Case Studies', author: 'Harvard Business Publishing', category: 'Management', type: 'JOURNAL', fileUrl: '/uploads/digital/hbr-tech-case-studies.pdf', fileSize: 7800000, description: 'Analysis of product-market fit, SaaS unit economics, and hypergrowth.' }
  ];

  for (const dr of digitalResources) {
    await prisma.digitalResource.create({
      data: {
        ...dr,
        uploadedBy: librarianUser.id,
        downloads: Math.floor(10 + Math.random() * 90)
      }
    });
  }

  // 11. Create 15 Placement Drives
  console.log('Seeding 15 placement drives and interview rounds...');
  const drivesData = [
    { comp: 'TCS', role: 'Ninja & Digital Software Engineer', ctc: 7.5, date: '2024-11-15', mode: 'HYBRID', minCgpa: 7.0, maxBacklogs: 0, branches: ['CSE', 'IT', 'ECE'], batch: 2022, status: 'UPCOMING' },
    { comp: 'Infosys', role: 'Specialist Programmer (SP)', ctc: 9.5, date: '2024-11-20', mode: 'ONLINE', minCgpa: 7.5, maxBacklogs: 0, branches: ['CSE', 'IT'], batch: 2022, status: 'UPCOMING' },
    { comp: 'Google India', role: 'Software Engineer - University Graduate', ctc: 32.0, date: '2024-10-30', mode: 'HYBRID', minCgpa: 8.5, maxBacklogs: 0, branches: ['CSE', 'IT', 'ECE'], batch: 2022, status: 'ONGOING' },
    { comp: 'Microsoft IDC', role: 'Software Development Engineer', ctc: 28.5, date: '2024-11-05', mode: 'HYBRID', minCgpa: 8.0, maxBacklogs: 0, branches: ['CSE', 'IT', 'ECE', 'EEE'], batch: 2022, status: 'ONGOING' },
    { comp: 'Amazon India', role: 'SDE-1 (Cloud Services)', ctc: 26.0, date: '2024-09-15', mode: 'OFFLINE', minCgpa: 7.8, maxBacklogs: 0, branches: ['CSE', 'IT'], batch: 2022, status: 'COMPLETED' },
    { comp: 'Wipro Technologies', role: 'Project Engineer - Turbo Stream', ctc: 6.5, date: '2024-09-22', mode: 'ONLINE', minCgpa: 6.5, maxBacklogs: 1, branches: ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'IT'], batch: 2022, status: 'COMPLETED' },
    { comp: 'HCL Technologies', role: 'Graduate Engineer Trainee', ctc: 5.5, date: '2024-12-05', mode: 'OFFLINE', minCgpa: 6.5, maxBacklogs: 1, branches: ['CSE', 'ECE', 'MECH', 'EEE', 'IT'], batch: 2023, status: 'UPCOMING' },
    { comp: 'Accenture India', role: 'Advanced Application Engineering Analyst', ctc: 6.5, date: '2024-09-28', mode: 'HYBRID', minCgpa: 6.8, maxBacklogs: 0, branches: ['CSE', 'IT', 'ECE'], batch: 2022, status: 'COMPLETED' },
    { comp: 'Cognizant', role: 'GenC Elevate Developer', ctc: 5.25, date: '2024-10-05', mode: 'ONLINE', minCgpa: 6.5, maxBacklogs: 1, branches: ['CSE', 'IT', 'ECE', 'EEE'], batch: 2022, status: 'COMPLETED' },
    { comp: 'Zoho Corporation', role: 'Member Technical Staff', ctc: 8.5, date: '2024-11-10', mode: 'OFFLINE', minCgpa: 7.0, maxBacklogs: 0, branches: ['CSE', 'IT', 'ECE'], batch: 2022, status: 'ONGOING' },
    { comp: 'Google India', role: 'Software Engineering Summer Intern', ctc: 15.0, date: '2024-12-15', mode: 'HYBRID', minCgpa: 8.0, maxBacklogs: 0, branches: ['CSE', 'IT'], batch: 2023, status: 'UPCOMING' },
    { comp: 'Microsoft IDC', role: 'Hardware & Silicon Engineer', ctc: 24.0, date: '2024-11-25', mode: 'OFFLINE', minCgpa: 7.5, maxBacklogs: 0, branches: ['ECE', 'EEE'], batch: 2022, status: 'UPCOMING' },
    { comp: 'Amazon India', role: 'Business & Operations Analyst', ctc: 14.5, date: '2024-09-10', mode: 'HYBRID', minCgpa: 7.0, maxBacklogs: 0, branches: ['CSE', 'IT', 'MECH', 'CIVIL'], batch: 2022, status: 'COMPLETED' },
    { comp: 'TCS', role: 'Innovator & Research Scientist', ctc: 11.5, date: '2024-09-18', mode: 'HYBRID', minCgpa: 8.0, maxBacklogs: 0, branches: ['CSE', 'IT'], batch: 2022, status: 'COMPLETED' },
    { comp: 'Zoho Corporation', role: 'UI/UX & Frontend Engineer', ctc: 7.5, date: '2024-12-20', mode: 'OFFLINE', minCgpa: 6.8, maxBacklogs: 0, branches: ['CSE', 'IT', 'ECE'], batch: 2023, status: 'UPCOMING' }
  ];

  const createdDrives = [];

  for (const d of drivesData) {
    const drive = await prisma.placementDrive.create({
      data: {
        companyId: createdCompanies[d.comp].id,
        role: d.role,
        ctc: d.ctc,
        driveDate: new Date(d.date),
        venue: d.mode === 'ONLINE' ? 'Virtual / Microsoft Teams' : 'College Auditorium & Tech Labs',
        mode: d.mode,
        lastDateApply: new Date(new Date(d.date).getTime() - 7 * dayMs),
        minCgpa: d.minCgpa,
        maxBacklogs: d.maxBacklogs,
        allowedBranches: JSON.stringify(d.branches),
        batchYear: d.batch,
        status: d.status,
        description: `Campus recruitment drive for ${d.role} offering ${d.ctc} LPA package.`,
        createdBy: placementUser.id
      }
    });

    // Create interview rounds for each drive
    const r1 = await prisma.interviewRound.create({
      data: {
        driveId: drive.id,
        roundNumber: 1,
        roundType: 'APTITUDE',
        scheduledAt: new Date(new Date(d.date).getTime() + 1 * dayMs),
        venue: 'Computer Lab 3 & 4',
        notes: 'Online cognitive & coding assessment'
      }
    });

    const r2 = await prisma.interviewRound.create({
      data: {
        driveId: drive.id,
        roundNumber: 2,
        roundType: 'TECHNICAL',
        scheduledAt: new Date(new Date(d.date).getTime() + 3 * dayMs),
        venue: 'Interview Cabins Block A',
        notes: 'Deep technical viva and live coding'
      }
    });

    const r3 = await prisma.interviewRound.create({
      data: {
        driveId: drive.id,
        roundNumber: 3,
        roundType: 'HR',
        scheduledAt: new Date(new Date(d.date).getTime() + 5 * dayMs),
        venue: 'Conference Room 1',
        notes: 'Cultural fit and salary discussion'
      }
    });

    createdDrives.push({ drive, rounds: [r1, r2, r3] });
  }

  // 12. Create 45+ Applications with Round Results
  console.log('Seeding 45+ student applications...');
  const appStatuses = ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED', 'OFFER_ACCEPTED'];
  let appCounter = 0;

  for (let dIdx = 0; dIdx < createdDrives.length; dIdx++) {
    const { drive, rounds } = createdDrives[dIdx];
    const targetBatch = drive.batchYear;
    const eligibleStudents = allStudents.filter((s) => s.batch === targetBatch);

    for (let sIdx = 0; sIdx < Math.min(eligibleStudents.length, 6); sIdx++) {
      const student = eligibleStudents[sIdx];
      const status = appStatuses[(appCounter + sIdx) % appStatuses.length];

      const app = await prisma.application.create({
        data: {
          driveId: drive.id,
          studentId: student.id,
          status,
          appliedAt: new Date(drive.createdAt.getTime() + (sIdx + 1) * 3600000)
        }
      });

      // Round results
      if (status !== 'APPLIED') {
        await prisma.roundResult.create({
          data: {
            roundId: rounds[0].id,
            applicationId: app.id,
            status: status === 'REJECTED' ? 'REJECTED' : 'SHORTLISTED',
            feedback: status === 'REJECTED' ? 'Did not clear aptitude cutoff' : 'Scored 92% in technical assessment',
            scheduledAt: rounds[0].scheduledAt
          }
        });
      }

      if (['INTERVIEW_SCHEDULED', 'SELECTED', 'OFFER_ACCEPTED'].includes(status)) {
        await prisma.roundResult.create({
          data: {
            roundId: rounds[1].id,
            applicationId: app.id,
            status: 'SHORTLISTED',
            feedback: 'Excellent problem solving and core CS understanding',
            scheduledAt: rounds[1].scheduledAt
          }
        });
      }

      appCounter++;
    }
  }

  // 13. Create 2 Donation Campaigns
  console.log('Seeding donation campaigns...');
  const campaign1 = await prisma.donationCampaign.create({
    data: {
      title: 'Centenary Robotics & AI Research Lab',
      description: 'Funding next-generation autonomous robotics workbenches and GPU compute clusters for students.',
      goalAmount: 1000000,
      raisedAmount: 385000,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: 'ACTIVE'
    }
  });

  const campaign2 = await prisma.donationCampaign.create({
    data: {
      title: 'Alumni Merit Scholarship for Underprivileged Students',
      description: 'Annual corpus fund supporting tuition and laptop stipends for talented students with financial need.',
      goalAmount: 500000,
      raisedAmount: 260000,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-11-30'),
      status: 'ACTIVE'
    }
  });

  // 14. Create 10 Donations
  console.log('Seeding 10 alumni donations...');
  const donationAmounts = [50000, 25000, 100000, 15000, 75000, 30000, 20000, 60000, 40000, 80000];
  const paymentModes = ['ONLINE', 'ONLINE', 'CHEQUE', 'ONLINE', 'ONLINE', 'DD', 'ONLINE', 'ONLINE', 'ONLINE', 'CHEQUE'];

  for (let i = 0; i < 10; i++) {
    const alumni = allAlumni[i % allAlumni.length];
    const campaign = (i % 2 === 0) ? campaign1 : campaign2;
    await prisma.donation.create({
      data: {
        alumniId: alumni.id,
        amount: donationAmounts[i],
        purpose: campaign.title,
        campaignId: campaign.id,
        paymentMode: paymentModes[i],
        date: new Date(now.getTime() - (i * 7 + 2) * dayMs),
        receiptNumber: `RCPT-2024-${5000 + i}`,
        isPledge: false,
        notes: `Alumni support from ${alumni.currentCompany || 'Batch of ' + alumni.batch}`
      }
    });
  }

  // 15. Create 6 Mentorship Requests and Sessions
  console.log('Seeding mentorship requests...');
  const mentorAlumni = allAlumni.filter((a) => a.offersmentoring);
  for (let m = 0; m < 5; m++) {
    const alumni = mentorAlumni[m % mentorAlumni.length];
    const student = allStudents[m % allStudents.length];
    const req = await prisma.mentorshipRequest.create({
      data: {
        alumniId: alumni.id,
        studentId: student.id,
        message: `Hello Sir/Ma'am, I am a ${student.branch} student looking for guidance in ${student.branch === 'CSE' ? 'Software Engineering & System Design' : 'core industry career paths'}.`,
        status: m % 2 === 0 ? 'ACCEPTED' : 'PENDING',
        areas: JSON.stringify(['Interview Prep', 'Resume Review', 'Career Roadmap']),
        respondedAt: m % 2 === 0 ? now : null
      }
    });

    if (m % 2 === 0) {
      await prisma.mentorSession.create({
        data: {
          requestId: req.id,
          scheduledAt: new Date(now.getTime() + (m + 2) * dayMs),
          notes: 'Mock technical coding interview and portfolio discussion',
          status: 'SCHEDULED'
        }
      });
    }
  }

  // 16. Seed Parsed Resume for Demo Student
  console.log('Seeding parsed resume...');
  await prisma.parsedResume.create({
    data: {
      studentId: demoStudentUser.student.id,
      name: 'Aarav Patel',
      email: 'student@erp.edu',
      phone: '+91 98765 43210',
      skills: JSON.stringify(['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'Python', 'SQL', 'Git', 'Docker']),
      education: JSON.stringify(['B.Tech in Computer Science - Kirti College (2022-2026, CGPA: 8.85)', 'Senior Secondary (CBSE) - 94.2%']),
      experience: JSON.stringify(['Web Development Intern at TechStart (May 2024 - July 2024)', 'Fullstack E-Commerce Project with React & Express']),
      isConfirmed: true,
      rawText: 'Aarav Patel | Bangalore, India | student@erp.edu | 9876543210\nEducation: B.Tech in Computer Science\nSkills: React, Node.js, Express, Python, SQL, Docker'
    }
  });

  // 17. Seed Notifications
  console.log('Seeding notifications...');
  await prisma.notification.create({
    data: {
      userId: demoStudentUser.id,
      title: 'Welcome to Kirti College ERP',
      message: 'Your student portal is fully set up. Check Library and Placement modules.',
      type: 'INFO',
      link: '/dashboard'
    }
  });

  await prisma.notification.create({
    data: {
      userId: demoStudentUser.id,
      title: 'Placement Drive Scheduled',
      message: 'Google India software engineering drive is open for eligible applications.',
      type: 'SUCCESS',
      link: '/placement/my-applications'
    }
  });

  // 18. Seed Audit Logs
  console.log('Seeding audit logs...');
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_SEED',
      entity: 'System',
      entityId: 'ROOT',
      meta: JSON.stringify({ message: 'College ERP database successfully seeded with demo dataset.' })
    }
  });

  console.log('--- College ERP Seed Complete! ---');
  console.log('Demo Credentials (Password: Password@123):');
  console.log('- Admin: admin@erp.edu');
  console.log('- Librarian: librarian@erp.edu');
  console.log('- Student: student@erp.edu');
  console.log('- Placement Officer: placement@erp.edu');
  console.log('- Company: company@erp.edu');
  console.log('- Alumni: alumni@erp.edu');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
