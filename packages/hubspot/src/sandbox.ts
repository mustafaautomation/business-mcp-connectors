import {
  assertWritable,
  type ClientOptions,
  ConnectorError,
  clampLimit,
  paginate,
  requiredString,
  SANDBOX_CLOCK,
} from "@quvantic/mcp-core";
import { companyFixtures, contactFixtures, dealFixtures, noteFixtures } from "./fixtures.js";
import type {
  AssociationType,
  Company,
  CompanyWrite,
  Contact,
  ContactWrite,
  CreateNote,
  Deal,
  DealWrite,
  HubspotClient,
  ListNotes,
  Note,
  SearchCompanies,
  SearchContacts,
  SearchDeals,
} from "./types.js";
import {
  assertCompanyPatch,
  assertContactPatch,
  assertDealPatch,
  associationType,
  domainOf,
  normalizeEmail,
  optionalAmount,
  optionalDay,
  optionalEmail,
  optionalEmployees,
  optionalTimestamp,
} from "./validate.js";

function includesText(query: string | undefined, fields: string[]): boolean {
  if (!query?.trim()) return true;
  const needle = query.trim().toLowerCase();
  return fields.some((field) => field.toLowerCase().includes(needle));
}

function copy<T>(value: T): T {
  return structuredClone(value);
}

export class SandboxHubspotClient implements HubspotClient {
  readonly mode = "sandbox" as const;
  readonly readOnly: boolean;
  private readonly contacts: Contact[];
  private readonly companies: Company[];
  private readonly deals: Deal[];
  private readonly notes: Note[];
  private readonly now: () => Date;
  private nextContact = 900;
  private nextCompany = 300;
  private nextDeal = 600;
  private nextNote = 850;

  constructor(options: ClientOptions, readOnly: boolean) {
    this.readOnly = readOnly;
    this.contacts = structuredClone(contactFixtures);
    this.companies = structuredClone(companyFixtures);
    this.deals = structuredClone(dealFixtures);
    this.notes = structuredClone(noteFixtures);
    this.now = options.now ?? (() => new Date(SANDBOX_CLOCK));
  }

  private clock(): string {
    return this.now().toISOString();
  }

  private requireRow<T extends { id: string }>(rows: T[], id: string, label: string): T {
    const row = rows.find((item) => item.id === id);
    if (!row) throw new ConnectorError("NOT_FOUND", `${label} ${id} was not found.`);
    return row;
  }

  searchContacts(input: SearchContacts) {
    const email = input.email ? normalizeEmail(input.email) : undefined;
    const company = input.company?.trim().toLowerCase();
    const rows = this.contacts.filter((row) => {
      if (email && row.email !== email) return false;
      if (company && !row.company.toLowerCase().includes(company)) return false;
      return includesText(input.query, [
        row.firstName,
        row.lastName,
        row.email,
        row.company,
        row.jobTitle,
      ]);
    });
    return Promise.resolve(paginate(rows.map(copy), clampLimit(input.limit), input.cursor));
  }

  getContact(id: string) {
    return Promise.resolve(
      copy(this.requireRow(this.contacts, requiredString(id, "id"), "Contact")),
    );
  }

  createContact(input: ContactWrite & { email: string }) {
    assertWritable(this.readOnly, "create a contact");
    const email = normalizeEmail(input.email);
    if (this.contacts.some((row) => row.email === email)) {
      throw new ConnectorError("CONFLICT", `A contact with email ${email} already exists.`);
    }
    const stamp = this.clock();
    const created: Contact = {
      id: String(this.nextContact++),
      email,
      firstName: input.firstName === undefined ? "" : requiredString(input.firstName, "firstName"),
      lastName: input.lastName === undefined ? "" : requiredString(input.lastName, "lastName"),
      company: input.company === undefined ? "" : requiredString(input.company, "company"),
      jobTitle: input.jobTitle === undefined ? "" : requiredString(input.jobTitle, "jobTitle"),
      phone: input.phone === undefined ? "" : requiredString(input.phone, "phone"),
      lifecycleStage:
        input.lifecycleStage === undefined
          ? "lead"
          : requiredString(input.lifecycleStage, "lifecycleStage"),
      createdAt: stamp,
      updatedAt: stamp,
    };
    this.contacts.push(created);
    return Promise.resolve(copy(created));
  }

