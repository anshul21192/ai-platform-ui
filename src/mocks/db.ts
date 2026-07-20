export interface TransactionRecord {
  id: number;
  name: string;
  category: string;
  dateShort: string;
  dateLong: string;
  status: string;
  amount: string;
  positive: boolean;
  iconBgKey: string;
}

export interface BeneficiaryRecord {
  id: number;
  name: string;
  initials: string;
  email: string;
  phone: string;
  bank: string;
  account: string;
  gradient: string;
}

const gradients = [
  "linear-gradient(135deg, #2b7fff 0%, #155dfc 100%)",
  "linear-gradient(135deg, #ad46ff 0%, #9810fa 100%)",
  "linear-gradient(135deg, #00c950 0%, #00a63e 100%)",
  "linear-gradient(135deg, #f6339a 0%, #e60076 100%)",
  "linear-gradient(135deg, #ff6900 0%, #f54900 100%)",
  "linear-gradient(135deg, #00bba7 0%, #009689 100%)",
];

let nextBeneficiaryId = 7;

export const db = {
  transactions: [
    { id: 1, name: "Payment from John Smith", category: "Income", dateShort: "Mar 28, 2026", dateLong: "Mar 28, 2026 10:32 AM", status: "completed", amount: "+$2,500.00", positive: true, iconBgKey: "success.light" },
    { id: 2, name: "Transfer to Sarah Johnson", category: "Transfer", dateShort: "Mar 27, 2026", dateLong: "Mar 27, 2026 03:15 PM", status: "completed", amount: "-$850.00", positive: false, iconBgKey: "error.light" },
    { id: 3, name: "Subscription Payment", category: "Subscription", dateShort: "Mar 26, 2026", dateLong: "Mar 26, 2026 12:00 PM", status: "completed", amount: "-$49.99", positive: false, iconBgKey: "error.light" },
    { id: 4, name: "Salary Deposit", category: "Salary", dateShort: "Mar 25, 2026", dateLong: "Mar 25, 2026 09:00 AM", status: "completed", amount: "+$5,200.00", positive: true, iconBgKey: "success.light" },
    { id: 5, name: "Online Purchase", category: "Shopping", dateShort: "Mar 24, 2026", dateLong: "Mar 24, 2026 04:22 PM", status: "pending", amount: "-$129.99", positive: false, iconBgKey: "error.light" },
    { id: 6, name: "Freelance Payment", category: "Income", dateShort: "Mar 23, 2026", dateLong: "Mar 23, 2026 02:10 PM", status: "completed", amount: "+$1,200.00", positive: true, iconBgKey: "success.light" },
    { id: 7, name: "Utility Bill", category: "Bills", dateShort: "Mar 22, 2026", dateLong: "Mar 22, 2026 08:30 AM", status: "completed", amount: "-$245.50", positive: false, iconBgKey: "error.light" },
    { id: 8, name: "Restaurant", category: "Food", dateShort: "Mar 21, 2026", dateLong: "Mar 21, 2026 07:45 PM", status: "completed", amount: "-$87.50", positive: false, iconBgKey: "error.light" },
    { id: 9, name: "Refund", category: "Refund", dateShort: "Mar 20, 2026", dateLong: "Mar 20, 2026 11:20 AM", status: "completed", amount: "+$65.00", positive: true, iconBgKey: "success.light" },
    { id: 10, name: "Insurance Premium", category: "Insurance", dateShort: "Mar 19, 2026", dateLong: "Mar 19, 2026 10:00 AM", status: "completed", amount: "-$350.00", positive: false, iconBgKey: "error.light" },
  ] satisfies TransactionRecord[],

  beneficiaries: [
    { id: 1, name: "John Smith", initials: "JS", email: "john@example.com", phone: "+1 (555) 123-4567", bank: "JPMorgan Chase", account: "4523198760", gradient: gradients[0] },
    { id: 2, name: "Sarah Johnson", initials: "SJ", email: "sarah@example.com", phone: "+1 (555) 234-5678", bank: "Bank of America", account: "7834019256", gradient: gradients[1] },
    { id: 3, name: "Michael Brown", initials: "MB", email: "michael@example.com", phone: "+1 (555) 345-6789", bank: "Wells Fargo", account: "1092837465", gradient: gradients[2] },
    { id: 4, name: "Emily Davis", initials: "ED", email: "emily@example.com", phone: "+1 (555) 456-7890", bank: "Citibank", account: "3674829105", gradient: gradients[3] },
    { id: 5, name: "David Wilson", initials: "DW", email: "david@example.com", phone: "+1 (555) 567-8901", bank: "Bank of America", account: "6248103974", gradient: gradients[4] },
    { id: 6, name: "Jessica Miller", initials: "JM", email: "jessica@example.com", phone: "+1 (555) 678-9012", bank: "Deutsche Bank", account: "9150274683", gradient: gradients[5] },
  ] satisfies BeneficiaryRecord[],

  getNextBeneficiaryGradient() {
    return gradients[this.beneficiaries.length % gradients.length];
  },

  getNextBeneficiaryId() {
    return nextBeneficiaryId++;
  },
};
