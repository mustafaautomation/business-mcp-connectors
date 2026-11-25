import type { Company, Contact, Deal, Note } from "./types.js";

const stamp = "2026-10-12T15:00:00.000Z";

function contact(row: Omit<Contact, "createdAt" | "updatedAt">): Contact {
  return { ...row, createdAt: stamp, updatedAt: stamp };
}

function company(row: Omit<Company, "createdAt" | "updatedAt">): Company {
  return { ...row, createdAt: stamp, updatedAt: stamp };
}

function deal(row: Omit<Deal, "createdAt" | "updatedAt">): Deal {
  return { ...row, createdAt: stamp, updatedAt: stamp };
}

/** Fictional Northline Studio pipeline. Every address is on .example. */
export const contactFixtures: Contact[] = [
  contact({
    id: "101",
    email: "amina.shah@harborandco.example",
    firstName: "Amina",
    lastName: "Shah",
    company: "Harbor & Co.",
    jobTitle: "VP Operations",
    phone: "+1-415-555-0148",
    lifecycleStage: "customer",
  }),
  contact({
    id: "102",
    email: "jonah.ellison@harborandco.example",
    firstName: "Jonah",
    lastName: "Ellison",
    company: "Harbor & Co.",
    jobTitle: "Finance lead",
    phone: "+1-415-555-0172",
    lifecycleStage: "customer",
  }),
  contact({
    id: "103",
    email: "priya.raman@lumenfield.example",
    firstName: "Priya",
    lastName: "Raman",
    company: "Lumenfield Goods",
    jobTitle: "Head of Ecommerce",
    phone: "+1-503-555-0190",
    lifecycleStage: "opportunity",
  }),
  contact({
    id: "104",
    email: "chris.adelayo@kilngroup.example",
    firstName: "Chris",
    lastName: "Adelayo",
    company: "Kiln Group",
    jobTitle: "Founder",
    phone: "+1-216-555-0114",
    lifecycleStage: "lead",
  }),
  contact({
    id: "105",
    email: "elena.voss@paperroute.example",
    firstName: "Elena",
    lastName: "Voss",
    company: "Paper Route Media",
    jobTitle: "Marketing Director",
    phone: "+1-347-555-0166",
    lifecycleStage: "opportunity",
  }),
  contact({
    id: "106",
    email: "samir.haddad@northline.example",
    firstName: "Samir",
    lastName: "Haddad",
    company: "Northline Studio",
    jobTitle: "Engagement manager",
    phone: "+1-718-555-0133",
    lifecycleStage: "subscriber",
  }),
  contact({
    id: "107",
    email: "grace.chen@fieldnote.example",
    firstName: "Grace",
    lastName: "Chen",
    company: "Fieldnote Legal",
    jobTitle: "COO",
    phone: "+1-617-555-0188",
    lifecycleStage: "customer",
  }),
  contact({
    id: "108",
    email: "mateo.ruiz@brightsail.example",
    firstName: "Mateo",
    lastName: "Ruiz",
    company: "Brightsail Travel",
    jobTitle: "RevOps",
    phone: "+1-305-555-0120",
    lifecycleStage: "opportunity",
  }),
];

export const companyFixtures: Company[] = [
  company({
    id: "201",
    name: "Harbor & Co.",
    domain: "harborandco.example",
    industry: "Logistics",
    city: "Oakland",
    employees: 120,
    phone: "+1-415-555-0100",
  }),
  company({
    id: "202",
    name: "Lumenfield Goods",
    domain: "lumenfield.example",
    industry: "Retail",
    city: "Portland",
    employees: 42,
    phone: "+1-503-555-0102",
  }),
  company({
    id: "203",
    name: "Kiln Group",
    domain: "kilngroup.example",
    industry: "Manufacturing",
    city: "Cleveland",
    employees: 25,
    phone: "+1-216-555-0104",
  }),
  company({
    id: "204",
    name: "Paper Route Media",
    domain: "paperroute.example",
    industry: "Media",
    city: "Brooklyn",
    employees: 15,
    phone: "+1-347-555-0105",
  }),
  company({
    id: "205",
    name: "Fieldnote Legal",
    domain: "fieldnote.example",
    industry: "Legal",
    city: "Boston",
    employees: 80,
    phone: "+1-617-555-0107",
  }),
  company({
    id: "206",
    name: "Brightsail Travel",
    domain: "brightsail.example",
    industry: "Travel",
    city: "Miami",
    employees: 60,
    phone: "+1-305-555-0108",
  }),
  company({
    id: "207",
    name: "Northline Studio",
    domain: "northline.example",
    industry: "Professional services",
    city: "New York",
    employees: 11,
    phone: "+1-718-555-0106",
  }),
];

export const dealFixtures: Deal[] = [
  deal({
    id: "501",
    name: "Harbor & Co. — Analytics Retainer",
    amount: "48000",
    stage: "closedwon",
    pipeline: "default",
    closeDate: "2026-11-18",
    company: "Harbor & Co.",
    contactEmail: "amina.shah@harborandco.example",
    owner: "maya.okonkwo",
  }),
  deal({
    id: "502",
    name: "Lumenfield Q2 launch site",
    amount: "18500",
    stage: "contractsent",
    pipeline: "default",
    closeDate: "2026-12-09",
    company: "Lumenfield Goods",
    contactEmail: "priya.raman@lumenfield.example",
    owner: "maya.okonkwo",
  }),
  deal({
    id: "503",
    name: "Kiln Group discovery",
    amount: "4200",
    stage: "appointmentscheduled",
    pipeline: "default",
    closeDate: "2026-12-01",
    company: "Kiln Group",
    contactEmail: "chris.adelayo@kilngroup.example",
    owner: "samir.haddad",
  }),
  deal({
    id: "504",
    name: "Paper Route content ops",
    amount: "9600",
    stage: "qualifiedtobuy",
    pipeline: "default",
    closeDate: "2026-12-15",
    company: "Paper Route Media",
    contactEmail: "elena.voss@paperroute.example",
    owner: "maya.okonkwo",
  }),
  deal({
    id: "505",
    name: "Fieldnote portal",
    amount: "32000",
    stage: "closedwon",
    pipeline: "default",
    closeDate: "2026-11-02",
    company: "Fieldnote Legal",
    contactEmail: "grace.chen@fieldnote.example",
    owner: "samir.haddad",
  }),
  deal({
    id: "506",
    name: "Brightsail booking dashboard",
    amount: "27500",
    stage: "presentationscheduled",
    pipeline: "default",
    closeDate: "2026-12-20",
    company: "Brightsail Travel",
    contactEmail: "mateo.ruiz@brightsail.example",
    owner: "samir.haddad",
  }),
];

export const noteFixtures: Note[] = [
  {
    id: "801",
    body: "Amina confirmed the retainer on the Nov 17 call. Procurement wants a one-page SOW.",
    timestamp: "2026-11-17T18:30:00.000Z",
    associations: [
      { type: "deal", id: "501" },
      { type: "contact", id: "101" },
    ],
    createdAt: stamp,
    updatedAt: stamp,
  },
];
