import type { Audience } from "@/lib/store";

export const business = {
  name: "TalentYug Pvt. Ltd.",
  email: "connect@talentyug.in",
  phone: "+91 82105 97576",
  phoneHref: "tel:+918210597576",
  location: "Bihar, India",
  linkedIn: "https://www.linkedin.com/company/talentyug-private-limited/",
  instagram: "https://www.instagram.com/talentyug.in",
} as const;

export const audiences: {
  id: Audience;
  number: string;
  label: string;
  title: string;
  description: string;
  features: string[];
  action: string;
}[] = [
  {
    id: "college",
    number: "01",
    label: "FOR COLLEGES",
    title: "Your students.\nOur shared responsibility.",
    description:
      "Give your placement team a committed partner, and your students a structured bridge to the working world.",
    features: [
      "Career readiness programmes",
      "Campus drives & recruiter outreach",
      "Student progress & reporting",
    ],
    action: "Partner with TalentYug",
  },
  {
    id: "student",
    number: "02",
    label: "FOR STUDENTS",
    title: "You bring the ambition.\nWe help with the direction.",
    description:
      "Discover where you fit, build skills that matter, and show up for your next opportunity with confidence.",
    features: [
      "Mentorship & career discovery",
      "Projects, résumés & mock interviews",
      "Internship & career opportunities",
    ],
    action: "Start your career journey",
  },
  {
    id: "company",
    number: "03",
    label: "FOR COMPANIES",
    title: "Meet potential.\nHire with perspective.",
    description:
      "Connect with emerging talent through skill assessments, coordinated interviews, and deeper campus access.",
    features: [
      "Assessed & screened candidates",
      "Access to campus talent",
      "Interview & hiring coordination",
    ],
    action: "Connect with talent",
  },
];

export const phases = [
  {
    number: "01",
    title: "Discover & develop",
    label: "BUILD THE FOUNDATION",
    text: "Understand strengths, identify skill gaps, and build a practical plan through career guidance and industry-oriented training.",
    tags: ["Student profiling", "Skill development"],
  },
  {
    number: "02",
    title: "Practise & prove",
    label: "TURN LEARNING INTO EVIDENCE",
    text: "Create projects, strengthen communication, and test readiness with assessments, résumé support, and mock interviews.",
    tags: ["Projects & portfolios", "Hiring preparation"],
  },
  {
    number: "03",
    title: "Connect & progress",
    label: "TAKE THE NEXT STEP",
    text: "Meet relevant employers through industry connections, internship opportunities, and coordinated campus recruitment.",
    tags: ["Industry connect", "Campus drives"],
  },
];

export const faqs = [
  {
    question: "What is the Campus-to-Company programme?",
    answer:
      "A three-month partnership between TalentYug and a college. It connects student development, industry exposure, screening, hiring preparation, and campus-drive coordination into one structured journey. The final delivery schedule is agreed with the institution.",
  },
  {
    question: "How can I find out the programme pricing?",
    answer:
      "Please enquire with our team for college partnership and student participation pricing. Institutional support includes programme coordination, recruiter outreach, campus-drive management, dashboard access, and reporting. Student career access covers screening, training, projects, assessments, résumé preparation, and mock interviews. Your written proposal will set out the full scope, applicable fees and taxes, and payment terms before you decide.",
  },
  {
    question: "Does TalentYug guarantee a placement?",
    answer:
      "No. TalentYug provides preparation and access to relevant internship and placement opportunities. Hiring decisions remain with employers and depend on eligibility, performance, and available roles. We focus on helping students become better prepared for those opportunities.",
  },
  {
    question: "Can students connect with TalentYug directly?",
    answer:
      "Yes. Get in touch about career guidance and Pragyan, our student offering focused on discovery, mentorship, preparation, and opportunities. Availability, access, and pricing are confirmed by the TalentYug team. The team will confirm which access option applies to you.",
  },
  {
    question: "How can our company work with TalentYug?",
    answer:
      "Share the roles, skills, and locations you are hiring for. The team can discuss relevant campus access, candidate screening, skill assessments, and interview coordination. Hiring scope and commercial terms are agreed directly.",
  },
  {
    question: "How do we get started?",
    answer:
      "Use the enquiry button to prepare an email for our team, or call +91 82105 97576. Tell us whether you are a student, college, or employer and what you want to achieve. We will discuss the fit, scope, and next steps with you.",
  },
];
