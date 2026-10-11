import { eventRepository } from "./src/infrastructure/repositories/EventRepository";
import { registrationFormRepository } from "./src/infrastructure/repositories/RegistrationFormRepository";
import { RegistrationService } from "./src/application/services/RegistrationService";

async function run() {
  console.log("1. Finding event...");
  const event = await eventRepository.findByUniqueSlug("ai-summit");
  if (!event) throw new Error("Event not found");
  
  console.log(`Found event: ${event.name} (${event._id})`);

  console.log("2. Fetching existing form schema...");
  const form = await registrationFormRepository.findByEventId(event._id as string);
  if (!form) throw new Error("Form not found");

  console.log("3. Adding 'Company' field...");
  const companyFieldId = "field_" + Math.random().toString(36).substring(2, 9);
  form.fields.push({
    id: companyFieldId,
    type: "text",
    label: "Company",
    required: false,
    hidden: false,
    readOnly: false,
    width: "full"
  });

  await registrationFormRepository.update(form._id as string, { fields: form.fields });
  console.log("Form updated in MongoDB.");

  console.log("4. Fetching from public route (simulating /api/r/ai-summit)...");
  const res = await fetch("http://localhost:3000/api/r/ai-summit");
  const data = await res.json();
  const hasCompany = data.form.fields.some((f: {id:string;label:string}) => f.label === "Company");
  console.log(`Public route contains Company field: ${hasCompany}`);

  console.log("5. Submitting a test registration...");
  
  const answers: Record<string, string> = {};
  data.form.fields.forEach((f: {id:string;label:string}) => {
    if (f.label === "First Name") answers[f.id] = "John";
    if (f.label === "Last Name") answers[f.id] = "Doe";
    if (f.label === "Email Address") answers[f.id] = "john.doe@example.com";
    if (f.label === "Company") answers[f.id] = "Tech Corp Inc.";
  });

  const submitRes = await fetch("http://localhost:3000/api/r/ai-summit/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers })
  });
  
  const submitData = await submitRes.json();
  console.log("Submission response:", submitData);

  console.log("6. Verifying submission in MongoDB...");
  // Now simulate admin view by fetching submissions using the repository directly
  const { registrationSubmissionRepository } = await import("./src/infrastructure/repositories/RegistrationSubmissionRepository");
  const submissions = await registrationSubmissionRepository.findByEventId(event._id as string);
  
  const mySubmission = submissions.find(s => s.answers[companyFieldId] === "Tech Corp Inc.");
  if (mySubmission) {
    console.log(`Success! Submission found. Company: ${mySubmission.answers[companyFieldId]}, Status: ${mySubmission.status}`);
  } else {
    console.log("Failed to find submission.");
  }
}

run().catch(console.error).finally(() => process.exit(0));
