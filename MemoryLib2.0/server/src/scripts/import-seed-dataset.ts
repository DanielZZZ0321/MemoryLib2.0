import "../load-env.js";
import { importSeedDataset, readSeedFile } from "../services/seed-dataset.js";

const seedArg = process.argv[2];

if (!seedArg) {
  console.error(
    "Usage: npm run seed:import -w server -- ../data/seed/frontend-backend-campus-life.json",
  );
  process.exit(1);
}

void readSeedFile(seedArg)
  .then((seed) => importSeedDataset(seed))
  .then((result) => {
    console.log(
      `[seed:import] ${result.seedSource}: imported ${result.events} events into "${result.workspace}"`,
    );
  })
  .catch((error) => {
    console.error("[seed:import] failed", error);
    process.exitCode = 1;
  });
