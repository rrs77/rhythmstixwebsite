import { db, appsTable } from "@workspace/db";
import { inArray } from "drizzle-orm";

const SLUGS_TO_HIDE = [
  "progresspath",
  "assessment-log",
  "online-game",
  "rhythmstix-portal",
];

async function main() {
  const before = await db
    .select({
      id: appsTable.id,
      slug: appsTable.slug,
      published: appsTable.published,
    })
    .from(appsTable)
    .where(inArray(appsTable.slug, SLUGS_TO_HIDE));

  console.log("Before:", before);

  const updated = await db
    .update(appsTable)
    .set({ published: false })
    .where(inArray(appsTable.slug, SLUGS_TO_HIDE))
    .returning({
      id: appsTable.id,
      slug: appsTable.slug,
      published: appsTable.published,
    });

  console.log("After:", updated);
  console.log(`Updated ${updated.length} row(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
