import { Router, type IRouter } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq, ilike, and, asc, desc, sql } from "drizzle-orm";
import {
  CreateTransactionBody,
  UpdateTransactionBody,
  ListTransactionsQueryParams,
  GetTransactionParams,
  UpdateTransactionParams,
  DeleteTransactionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const query = ListTransactionsQueryParams.parse(req.query);
    const conditions = [];

    if (query.category) {
      conditions.push(eq(transactionsTable.category, query.category));
    }
    if (query.type) {
      conditions.push(eq(transactionsTable.type, query.type as "income" | "expense"));
    }
    if (query.search) {
      conditions.push(ilike(transactionsTable.description, `%${query.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderClause;
    const sortOrder = query.sortOrder === "asc" ? asc : desc;
    if (query.sortBy === "amount") {
      orderClause = sortOrder(sql`${transactionsTable.amount}::numeric`);
    } else {
      orderClause = sortOrder(transactionsTable.date);
    }

    const transactions = await db
      .select()
      .from(transactionsTable)
      .where(whereClause)
      .orderBy(orderClause);

    res.json(
      transactions.map((t) => ({
        ...t,
        amount: parseFloat(t.amount),
        createdAt: t.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list transactions");
    res.status(500).json({ error: "Failed to list transactions" });
  }
});

router.post("/", async (req, res) => {
  try {
    const body = CreateTransactionBody.parse(req.body);
    const [created] = await db
      .insert(transactionsTable)
      .values({
        date: body.date,
        amount: body.amount.toString(),
        category: body.category,
        type: body.type,
        description: body.description,
      })
      .returning();

    res.status(201).json({
      ...created,
      amount: parseFloat(created.amount),
      createdAt: created.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create transaction");
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = GetTransactionParams.parse({ id: parseInt(req.params.id) });
    const [transaction] = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, id));

    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    res.json({
      ...transaction,
      amount: parseFloat(transaction.amount),
      createdAt: transaction.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get transaction");
    res.status(500).json({ error: "Failed to get transaction" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = UpdateTransactionParams.parse({ id: parseInt(req.params.id) });
    const body = UpdateTransactionBody.parse(req.body);

    const updateData: Record<string, unknown> = {};
    if (body.date !== undefined) updateData.date = body.date;
    if (body.amount !== undefined) updateData.amount = body.amount.toString();
    if (body.category !== undefined) updateData.category = body.category;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.description !== undefined) updateData.description = body.description;

    const [updated] = await db
      .update(transactionsTable)
      .set(updateData)
      .where(eq(transactionsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    res.json({
      ...updated,
      amount: parseFloat(updated.amount),
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update transaction");
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = DeleteTransactionParams.parse({ id: parseInt(req.params.id) });
    await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete transaction");
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

export default router;
