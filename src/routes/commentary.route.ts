import { Router, type Request, type Response } from "express";
import { matchIdParamSchema } from "../validations/matches.js";
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validations/commentary.js";
import { prisma } from "../db/db.js";
import { Prisma } from "../generated/prisma/client.js";

export const commentaryRouter = Router();

const MAX_LIMIT = 100;

commentaryRouter.get("/:id", async (req: Request, res: Response) => {
  const parsedParams = matchIdParamSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return res.status(400).json({
      error: "Invalid params",
      details: JSON.stringify(parsedParams.error),
    });
  }

  const parsedQuery = listCommentaryQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    return res.status(400).json({
      error: "Invalid query",
      details: JSON.stringify(parsedQuery.error),
    });
  }

  const limit = Math.min(
    parsedQuery.data.limit ?? MAX_LIMIT,
    MAX_LIMIT,
  );

  try {
    const data = await prisma.commentary.findMany({
      where: { matchId: parsedParams.data.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return res.status(200).json({ data });
  } catch (e) {
    return res
      .status(500)
      .json({ error: "Failed to fetch commentary" });
  }
});

commentaryRouter.post("/:id", async (req: Request, res: Response) => {
  const parsedParams = matchIdParamSchema.safeParse(req.params);

  if (!parsedParams.success) {
    return res.status(400).json({
      error: "Invalid params",
      details: JSON.stringify(parsedParams.error),
    });
  }

  const parsedBody = createCommentarySchema.safeParse(req.body);

  if (!parsedBody.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: JSON.stringify(parsedBody.error),
    });
  }

  try {
    const { metadata, ...rest } = parsedBody.data;

    const commentary = await prisma.commentary.create({
      data: {
        ...rest,
        matchId: parsedParams.data.id,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });

    if (res.app.locals.broadcastCommentary) {
      res.app.locals.broadcastCommentary(
        commentary.matchId,
        commentary,
      );
    }

    return res.status(201).json({ data: [commentary] });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2003") {
        return res.status(404).json({ error: "Match not found" });
      }
      if (e.code === "P2002") {
        return res.status(409).json({
          error:
            "Commentary with this sequence already exists for the match",
        });
      }
    }

    return res
      .status(500)
      .json({ error: "Failed to create commentary" });
  }
});
