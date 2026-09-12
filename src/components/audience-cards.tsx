"use client";
import {
  ArrowUpRight,
  Building2,
  Check,
  GraduationCap,
  Sprout,
} from "lucide-react";
import { audiences } from "@/lib/content";
import { EnquiryButton } from "@/components/enquiry";

const icons = { college: Building2, student: GraduationCap, company: Sprout };
export function AudienceCards() {
  return (
    <div className="audience-grid">
      {audiences.map((audience) => {
        const Icon = icons[audience.id];
        return (
          <article
            key={audience.id}
            className={`audience-card audience-${audience.id}`}
            data-reveal
          >
            <div className="card-top">
              <span className="audience-icon">
                <Icon size={24} strokeWidth={1.5} />
              </span>
              <span className="card-number">{audience.number}</span>
            </div>
            <span className="eyebrow">{audience.label}</span>
            <h3>{audience.title}</h3>
            <p>{audience.description}</p>
            <ul>
              {audience.features.map((feature) => (
                <li key={feature}>
                  <Check size={15} />
                  {feature}
                </li>
              ))}
            </ul>
            <EnquiryButton
              audience={audience.id}
              variant="ghost"
              className="card-link"
            >
              {audience.action}
              <ArrowUpRight size={18} />
            </EnquiryButton>
          </article>
        );
      })}
    </div>
  );
}
