import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for stale online users every 30 seconds
crons.interval(
  "check-stale-users",
  { seconds: 30 },
  internal.users.checkStaleUsers
);

export default crons;
