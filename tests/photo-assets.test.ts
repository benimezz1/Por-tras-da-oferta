import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const match = html.match(/const originalPhotoSources=(\{.*?\});/s);
if (!match) throw new Error("Mapa de imagens originalPhotoSources não encontrado");

const sources = JSON.parse(match[1]) as Record<string, number>;
const imageFolder = resolve(root, "public/assets/social/unique");

describe("fotografias independentes de feed e stories", () => {
  it("fornece uma imagem original distinta para cada componente", () => {
    const keys = Object.keys(sources);
    expect(keys.filter((k) => /^post_p\d+$/.test(k))).toHaveLength(12);
    expect(keys.filter((k) => /^story_(fone|tenis|plano|mochila)_\d+$/.test(k))).toHaveLength(12);
    expect(keys.filter((k) => k.startsWith("product_"))).toHaveLength(5);
    expect(keys.filter((k) => k.startsWith("avatar_"))).toHaveLength(7);
    expect(new Set(Object.values(sources)).size).toBe(36);
  });

  it("empacota as 36 fotografias em JPEG local, leve e sem duplicações binárias", () => {
    const fingerprints: string[] = [];
    for (const key of Object.keys(sources)) {
      const photo = resolve(imageFolder, key.replaceAll("_", "-") + ".jpg");
      expect(existsSync(photo), photo).toBe(true);
      const size = statSync(photo).size;
      expect(size, photo).toBeGreaterThan(20_000);
      expect(size, photo).toBeLessThan(350_000);
      const contents = readFileSync(photo);
      expect(contents[0], photo).toBe(0xff);
      expect(contents[1], photo).toBe(0xd8);
      fingerprints.push(createHash("sha256").update(contents).digest("hex"));
    }
    expect(new Set(fingerprints).size).toBe(fingerprints.length);
  });

  it("mantém a lista de fontes para atribuição e auditoria", () => {
    const manifest = JSON.parse(readFileSync(resolve(imageFolder, "sources.json"), "utf8")) as {
      images: { asset: string; pexels_photo_id: number }[];
    };
    expect(manifest.images).toHaveLength(36);
    expect(new Set(manifest.images.map((item) => item.asset)).size).toBe(36);
    for (const item of manifest.images) {
      const key = item.asset.replace(/\.jpg$/, "").replaceAll("-", "_");
      expect(sources[key], item.asset).toBe(item.pexels_photo_id);
    }
  });
});
