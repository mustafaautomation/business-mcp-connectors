export interface SpreadsheetSeed {
  id: string;
  title: string;
  sheets: Record<string, string[][]>;
}

/** Fictional ops workbook for Northline Studio. */
export const spreadsheetFixtures: SpreadsheetSeed = {
  id: "revenue-ops",
  title: "Northline revenue ops",
  sheets: {
    "Won Deals": [["Logged at", "Deal", "Company", "Amount", "Contact", "ClickUp tasks"]],
    Pipeline: [
      ["Deal", "Stage", "Amount", "Owner"],
      ["Lumenfield Q2 launch site", "contractsent", "18500", "Maya Okonkwo"],
      ["Kiln Group discovery", "appointmentscheduled", "4200", "Samir Haddad"],
      ["Paper Route content ops", "qualifiedtobuy", "9600", "Maya Okonkwo"],
      ["Brightsail booking dashboard", "presentationscheduled", "27500", "Samir Haddad"],
    ],
    Contacts: [
      ["Name", "Email", "Company", "Role"],
      ["Amina Shah", "amina.shah@harborandco.example", "Harbor & Co.", "VP Operations"],
      ["Priya Raman", "priya.raman@lumenfield.example", "Lumenfield Goods", "Head of Ecommerce"],
      ["Grace Chen", "grace.chen@fieldnote.example", "Fieldnote Legal", "COO"],
    ],
  },
};
