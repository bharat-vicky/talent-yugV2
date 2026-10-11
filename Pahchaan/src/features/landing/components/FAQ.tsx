"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FADE_IN, SLIDE_UP } from "../utils/animations";

export function FAQ() {
  const faqs = [
    {
      question: "How does the White-label Branding work?",
      answer: "You can fully customize the look and feel of event pages and guest tickets. Upload your custom logo, select your brand colors, and deliver a seamless, premium experience to your attendees without any Pahchaan branding."
    },
    {
      question: "Can I manage multiple events simultaneously?",
      answer: "Yes. Pahchaan is built on a multi-event architecture with strict Workspace Isolation, allowing agencies and teams to manage, track, and analyze dozens of events concurrently from a single unified workspace."
    },
    {
      question: "What level of access control is available?",
      answer: "Pahchaan supports strict Role-Based Access Control. You can assign specific roles (Owner, Manager, Viewer) to team members, ensuring they only have access to the specific event data and modules they need."
    },
    {
      question: "Are the generated QR codes dynamic or static?",
      answer: "Pahchaan uses a powerful Dynamic QR Engine. This means you can update the destination URL or ticket metadata even after the QR codes have been printed or distributed, without needing to generate new ones."
    },
    {
      question: "Is the analytics dashboard real-time?",
      answer: "Absolutely. Our Real-time Analytics dashboard tracks live check-ins, peak attendance times, and live attendance cross-sections. When a guest is scanned at the door, your dashboard updates instantly."
    }
  ];

  return (
    <section className="py-24 bg-zinc-50 border-t border-zinc-200" id="faq">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={FADE_IN}
            className="lg:col-span-5"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-zinc-900">Frequently Asked Questions</h2>
            <p className="text-lg text-zinc-500 max-w-md">
              Everything you need to know about the product and event experience. Have more questions? Reach out to our team.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={SLIDE_UP}
            className="lg:col-span-7"
          >
            <Accordion className="w-full space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border border-zinc-200/60 bg-white px-6 rounded-2xl shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-300">
                  <AccordionTrigger className="text-left text-base md:text-lg font-semibold hover:no-underline text-zinc-900 hover:text-zinc-700 py-6 transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-500 text-base leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
