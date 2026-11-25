import type { Mode, Page } from "@quvantic/mcp-core";

export interface Contact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  phone: string;
  lifecycleStage: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  city: string;
  employees: number | null;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  name: string;
  amount: string;
  stage: string;
  pipeline: string;
  closeDate: string;
  company: string;
  contactEmail: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export type AssociationType = "contact" | "company" | "deal";

export interface NoteAssociation {
  type: AssociationType;
  id: string;
}

export interface Note {
  id: string;
  body: string;
  timestamp: string;
  associations: NoteAssociation[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchContacts {
  query?: string;
  email?: string;
  company?: string;
  limit?: number;
  cursor?: string;
}

export interface ContactWrite {
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  lifecycleStage?: string;
}

export interface SearchCompanies {
  query?: string;
  domain?: string;
  limit?: number;
  cursor?: string;
}

export interface CompanyWrite {
  name?: string;
  domain?: string;
  industry?: string;
  city?: string;
  employees?: number;
  phone?: string;
}

export interface SearchDeals {
  query?: string;
  stage?: string;
  limit?: number;
  cursor?: string;
}

export interface DealWrite {
  name?: string;
  amount?: string;
  stage?: string;
  pipeline?: string;
  closeDate?: string;
  company?: string;
  contactEmail?: string;
  owner?: string;
}

export interface CreateNote {
  body: string;
  objectType: AssociationType;
  objectId: string;
  timestamp?: string;
}

export interface ListNotes {
  objectType: AssociationType;
  objectId: string;
  limit?: number;
  cursor?: string;
}

export interface HubspotClient {
  readonly mode: Mode;
  readonly readOnly: boolean;
  searchContacts(input: SearchContacts): Promise<Page<Contact>>;
  getContact(id: string): Promise<Contact>;
  createContact(input: ContactWrite & { email: string }): Promise<Contact>;
  updateContact(id: string, patch: ContactWrite): Promise<Contact>;
  searchCompanies(input: SearchCompanies): Promise<Page<Company>>;
  getCompany(id: string): Promise<Company>;
  createCompany(input: CompanyWrite & { name: string }): Promise<Company>;
  updateCompany(id: string, patch: CompanyWrite): Promise<Company>;
  searchDeals(input: SearchDeals): Promise<Page<Deal>>;
  getDeal(id: string): Promise<Deal>;
  createDeal(input: DealWrite & { name: string }): Promise<Deal>;
  updateDeal(id: string, patch: DealWrite): Promise<Deal>;
  createNote(input: CreateNote): Promise<Note>;
  listNotes(input: ListNotes): Promise<Page<Note>>;
}
