import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateWorkPackage } from "./workPackageValidator.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workPackage = JSON.parse(fs.readFileSync(path.resolve(root, "public/data/aq-substrate-v2-development.json"), "utf8"));
const sourceText = fs.readFileSync(path.resolve(root, "public/books/luxun-aq-zh.txt"), "utf8");
const issues = validateWorkPackage(workPackage, sourceText);
if (issues.length) { console.error(JSON.stringify({ valid: false, issues }, null, 2)); process.exitCode = 1; }
else console.log(JSON.stringify({ valid: true, packageId: workPackage.package_id, checked: "schema shape + referential integrity + exact source grounding" }, null, 2));
