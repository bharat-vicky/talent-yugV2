import Image from "next/image";
import {
  ArrowUpRight,
  ArrowDown,
  Asterisk,
  Check,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter, WebsiteSections } from "@/components/website-sections";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="hero container">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" /> ROOTED IN BIHAR. BUILT FOR YOUR
              FUTURE.
            </div>
            <h1>
              From campus
              <br />
              to <em>possibility.</em>
            </h1>
            <p className="hero-description">
              Big dreams deserve a real starting point.
              <br className="desktop-break" /> We bring students, colleges, and
              companies together to turn potential into professional journeys.
            </p>
            <div className="hero-actions">
              <Button asChild>
                <a href="#programme">
                  Explore our programme <ArrowUpRight size={18} />
                </a>
              </Button>
              <a className="text-link" href="#ecosystem">
                Find your path <ArrowDown size={16} />
              </a>
            </div>
            <div className="hero-footnote">
              <span className="small-icon">
                <Check size={13} strokeWidth={3} />
              </span>{" "}
              Real preparation. Meaningful connections. A stronger start.
            </div>
          </div>
          <div className="hero-visual">
            <div className="photo-surround">
              <Image
                src="/images/campus-collaboration.webp"
                alt="Illustrative image of students collaborating on a laptop in a bright campus library"
                fill
                priority
                sizes="(max-width: 760px) 100vw, 50vw"
                className="hero-photo"
              />
              <div className="photo-shade" />
              <div className="photo-caption">
                <span>YOUR NEXT CHAPTER STARTS HERE</span>
                <p>
                  A little guidance.
                  <br />A world of possibilities.
                </p>
              </div>
              <div className="image-label">
                <Sparkles size={14} /> Talent meets opportunity
              </div>
            </div>
            <div className="hero-star" aria-hidden="true">
              <Asterisk size={100} strokeWidth={1.2} />
            </div>
            <div className="journey-note">
              <span className="note-icon">
                <ArrowUpRight size={23} />
              </span>
              <div>
                <strong>Potential, meet direction.</strong>
                <span>Prepare today. Step forward tomorrow.</span>
              </div>
            </div>
            <span className="photo-index" aria-hidden="true">
              01 / THE BEGINNING OF SOMETHING BIG
            </span>
          </div>
        </section>
        <section className="impact-strip" id="impact">
          <div className="container stats">
            <div className="stats-intro">
              <span className="eyebrow">SMALL BEGINNINGS.</span>
              <strong>Meaningful progress.</strong>
              <span className="stats-source">
                Early traction reported by TalentYug
              </span>
            </div>
            <div className="stat">
              <strong>
                450<span>+</span>
              </strong>
              <span>Students reached</span>
            </div>
            <div className="stat">
              <strong>
                180<span>+</span>
              </strong>
              <span>Placements & internships</span>
            </div>
            <div className="stat">
              <strong>12</strong>
              <span>Company partners</span>
            </div>
            <div className="stat">
              <strong>
                100<span>+</span>
              </strong>
              <span>Industry mentors</span>
            </div>
          </div>
        </section>
        <WebsiteSections />
      </main>
      <SiteFooter />
    </>
  );
}
