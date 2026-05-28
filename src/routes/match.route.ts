import { Router, type Request, type Response } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validations/matches";
import { prisma } from "../db/db";
import { getMatchStatus } from "../utils/match-status";
import type { MatchStatus } from "../generated/prisma/enums";
import { Prisma } from "../generated/prisma/client";

export const matchRouter = Router();

const MAX_LIMT = 100;

matchRouter.get("/", async (req: Request, res: Response) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid Payload",
      details: JSON.stringify(parsed.error),
    });
  }

  const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMT);

  try {
    const data = await prisma.match.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return res.status(200).json({ data });
  } catch (e) {
    return res.status(500).json({ error: "Failed to list matches" });
  }
});

matchRouter.post("/", async (req: Request, res: Response) => {
  const parsed = createMatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid Payload",
      details: JSON.stringify(parsed.error),
    });
  }

  const {
    data: { startTime, endTime, homeScore, awayScore },
  } = parsed;

  try {
    const event = await prisma.match.create({
      data: {
        ...parsed.data,
        startTime: startTime,
        endTime: endTime,
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime) as MatchStatus,
      },
    });

    return res.status(201).json({ data: [event] });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return res.status(409).json({
        error: "A match with these details already exists",
      });
    }

    return res.status(500).json({
      error: "Failed to create match",
    });
  }
});
