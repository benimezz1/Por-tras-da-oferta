import { expect, type Page } from "@playwright/test";

/** Recusa o aviso de tela cheia do "momento do dia", se estiver aberto. */
export async function dismissMoment(page: Page) {
  const no = page.locator('[data-action="moment-no"]');
  if (await no.count()) await no.click();
}

/** Carrega o feed até a noite acontecer: só então "Dormir" destrava. */
export async function readyToSleep(page: Page) {
  for (let i = 0; i < 8 && (await page.locator(".day-sleep-control.locked").count()); i++) {
    await dismissMoment(page);
    await page.locator(".load-more").evaluate((b: HTMLElement) => b.click());
  }
  await dismissMoment(page);
  await expect(page.locator(".day-sleep-control.locked")).toHaveCount(0);
}

/** Encerra o dia pelo botão ou pelo menu. O momento do dia, se ainda não
 * respondido, aparece antes de dormir: recusa e tenta de novo. */
export async function sleepDay(page: Page, via: "button" | "menu" = "button") {
  await readyToSleep(page);
  const press = async () => {
    if (via === "menu") {
      await page.locator('[data-action="day-menu"]').click();
      await page.locator('[data-action="end-day"]').click();
    } else await page.locator(".day-sleep-control").click();
  };
  await press();
  if (await page.locator('[data-action="moment-no"]').count()) {
    await dismissMoment(page);
    await press();
  }
}
