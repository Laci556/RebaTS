import { $ } from "bun";
import { readdir } from "node:fs/promises";
import path from "node:path";

type PackageInfo = {
  packageJson: { name: string; version: string; private?: boolean };
  status: "publishing" | "skipped" | "failed";
};

const packages = await readdir(path.join(import.meta.dir, "packages"));
const packagesToPublish = await Promise.all(
  packages.map(async (pkg): Promise<PackageInfo> => {
    const packageJson = require(
      path.join(import.meta.dir, "packages", pkg, "package.json"),
    ) as PackageInfo["packageJson"];

    try {
      if (packageJson.private) {
        return { packageJson, status: "skipped" };
      }

      const [, npmPackageVersion] = (
        await $`npm info ${packageJson.name}`.text()
      ).match(/latest: (.*)/)!;

      if (npmPackageVersion === packageJson.version) {
        return { packageJson, status: "skipped" };
      }

      return { packageJson, status: "publishing" };
    } catch (error) {
      return { packageJson, status: "failed" };
    }
  }),
);

if (
  packagesToPublish.filter((pkg) => pkg.status === "publishing").length === 0
) {
  console.log("No packages to publish");
  process.exit(0);
}

await $`bunx turbo run publish-package ${{
  raw: packagesToPublish
    .filter((pkg) => pkg.status === "publishing")
    .map((pkg) => `--filter=${pkg.packageJson.name}`)
    .join(" "),
}}`;
