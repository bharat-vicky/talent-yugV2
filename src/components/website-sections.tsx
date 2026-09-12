import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  BookOpen,
  Check,
  Compass,
  FileCheck2,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { AudienceCards } from "@/components/audience-cards";
import { EnquiryButton, EnquiryDialog } from "@/components/enquiry";
import { Faq } from "@/components/faq";
import { ScrollMotion } from "@/components/motion";
import { Brand } from "@/components/site-header";
import { business, phases } from "@/lib/content";

export function WebsiteSections() {
  return (
    <>
      <section id="ecosystem" className="container section ecosystem">
        <div className="section-heading" data-reveal>
          <div>
            <span className="eyebrow">ONE ECOSYSTEM. SHARED AMBITION.</span>
            <h2>
              Different starting points.
              <br />
              <em>One brighter future.</em>
            </h2>
          </div>
          <p>
            For the people learning, the institutions guiding them, and the
            companies ready to welcome new talent.
          </p>
        </div>
        <AudienceCards />
      </section>

      <section id="programme" className="programme">
        <div className="container section">
          <div className="programme-heading" data-reveal>
            <div>
              <span className="eyebrow">
                <span className="eyebrow-line" /> THE CAMPUS-TO-COMPANY
                PROGRAMME
              </span>
              <h2>
                A career takes more
                <br />
                than <em>a placement day.</em>
              </h2>
            </div>
            <div className="programme-heading-aside">
              <span className="duration">
                3{" "}
                <span>
                  months.
                  <br />
                  One connected journey.
                </span>
              </span>
              <p>
                We build employability before we build the hiring funnel. Here’s
                how your students move forward.
              </p>
            </div>
          </div>
          <div className="phase-grid">
            {phases.map((phase) => (
              <article className="phase" key={phase.number} data-reveal>
                <div className="phase-step">
                  <span>{phase.number}</span>
                  <div />
                  <ArrowRight size={18} />
                </div>
                <span className="eyebrow">{phase.label}</span>
                <h3>{phase.title}</h3>
                <p>{phase.text}</p>
                <div className="phase-tags">
                  {phase.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <div className="programme-bottom">
            <span>
              <ShieldCheck size={18} /> Structured support. Transparent
              progress. Human guidance.
            </span>
            <EnquiryButton audience="college" variant="light">
              Bring TalentYug to your campus <ArrowUpRight size={18} />
            </EnquiryButton>
          </div>
        </div>
      </section>

      <section className="container section support">
        <div className="section-heading" data-reveal>
          <div>
            <span className="eyebrow">PREPARATION WITH PURPOSE</span>
            <h2>
              Ready for work.
              <br />
              <em>Ready for what’s next.</em>
            </h2>
          </div>
          <p>
            Skills open doors. Confidence helps you walk through them. Our
            programme makes room for both.
          </p>
        </div>
        <div className="support-grid">
          <article className="support-feature" data-reveal>
            <div className="feature-heading">
              <span className="audience-icon">
                <BookOpen size={24} strokeWidth={1.6} />
              </span>
              <span className="eyebrow">LEARN. APPLY. IMPROVE.</span>
            </div>
            <h3>
              Build something
              <br />
              you can stand behind.
            </h3>
            <p>
              Industry-oriented learning, practical projects, and skill
              assessments help turn knowledge into a portfolio that tells your
              story.
            </p>
            <div className="portfolio-preview" aria-label="Programme areas">
              <div>
                <FileCheck2 size={18} />
                <span>Project & portfolio building</span>
                <Check size={16} />
              </div>
              <div>
                <Users size={18} />
                <span>Communication & soft skills</span>
                <Check size={16} />
              </div>
              <div>
                <Compass size={18} />
                <span>Interview & career preparation</span>
                <Check size={16} />
              </div>
            </div>
          </article>
          <article className="pragyan-card" data-reveal>
            <div className="pragyan-top">
              <span className="eyebrow">MEET YOUR CAREER COMPANION</span>
              <Sparkles size={23} strokeWidth={1.5} />
            </div>
            <div className="pragyan-word">
              pragyan<span> by TalentYug</span>
            </div>
            <h3>
              A little clarity can
              <br />
              change your direction.
            </h3>
            <p>
              Discover your strengths, connect with mentors, and prepare for
              your next step with TalentYug’s student offering.
            </p>
            <div className="pragyan-tags">
              <span>Career discovery</span>
              <span>Mentorship</span>
              <span>Résumé support</span>
              <span>Mock preparation</span>
            </div>
            <EnquiryButton
              audience="student"
              variant="ghost"
              className="card-link"
            >
              Find your direction <ArrowUpRight size={18} />
            </EnquiryButton>
          </article>
        </div>
      </section>

      <section className="investment-section" id="plans">
        <div className="container section">
          <div className="section-heading" data-reveal>
            <div>
              <span className="eyebrow">A SHARED INVESTMENT IN POTENTIAL</span>
              <h2>
                One programme.
                <br />
                <em>A clear starting point.</em>
              </h2>
            </div>
            <p>
              ₹1,00,000 per college, plus ₹999 per participating student. A
              shared investment across the three-month journey.
            </p>
          </div>
          <div className="pricing-grid">
            <article className="price-card" data-reveal>
              <div className="price-heading">
                <span className="eyebrow">INSTITUTIONAL PARTNERSHIP</span>
                <span className="price-tag">For your campus</span>
              </div>
              <div className="price">
                ₹1,00,000<span> / college</span>
              </div>
              <p>A coordinated programme, backed by institutional support.</p>
              <ul>
                {[
                  "Three-month career development programme",
                  "Company outreach & campus drive management",
                  "Student tracking, dashboard access & reporting",
                  "Dedicated support & opportunity coordination",
                ].map((text) => (
                  <li key={text}>
                    <Check size={16} />
                    {text}
                  </li>
                ))}
              </ul>
              <EnquiryButton audience="college" variant="outline">
                Discuss a college partnership <ArrowUpRight size={17} />
              </EnquiryButton>
            </article>
            <article className="price-card student-price" data-reveal>
              <div className="price-heading">
                <span className="eyebrow">STUDENT CAREER ACCESS</span>
                <span className="price-tag">Within the programme</span>
              </div>
              <div className="price">
                ₹999<span> / participating student</span>
              </div>
              <p>Focused preparation for the opportunities ahead.</p>
              <ul>
                {[
                  "Screening, industry training & skill assessments",
                  "Projects, portfolio & résumé development",
                  "Communication skills & mock interviews",
                  "Access to relevant internships & placement opportunities",
                ].map((text) => (
                  <li key={text}>
                    <Check size={16} />
                    {text}
                  </li>
                ))}
              </ul>
              <EnquiryButton audience="student" variant="outline">
                Explore student participation <ArrowUpRight size={17} />
              </EnquiryButton>
            </article>
          </div>
          <p className="pricing-note">
            Indicative pricing from our programme draft. Request a written
            proposal for the final scope, taxes, payment terms, and any
            additional success-linked fees. Opportunities depend on student
            readiness and employer requirements; placement is not guaranteed.
          </p>
        </div>
      </section>

      <section id="story" className="container section story">
        <div className="story-copy" data-reveal>
          <span className="eyebrow">FROM BIHAR. FOR A BIGGER TOMORROW.</span>
          <h2>
            Talent is everywhere.
            <br />
            <em>Opportunity should be, too.</em>
          </h2>
          <p>
            We started TalentYug with a simple belief: where you study should
            not decide how far you can go.
          </p>
          <p>
            Rooted in Bihar, we’re bringing career preparation and industry
            connections closer to students. We work alongside colleges and
            companies to make the path from education to employment more
            connected, more practical, and more human.
          </p>
          <a
            href={business.linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            Get to know TalentYug <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="founder-card" data-reveal>
          <div className="founder-card-top">
            <span className="eyebrow">THE PEOPLE BEHIND THE PURPOSE</span>
            <Asterisk size={39} strokeWidth={1.5} />
          </div>
          <div className="founder-profile">
            <Image
              src="/images/gautam-kumar.jpg"
              width={94}
              height={94}
              alt="Gautam Kumar, founder of TalentYug"
            />
            <div>
              <h3>Gautam Kumar</h3>
              <span>Founder, TalentYug</span>
              <span className="founder-location">
                <MapPin size={12} /> Bihar, India
              </span>
            </div>
          </div>
          <p>
            Building a stronger bridge between the classroom and the working
            world.
          </p>
          <div className="team-line">
            <span>With the TalentYug team</span>
            <strong>
              Hridayanand Gupta <span>·</span> Ritu Raj
            </strong>
          </div>
          <div className="founder-bottom">
            <ShieldCheck size={17} /> TalentYug Pvt. Ltd.{" "}
            <span>People first. Progress together.</span>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="container section faq-layout">
          <div data-reveal>
            <span className="eyebrow">A LITTLE MORE CLARITY</span>
            <h2>
              Good questions.
              <br />
              <em>Honest answers.</em>
            </h2>
            <p>
              Choosing a career partner matters.
              <br />
              Here are a few things worth knowing.
            </p>
            <a className="text-link" href={`mailto:${business.email}`}>
              Ask us something else <ArrowUpRight size={17} />
            </a>
          </div>
          <Faq />
        </div>
      </section>

      <section id="contact" className="container contact-section" data-reveal>
        <div className="contact-panel">
          <div>
            <span className="eyebrow">
              YOUR NEXT CHAPTER IS A CONVERSATION AWAY
            </span>
            <h2>
              Let’s build
              <br />
              <em>what comes next.</em>
            </h2>
            <p>
              A more confident student. A better-connected campus.
              <br />A team’s next great hire. It starts with us talking.
            </p>
            <div className="contact-actions">
              <EnquiryButton variant="light">
                Start a conversation <ArrowUpRight size={18} />
              </EnquiryButton>
              <a href={`mailto:${business.email}`} className="contact-email">
                {business.email} <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
          <div className="contact-flourish" aria-hidden="true">
            <Asterisk strokeWidth={0.8} />
            <span>GROW TOGETHER.</span>
          </div>
        </div>
      </section>
      <EnquiryDialog />
      <ScrollMotion />
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <Brand />
            <p>
              Connecting talent.
              <br />
              Creating futures.
            </p>
            <span>
              <MapPin size={13} /> {business.location}
            </span>
          </div>
          <div className="footer-links">
            <span className="eyebrow">EXPLORE</span>
            <a href="#ecosystem">Who we help</a>
            <a href="#programme">Our programme</a>
            <a href="#story">Our story</a>
            <a href="#plans">Programme plans</a>
          </div>
          <div className="footer-links">
            <span className="eyebrow">LET’S CONNECT</span>
            <a href={`mailto:${business.email}`}>
              <Mail size={14} /> {business.email}
            </a>
            <a href={business.phoneHref}>
              <Phone size={14} /> {business.phone}
            </a>
            <div className="social-links">
              <a
                href={business.linkedIn}
                aria-label="TalentYug on LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin size={17} />
              </a>
              <a
                href={business.instagram}
                aria-label="TalentYug on Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={17} />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} TalentYug Pvt. Ltd. All rights
            reserved.
          </span>
          <span>Rooted in Bihar. Reaching for tomorrow.</span>
          <a href="#main">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
