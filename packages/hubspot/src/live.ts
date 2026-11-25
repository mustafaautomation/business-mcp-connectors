import {
  assertWritable,
  type ClientOptions,
  ConnectorError,
  clampLimit,
  type Page,
  requestJson,
  requiredString,
  resolveToken,
  resolveUrl,
  tokenHeaders,
} from "@quvantic/mcp-core";
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
  normalizeEmail,
  optionalAmount,
  optionalDay,
  optionalEmail,
  optionalEmployees,
  optionalTimestamp,
} from "./validate.js";

const CONTACT_PROPS = [
  "email",
  "firstname",
  "lastname",
  "company",
  "jobtitle",
  "phone",
  "lifecyclestage",
];
const COMPANY_PROPS = ["name", "domain", "industry", "city", "numberofemployees", "phone"];
const DEAL_PROPS = [
  "dealname",
  "amount",
  "dealstage",
  "pipeline",
  "closedate",
  "company",
  "contact_email",
  "hubspot_owner_id",
];

/** HubSpot-defined note → record association type ids. */
const NOTE_ASSOCIATION: Record<AssociationType, number> = {
  contact: 202,
  company: 190,
  deal: 214,
};

const OBJECT_PATH: Record<AssociationType, string> = {
  contact: "contacts",
  company: "companies",
  deal: "deals",
};

interface ObjectResponse {
  id: string;
  properties?: Record<string, string | null>;
  createdAt?: string;
  updatedAt?: string;
}

interface SearchResponse {
  results?: ObjectResponse[];
  paging?: { next?: { after?: string } };
}

interface AssociationResponse {
  results?: { toObjectId?: number | string; id?: string }[];
  paging?: { next?: { after?: string } };
}

function prop(properties: Record<string, string | null> | undefined, key: string): string {
  return properties?.[key] ?? "";
}

