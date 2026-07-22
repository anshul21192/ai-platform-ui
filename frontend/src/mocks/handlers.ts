import { http, HttpResponse } from "msw";
import { db } from "./db";

export const handlers = [
  // GET /api/summaryTransactions - returns summary view for dashboard
  http.get("/api/summaryTransactions", () => {
    const data = db.transactions.map(({ name, dateShort, status, amount, positive, iconBgKey }) => ({
      name,
      date: dateShort,
      status,
      amount,
      positive,
      iconBgKey,
    }));
    return HttpResponse.json(data);
  }),

  // GET /api/detailedTransactions - returns detailed view for transactions page
  http.get("/api/detailedTransactions", ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const statusFilters = url.searchParams.getAll("status");

    let data = db.transactions.map(({ name, category, dateLong, status, amount, positive }) => ({
      name,
      category,
      date: dateLong,
      status,
      amount,
      positive,
    }));

    if (search) {
      data = data.filter(
        (tx) =>
          tx.name.toLowerCase().includes(search) ||
          tx.category.toLowerCase().includes(search),
      );
    }

    if (statusFilters.length > 0) {
      data = data.filter((tx) => statusFilters.includes(tx.status));
    }

    return HttpResponse.json(data);
  }),

  // GET /api/listBeneficiary - returns all beneficiaries
  http.get("/api/listBeneficiary", () => {
    return HttpResponse.json(db.beneficiaries);
  }),

  // POST /api/addBeneficiary - adds a new beneficiary
  http.post("/api/addBeneficiary", async ({ request }) => {
    const body = (await request.json()) as Omit<typeof db.beneficiaries[number], "id" | "gradient">;
    const newBeneficiary = {
      id: db.getNextBeneficiaryId(),
      ...body,
      gradient: db.getNextBeneficiaryGradient(),
    };
    db.beneficiaries.push(newBeneficiary);
    return HttpResponse.json(newBeneficiary, { status: 201 });
  }),

  // PATCH /api/updateBeneficiary - updates an existing beneficiary
  http.patch("/api/updateBeneficiary", async ({ request }) => {
    const body = (await request.json()) as typeof db.beneficiaries[number];
    const index = db.beneficiaries.findIndex((b) => b.id === body.id);
    if (index === -1) {
      return HttpResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }
    db.beneficiaries[index] = { ...db.beneficiaries[index], ...body };
    return HttpResponse.json(db.beneficiaries[index]);
  }),

  // DELETE /api/deleteBeneficiary - deletes a beneficiary
  http.delete("/api/deleteBeneficiary", async ({ request }) => {
    const body = (await request.json()) as { id: number };
    const index = db.beneficiaries.findIndex((b) => b.id === body.id);
    if (index === -1) {
      return HttpResponse.json({ error: "Beneficiary not found" }, { status: 404 });
    }
    db.beneficiaries.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),

  // POST /api/v1/fraud/telemetry/events - receives event telemetry for fraud detection
  // http.post("/api/v1/fraud/telemetry/events", async ({ request }) => {
  //   const body = (await request.json()) as { sessionId: string; events: unknown[] };
  //   console.log(`[MSW] Received ${body.events.length} events for session ${body.sessionId}`);
  //   return HttpResponse.json({ received: body.events.length, status: "ok" });
  // }),
];
