import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const html = readFileSync(join(root, "index.html"), "utf8");
const photographs = {
  powerbank: "volt-10k.webp",
  garrafa: "flow-750.webp",
  luminaria: "halo-desk.webp",
  ingresso: "pocket-fest.webp",
};

describe("fotos locais dos produtos", () => {
  for (const [product, file] of Object.entries(photographs)) {
    it(`usa fotografia local para ${product}, sem voltar à ilustração SVG`, () => {
      expect(html).toContain(`"product_${product}":"assets/products/${file}"`);
      expect(existsSync(join(root, "public", "assets", "products", file))).toBe(true);
    });
  }
});
