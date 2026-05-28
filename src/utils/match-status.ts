import { MatchStatus, type Match } from "../generated/prisma/client";

export function getMatchStatus(
  startTime: Date,
  endTime: Date,
  now = new Date(),
) {
  if (
    Number.isNaN(startTime.getTime()) ||
    Number.isNaN(endTime.getTime())
  ) {
    return undefined;
  }

  if (now < startTime) {
    return MatchStatus.SCHEDULED;
  }

  if (now >= endTime) {
    return MatchStatus.FINISHED;
  }

  return MatchStatus.LIVE;
}

export async function syncMatchStatus(
  match: Match,
  updateStatus: (status: MatchStatus) => Promise<void>,
) {
  const nextStatus = getMatchStatus(
    match.startTime,
    match.endTime,
  ) as MatchStatus;

  if (!nextStatus) {
    return match.status;
  }
  if (match.status !== nextStatus) {
    await updateStatus(nextStatus);
    match.status = nextStatus;
  }
  return match.status;
}