  updateContact(id: string, patch: ContactWrite) {
    assertWritable(this.readOnly, "update a contact");
    assertContactPatch(patch);
    const current = this.requireRow(this.contacts, requiredString(id, "id"), "Contact");
    const email = optionalEmail(patch.email, "email");
    if (email && this.contacts.some((row) => row.email === email && row.id !== current.id)) {
      throw new ConnectorError("CONFLICT", `A contact with email ${email} already exists.`);
    }
    if (email) current.email = email;
    if (patch.firstName !== undefined)
      current.firstName = requiredString(patch.firstName, "firstName");
    if (patch.lastName !== undefined) current.lastName = requiredString(patch.lastName, "lastName");
    if (patch.company !== undefined) current.company = requiredString(patch.company, "company");
    if (patch.jobTitle !== undefined) current.jobTitle = requiredString(patch.jobTitle, "jobTitle");
    if (patch.phone !== undefined) current.phone = requiredString(patch.phone, "phone");
    if (patch.lifecycleStage !== undefined) {
      current.lifecycleStage = requiredString(patch.lifecycleStage, "lifecycleStage");
    }
    current.updatedAt = this.clock();
    return Promise.resolve(copy(current));
  }

  searchCompanies(input: SearchCompanies) {
    const domain = domainOf(input.domain);
    const rows = this.companies.filter((row) => {
      if (domain && row.domain !== domain) return false;
      return includesText(input.query, [row.name, row.domain, row.industry, row.city]);
    });
    return Promise.resolve(paginate(rows.map(copy), clampLimit(input.limit), input.cursor));
  }

  getCompany(id: string) {
    return Promise.resolve(
      copy(this.requireRow(this.companies, requiredString(id, "id"), "Company")),
    );
  }

  createCompany(input: CompanyWrite & { name: string }) {
    assertWritable(this.readOnly, "create a company");
    const name = requiredString(input.name, "name");
    const domain = domainOf(input.domain) ?? "";
    if (domain && this.companies.some((row) => row.domain === domain)) {
      throw new ConnectorError("CONFLICT", `A company with domain ${domain} already exists.`);
    }
    const stamp = this.clock();
    const created: Company = {
      id: String(this.nextCompany++),
      name,
      domain,
      industry: input.industry === undefined ? "" : requiredString(input.industry, "industry"),
      city: input.city === undefined ? "" : requiredString(input.city, "city"),
      employees: optionalEmployees(input.employees) ?? null,
      phone: input.phone === undefined ? "" : requiredString(input.phone, "phone"),
      createdAt: stamp,
      updatedAt: stamp,
    };
    this.companies.push(created);
    return Promise.resolve(copy(created));
  }

  updateCompany(id: string, patch: CompanyWrite) {
    assertWritable(this.readOnly, "update a company");
    assertCompanyPatch(patch);
    const current = this.requireRow(this.companies, requiredString(id, "id"), "Company");
    const domain = domainOf(patch.domain);
    if (domain && this.companies.some((row) => row.domain === domain && row.id !== current.id)) {
      throw new ConnectorError("CONFLICT", `A company with domain ${domain} already exists.`);
    }
    if (patch.name !== undefined) current.name = requiredString(patch.name, "name");
    if (domain) current.domain = domain;
    if (patch.industry !== undefined) current.industry = requiredString(patch.industry, "industry");
    if (patch.city !== undefined) current.city = requiredString(patch.city, "city");
    if (patch.employees !== undefined)
      current.employees = optionalEmployees(patch.employees) ?? null;
    if (patch.phone !== undefined) current.phone = requiredString(patch.phone, "phone");
    current.updatedAt = this.clock();
    return Promise.resolve(copy(current));
  }

