"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Check, Copy, Mail, Phone, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, type ButtonProps } from "@/components/ui/button";
import { business } from "@/lib/content";
import {
  closeEnquiry,
  openEnquiry,
  setAudience,
  type AppDispatch,
  type Audience,
  type RootState,
} from "@/lib/store";

export function EnquiryButton({
  audience,
  children,
  ...props
}: ButtonProps & { audience?: Audience }) {
  const dispatch = useDispatch<AppDispatch>();
  return (
    <Button {...props} onClick={() => dispatch(openEnquiry(audience))}>
      {children}
    </Button>
  );
}

export function EnquiryDialog() {
  const dispatch = useDispatch<AppDispatch>();
  const { audience, enquiryOpen } = useSelector(
    (state: RootState) => state.journey,
  );
  const [prepared, setPrepared] = useState<{
    url: string;
    text: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    organisation: "",
    message: "",
  });
  const [validationError, setValidationError] = useState("");
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  function prepareEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const organisation = String(data.get("organisation") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    if (!name || !email || !message) {
      setValidationError(
        "Please add a message about what you would like to achieve.",
      );
      messageRef.current?.focus();
      return;
    }
    setValidationError("");
    const subject = `TalentYug ${audience} enquiry — ${name}`;
    const text = `Hello TalentYug,\n\nI am enquiring as a ${audience}.\n\nName: ${name}\nEmail: ${email}\nCollege / organisation: ${organisation || "Not specified"}\n\n${message}\n\nRegards,\n${name}`;
    setPrepared({
      url: `mailto:${business.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
      text,
    });
  }

  async function copyMessage() {
    if (!prepared) return;
    try {
      await navigator.clipboard.writeText(prepared.text);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <Dialog.Root
      open={enquiryOpen}
      onOpenChange={(open) => {
        if (!open) dispatch(closeEnquiry());
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-content"
          onOpenAutoFocus={() => {
            openerRef.current = document.activeElement as HTMLElement;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            openerRef.current?.focus();
            setPrepared(null);
            setCopied(false);
            setCopyError(false);
          }}
        >
          <Dialog.Close className="dialog-close" aria-label="Close enquiry">
            <X size={22} />
          </Dialog.Close>
          <span className="eyebrow">YOUR NEXT CHAPTER</span>
          <Dialog.Title className="dialog-title">
            Let’s move forward.
          </Dialog.Title>
          <Dialog.Description className="dialog-description">
            Tell us a little about yourself. We’ll help you start the right
            conversation with our team.
          </Dialog.Description>
          {prepared ? (
            <div className="enquiry-prepared">
              <span className="prepared-icon">
                <Mail size={25} />
              </span>
              <h3>Your email draft is ready.</h3>
              <p>
                Open it in your email app, review it, and send it to{" "}
                <strong>{business.email}</strong>. Your enquiry has not been
                sent yet.
              </p>
              <Button asChild>
                <a href={prepared.url}>
                  Open email draft <ArrowUpRight size={18} />
                </a>
              </Button>
              <Button variant="outline" onClick={copyMessage}>
                {copied ? <Check size={17} /> : <Copy size={17} />}
                {copied ? "Message copied" : "Copy message instead"}
              </Button>
              <span role="status" className="copy-status">
                {copied
                  ? "Paste the message into an email to connect@talentyug.in."
                  : copyError
                    ? "Copy is unavailable in this browser. Select the message below to copy it."
                    : ""}
              </span>
              <details>
                <summary>View your message</summary>
                <pre className="email-message">{prepared.text}</pre>
              </details>
              <button
                className="text-link"
                onClick={() => {
                  setPrepared(null);
                  setCopied(false);
                }}
              >
                Edit enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={prepareEmail} className="enquiry-form">
              <fieldset>
                <legend>I’m here as a</legend>
                <div className="audience-choices">
                  {(["college", "student", "company"] as const).map((value) => (
                    <label
                      key={value}
                      className={audience === value ? "selected" : ""}
                    >
                      <input
                        type="radio"
                        name="audience"
                        value={value}
                        checked={audience === value}
                        onChange={() => dispatch(setAudience(value))}
                      />
                      <span>
                        {value === "college"
                          ? "College"
                          : value === "student"
                            ? "Student"
                            : "Company"}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="form-row">
                <label>
                  Your name
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="Full name"
                    required
                    maxLength={100}
                    pattern=".*\S.*"
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                  />
                </label>
                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    maxLength={150}
                    value={draft.email}
                    onChange={(event) =>
                      setDraft({ ...draft, email: event.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                College or organisation{" "}
                <span className="optional">(optional)</span>
                <input
                  name="organisation"
                  autoComplete="organization"
                  placeholder={
                    audience === "company" ? "Company name" : "College name"
                  }
                  maxLength={160}
                  value={draft.organisation}
                  onChange={(event) =>
                    setDraft({ ...draft, organisation: event.target.value })
                  }
                />
              </label>
              <label>
                What would you like to achieve?
                <textarea
                  name="message"
                  ref={messageRef}
                  value={draft.message}
                  onChange={(event) => {
                    setDraft({ ...draft, message: event.target.value });
                    setValidationError("");
                  }}
                  aria-invalid={validationError ? true : undefined}
                  aria-describedby={
                    validationError ? "message-error" : undefined
                  }
                  placeholder={
                    audience === "college"
                      ? "Tell us about your student cohort and programme goals…"
                      : audience === "student"
                        ? "Tell us what you are studying and where you need guidance…"
                        : "Tell us about your roles and the talent you are looking for…"
                  }
                  required
                  maxLength={1800}
                  rows={3}
                />
              </label>
              {validationError && (
                <p id="message-error" role="alert" className="form-error">
                  {validationError}
                </p>
              )}
              <p className="form-note">
                This prepares a draft in your email app. Your details stay in
                this page until you choose to send the email.
              </p>
              <Button type="submit">
                Prepare my enquiry <ArrowUpRight size={18} />
              </Button>
            </form>
          )}
          <div className="dialog-contact">
            <span>Prefer a conversation?</span>
            <a href={business.phoneHref}>
              <Phone size={14} />
              {business.phone}
            </a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