function employeesOf(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function mapContact(row: ObjectResponse): Contact {
  return {
    id: row.id,
    email: prop(row.properties, "email"),
    firstName: prop(row.properties, "firstname"),
    lastName: prop(row.properties, "lastname"),
    company: prop(row.properties, "company"),
    jobTitle: prop(row.properties, "jobtitle"),
    phone: prop(row.properties, "phone"),
    lifecycleStage: prop(row.properties, "lifecyclestage"),
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

function mapCompany(row: ObjectResponse): Company {
  return {
    id: row.id,
    name: prop(row.properties, "name"),
    domain: prop(row.properties, "domain"),
    industry: prop(row.properties, "industry"),
    city: prop(row.properties, "city"),
    employees: employeesOf(prop(row.properties, "numberofemployees")),
    phone: prop(row.properties, "phone"),
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

function mapDeal(row: ObjectResponse): Deal {
  return {
    id: row.id,
    name: prop(row.properties, "dealname"),
    amount: prop(row.properties, "amount"),
    stage: prop(row.properties, "dealstage"),
    pipeline: prop(row.properties, "pipeline"),
    closeDate: prop(row.properties, "closedate").slice(0, 10),
    company: prop(row.properties, "company"),
    contactEmail: prop(row.properties, "contact_email"),
    owner: prop(row.properties, "hubspot_owner_id"),
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

function mapNote(row: ObjectResponse, associations: Note["associations"]): Note {
  return {
    id: row.id,
    body: prop(row.properties, "hs_note_body"),
    timestamp: prop(row.properties, "hs_timestamp"),
    associations,
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

function onlyDefined(entries: Record<string, string | undefined>): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined) output[key] = value;
  }
  return output;
}

function pageFrom<T>(cursor: string | undefined, items: T[]): Page<T> {
  return cursor ? { items, nextCursor: cursor } : { items };
}

export class LiveHubspotClient implements HubspotClient {
  readonly mode = "live" as const;
  readonly readOnly: boolean;
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly logger: ClientOptions["logger"];
  private readonly fetchImpl: ClientOptions["fetch"];
  private readonly sleep: ClientOptions["sleep"];
  private readonly timeoutMs: number | undefined;
  private readonly retries: number | undefined;

  constructor(options: ClientOptions, readOnly: boolean) {
    this.readOnly = readOnly;
    this.token = resolveToken("HUBSPOT_ACCESS_TOKEN", options);
    this.baseUrl = options.baseUrl ?? "https://api.hubapi.com";
    this.logger = options.logger;
    this.fetchImpl = options.fetch;
    this.sleep = options.sleep;
    this.timeoutMs = options.timeoutMs;
    this.retries = options.retries;
  }

  private request<T>(method: string, path: string, body?: unknown): Promise<T> {
    return requestJson<T>({
      method,
      url: resolveUrl(this.baseUrl, path),
      headers: tokenHeaders(this.token, "bearer"),
      body,
      logger: this.logger,
      fetch: this.fetchImpl,
      sleep: this.sleep,
      timeoutMs: this.timeoutMs,
      retries: this.retries,
    });
  }

  async searchContacts(input: SearchContacts): Promise<Page<Contact>> {
    const email = input.email ? normalizeEmail(input.email) : undefined;
    const response = await this.request<SearchResponse>("POST", "/crm/v3/objects/contacts/search", {
      query: input.query,
      filterGroups: email
        ? [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }]
        : undefined,
      limit: clampLimit(input.limit),
      after: input.cursor,
      properties: CONTACT_PROPS,
    });
    let items = (response.results ?? []).map(mapContact);
    if (input.company?.trim()) {
      const company = input.company.trim().toLowerCase();
      items = items.filter((row) => row.company.toLowerCase().includes(company));
    }
    return pageFrom(response.paging?.next?.after, items);
  }

  async getContact(id: string): Promise<Contact> {
    const row = await this.request<ObjectResponse>(
      "GET",
      `/crm/v3/objects/contacts/${encodeURIComponent(requiredString(id, "id"))}?properties=${CONTACT_PROPS.join(",")}`,
    );
    return mapContact(row);
  }

  async createContact(input: ContactWrite & { email: string }): Promise<Contact> {
    assertWritable(this.readOnly, "create a contact");
    const row = await this.request<ObjectResponse>("POST", "/crm/v3/objects/contacts", {
      properties: onlyDefined({
        email: normalizeEmail(input.email),
        firstname: input.firstName,
        lastname: input.lastName,
        company: input.company,
        jobtitle: input.jobTitle,
        phone: input.phone,
        lifecyclestage: input.lifecycleStage,
      }),
    });
    return mapContact(row);
  }

  async updateContact(id: string, patch: ContactWrite): Promise<Contact> {
    assertWritable(this.readOnly, "update a contact");
    assertContactPatch(patch);
    const row = await this.request<ObjectResponse>(
      "PATCH",
      `/crm/v3/objects/contacts/${encodeURIComponent(requiredString(id, "id"))}`,
      {
        properties: onlyDefined({
          email: optionalEmail(patch.email, "email"),
          firstname: patch.firstName,
          lastname: patch.lastName,
          company: patch.company,
          jobtitle: patch.jobTitle,
          phone: patch.phone,
          lifecyclestage: patch.lifecycleStage,
        }),
      },
    );
    return mapContact(row);
  }

  async searchCompanies(input: SearchCompanies): Promise<Page<Company>> {
    const domain = input.domain?.trim().toLowerCase();
    const response = await this.request<SearchResponse>(
      "POST",
      "/crm/v3/objects/companies/search",
      {
        query: input.query,
        filterGroups: domain
          ? [{ filters: [{ propertyName: "domain", operator: "EQ", value: domain }] }]
          : undefined,
        limit: clampLimit(input.limit),
        after: input.cursor,
        properties: COMPANY_PROPS,
      },
    );
    return pageFrom(response.paging?.next?.after, (response.results ?? []).map(mapCompany));
  }

  async getCompany(id: string): Promise<Company> {
    const row = await this.request<ObjectResponse>(
      "GET",
      `/crm/v3/objects/companies/${encodeURIComponent(requiredString(id, "id"))}?properties=${COMPANY_PROPS.join(",")}`,
    );
    return mapCompany(row);
  }

  async createCompany(input: CompanyWrite & { name: string }): Promise<Company> {
    assertWritable(this.readOnly, "create a company");
    const employees = optionalEmployees(input.employees);
    const row = await this.request<ObjectResponse>("POST", "/crm/v3/objects/companies", {
      properties: onlyDefined({
        name: requiredString(input.name, "name"),
        domain: input.domain?.trim().toLowerCase(),
        industry: input.industry,
        city: input.city,
        numberofemployees: employees === undefined ? undefined : String(employees),
        phone: input.phone,
      }),
    });
    return mapCompany(row);
  }

  async updateCompany(id: string, patch: CompanyWrite): Promise<Company> {
    assertWritable(this.readOnly, "update a company");
    assertCompanyPatch(patch);
    const employees = optionalEmployees(patch.employees);
    const row = await this.request<ObjectResponse>(
      "PATCH",
      `/crm/v3/objects/companies/${encodeURIComponent(requiredString(id, "id"))}`,
      {
        properties: onlyDefined({
          name: patch.name,
          domain: patch.domain?.trim().toLowerCase(),
          industry: patch.industry,
          city: patch.city,
          numberofemployees: employees === undefined ? undefined : String(employees),
          phone: patch.phone,
        }),
      },
    );
    return mapCompany(row);
  }

  async searchDeals(input: SearchDeals): Promise<Page<Deal>> {
    const stage = input.stage?.trim().toLowerCase();
    const response = await this.request<SearchResponse>("POST", "/crm/v3/objects/deals/search", {
      query: input.query,
      filterGroups: stage
        ? [{ filters: [{ propertyName: "dealstage", operator: "EQ", value: stage }] }]
        : undefined,
      limit: clampLimit(input.limit),
      after: input.cursor,
      properties: DEAL_PROPS,
    });
    return pageFrom(response.paging?.next?.after, (response.results ?? []).map(mapDeal));
  }

  async getDeal(id: string): Promise<Deal> {
    const dealId = requiredString(id, "id");
    const row = await this.request<ObjectResponse>(
      "GET",
      `/crm/v3/objects/deals/${encodeURIComponent(dealId)}?properties=${DEAL_PROPS.join(",")}`,
    );
    const deal = mapDeal(row);
    if (deal.company) return deal;
    try {
      const associations = await this.request<AssociationResponse>(
        "GET",
        `/crm/v4/objects/deals/${encodeURIComponent(dealId)}/associations/companies`,
      );
      const companyId = associations.results?.[0]?.toObjectId ?? associations.results?.[0]?.id;
      if (companyId === undefined) return deal;
      const company = await this.request<ObjectResponse>(
        "GET",
        `/crm/v3/objects/companies/${encodeURIComponent(String(companyId))}?properties=name`,
      );
      return { ...deal, company: prop(company.properties, "name") };
    } catch (error) {
      if (error instanceof ConnectorError && error.code === "NOT_FOUND") return deal;
      throw error;
    }
  }

  async createDeal(input: DealWrite & { name: string }): Promise<Deal> {
    assertWritable(this.readOnly, "create a deal");
    const row = await this.request<ObjectResponse>("POST", "/crm/v3/objects/deals", {
      properties: onlyDefined({
        dealname: requiredString(input.name, "name"),
        amount: input.amount === undefined ? "0" : optionalAmount(input.amount),
        dealstage: input.stage?.toLowerCase() ?? "appointmentscheduled",
        pipeline: input.pipeline ?? "default",
        closedate: optionalDay(input.closeDate, "closeDate"),
        company: input.company,
        contact_email: optionalEmail(input.contactEmail, "contactEmail"),
        hubspot_owner_id: input.owner,
      }),
    });
    return mapDeal(row);
  }

  async updateDeal(id: string, patch: DealWrite): Promise<Deal> {
    assertWritable(this.readOnly, "update a deal");
    assertDealPatch(patch);
    const row = await this.request<ObjectResponse>(
      "PATCH",
      `/crm/v3/objects/deals/${encodeURIComponent(requiredString(id, "id"))}`,
      {
        properties: onlyDefined({
          dealname: patch.name,
          amount: optionalAmount(patch.amount),
          dealstage: patch.stage?.toLowerCase(),
          pipeline: patch.pipeline,
          closedate: optionalDay(patch.closeDate, "closeDate"),
          company: patch.company,
          contact_email: optionalEmail(patch.contactEmail, "contactEmail"),
          hubspot_owner_id: patch.owner,
        }),
      },
    );
    return mapDeal(row);
  }

  async createNote(input: CreateNote): Promise<Note> {
    assertWritable(this.readOnly, "create a note");
    const type = associationType(input.objectType);
    const objectId = requiredString(input.objectId, "objectId");
    const timestamp = optionalTimestamp(input.timestamp, new Date().toISOString());
    const row = await this.request<ObjectResponse>("POST", "/crm/v3/objects/notes", {
      properties: {
        hs_timestamp: timestamp,
        hs_note_body: requiredString(input.body, "body"),
      },
      associations: [
        {
          to: { id: objectId },
          types: [
            {
              associationCategory: "HUBSPOT_DEFINED",
              associationTypeId: NOTE_ASSOCIATION[type],
            },
          ],
        },
      ],
    });
    return mapNote(row, [{ type, id: objectId }]);
  }

  async listNotes(input: ListNotes): Promise<Page<Note>> {
    const type = associationType(input.objectType);
    const objectId = requiredString(input.objectId, "objectId");
    const limit = clampLimit(input.limit);
    const after = input.cursor ? `&after=${encodeURIComponent(input.cursor)}` : "";
    const associations = await this.request<AssociationResponse>(
      "GET",
      `/crm/v4/objects/${OBJECT_PATH[type]}/${encodeURIComponent(objectId)}/associations/notes?limit=${limit}${after}`,
    );
    const ids = (associations.results ?? [])
      .map((row) => row.toObjectId ?? row.id)
      .filter((id): id is string | number => id !== undefined);
    if (ids.length === 0) return pageFrom(associations.paging?.next?.after, []);
    const batch = await this.request<{ results?: ObjectResponse[] }>(
      "POST",
      "/crm/v3/objects/notes/batch/read",
      {
        properties: ["hs_note_body", "hs_timestamp"],
        inputs: ids.map((id) => ({ id: String(id) })),
      },
    );
    const items = (batch.results ?? []).map((row) => mapNote(row, [{ type, id: objectId }]));
    return pageFrom(associations.paging?.next?.after, items);
  }
}