  searchDeals(input: SearchDeals) {
    const stage = input.stage?.trim().toLowerCase();
    const rows = this.deals.filter((row) => {
      if (stage && row.stage !== stage) return false;
      return includesText(input.query, [row.name, row.company, row.contactEmail, row.stage]);
    });
    return Promise.resolve(paginate(rows.map(copy), clampLimit(input.limit), input.cursor));
  }

  getDeal(id: string) {
    return Promise.resolve(copy(this.requireRow(this.deals, requiredString(id, "id"), "Deal")));
  }

  createDeal(input: DealWrite & { name: string }) {
    assertWritable(this.readOnly, "create a deal");
    const stamp = this.clock();
    const created: Deal = {
      id: String(this.nextDeal++),
      name: requiredString(input.name, "name"),
      amount: input.amount === undefined ? "0" : (optionalAmount(input.amount) ?? "0"),
      stage:
        input.stage === undefined
          ? "appointmentscheduled"
          : requiredString(input.stage, "stage").toLowerCase(),
      pipeline:
        input.pipeline === undefined ? "default" : requiredString(input.pipeline, "pipeline"),
      closeDate: optionalDay(input.closeDate, "closeDate") ?? "",
      company: input.company === undefined ? "" : requiredString(input.company, "company"),
      contactEmail: optionalEmail(input.contactEmail, "contactEmail") ?? "",
      owner: input.owner === undefined ? "" : requiredString(input.owner, "owner"),
      createdAt: stamp,
      updatedAt: stamp,
    };
    this.deals.push(created);
    return Promise.resolve(copy(created));
  }

  updateDeal(id: string, patch: DealWrite) {
    assertWritable(this.readOnly, "update a deal");
    assertDealPatch(patch);
    const current = this.requireRow(this.deals, requiredString(id, "id"), "Deal");
    if (patch.name !== undefined) current.name = requiredString(patch.name, "name");
    if (patch.amount !== undefined) current.amount = optionalAmount(patch.amount) ?? current.amount;
    if (patch.stage !== undefined)
      current.stage = requiredString(patch.stage, "stage").toLowerCase();
    if (patch.pipeline !== undefined) current.pipeline = requiredString(patch.pipeline, "pipeline");
    if (patch.closeDate !== undefined)
      current.closeDate = optionalDay(patch.closeDate, "closeDate") ?? "";
    if (patch.company !== undefined) current.company = requiredString(patch.company, "company");
    if (patch.contactEmail !== undefined) {
      current.contactEmail = optionalEmail(patch.contactEmail, "contactEmail") ?? "";
    }
    if (patch.owner !== undefined) current.owner = requiredString(patch.owner, "owner");
    current.updatedAt = this.clock();
    return Promise.resolve(copy(current));
  }

  private requireAssociation(type: AssociationType, id: string): void {
    if (type === "contact") this.requireRow(this.contacts, id, "Contact");
    if (type === "company") this.requireRow(this.companies, id, "Company");
    if (type === "deal") this.requireRow(this.deals, id, "Deal");
  }

  createNote(input: CreateNote) {
    assertWritable(this.readOnly, "create a note");
    const type = associationType(input.objectType);
    const objectId = requiredString(input.objectId, "objectId");
    this.requireAssociation(type, objectId);
    const stamp = this.clock();
    const created: Note = {
      id: String(this.nextNote++),
      body: requiredString(input.body, "body"),
      timestamp: optionalTimestamp(input.timestamp, stamp),
      associations: [{ type, id: objectId }],
      createdAt: stamp,
      updatedAt: stamp,
    };
    this.notes.push(created);
    return Promise.resolve(copy(created));
  }

  listNotes(input: ListNotes) {
    const type = associationType(input.objectType);
    const objectId = requiredString(input.objectId, "objectId");
    this.requireAssociation(type, objectId);
    const rows = this.notes.filter((note) =>
      note.associations.some((link) => link.type === type && link.id === objectId),
    );
    return Promise.resolve(paginate(rows.map(copy), clampLimit(input.limit), input.cursor));
  }
}
