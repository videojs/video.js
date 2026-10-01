import { expect, type Frame, type Page, test } from '@playwright/test';

const SANDBOX_BASE = process.env.SANDBOX_URL ?? 'http://localhost:5299';

const QUERY = 'skin=default&source=mp4-1&autoplay=0&muted=1&loop=0&preload=metadata';

test.use({ trace: 'off' });

async function getPanelFrame(page: Page, id: string): Promise<Frame> {
  const iframe = page.locator(`iframe[data-panel="${id}"]`);

  await expect(iframe).toBeVisible();

  const url = await iframe.getAttribute('src');
  if (!url) throw new Error(`Panel ${id} has no frame URL.`);

  await expect
    .poll(() =>
      page
        .frames()
        .find((frame) => frame.url().endsWith(url))
        ?.url()
    )
    .toBeDefined();

  const frame = page.frames().find((frame) => frame.url().endsWith(url));
  if (!frame) throw new Error(`Panel ${id} frame not found.`);

  return frame;
}

async function playerBox(frame: Frame) {
  const root = frame.getByRole('group', { name: 'Media player' }).first();

  await expect(root).toBeVisible({ timeout: 15_000 });

  const box = await root.boundingBox();
  if (!box) throw new Error('Expected the media player to have a rendered box.');

  return box;
}

async function markDocuments(frames: Frame[]) {
  return Promise.all(
    frames.map(async (frame) => {
      await playerBox(frame);
      await frame.waitForLoadState('load');

      return frame.evaluate(() => {
        const token = crypto.randomUUID();

        document.documentElement.dataset.auditDocument = token;
        return token;
      });
    })
  );
}

async function expectDocuments(frames: Frame[], tokens: string[]) {
  for (const [index, frame] of frames.entries()) {
    await expect(frame.locator('html')).toHaveAttribute('data-audit-document', tokens[index]!);
  }
}

test.describe('Sandbox compare', () => {
  for (const platform of ['html', 'react']) {
    test(`changes the ${platform} aspect ratio in both panels without reloading`, async ({ page }) => {
      await page.setViewportSize({ width: 1600, height: 1000 });
      await page.goto(
        `${SANDBOX_BASE}/?platform=${platform}&media=video&skins=authored&compare=styling&layout=row&width=480&${QUERY}`
      );

      const frames = await Promise.all([getPanelFrame(page, 'css'), getPanelFrame(page, 'tailwind')]);
      const tokens = await markDocuments(frames);
      const options = page.getByRole('button', { name: 'Options', exact: true });

      if ((await options.getAttribute('aria-expanded')) !== 'true') await options.click();

      for (const [label, height] of [
        ['4:3', 360],
        ['1:1', 480],
        ['9:16', 853],
        ['21:9', 206],
        ['Intrinsic', 270],
        ['16:9', 270],
      ] as const) {
        await page.getByRole('combobox', { name: 'Aspect ratio', exact: true }).click();
        await page.getByRole('option', { name: label, exact: true }).click();

        for (const frame of frames) {
          await expect.poll(async () => Math.round((await playerBox(frame)).height)).toBe(height);
        }

        await expectDocuments(frames, tokens);
        const ratio = new URL(page.url()).searchParams.get('ratio');

        expect(ratio).toBe(label === '16:9' ? null : label.toLowerCase());
      }

      await page.getByRole('combobox', { name: 'Aspect ratio', exact: true }).click();
      await page.getByRole('option', { name: '4:3', exact: true }).click();

      for (const frame of frames) {
        await expect.poll(async () => Math.round((await playerBox(frame)).height)).toBe(360);
      }

      await expectDocuments(frames, tokens);
      await page.reload();
      await expect(page.getByRole('combobox', { name: 'Aspect ratio', exact: true })).toHaveText('4:3');

      for (const id of ['css', 'tailwind']) {
        await expect.poll(async () => Math.round((await playerBox(await getPanelFrame(page, id))).height)).toBe(360);
      }
    });
  }

  test('compares the two stylings side by side with one width', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(`${SANDBOX_BASE}/?platform=react&media=video&compare=styling&layout=row&width=480&${QUERY}`, {
      waitUntil: 'domcontentloaded',
    });

    const css = page.locator('iframe[data-panel="css"]');
    const tailwind = page.locator('iframe[data-panel="tailwind"]');

    await expect(css).toHaveAttribute('src', /styling=css/);
    await expect(css).toHaveAttribute('src', /skins=package/);
    await expect(tailwind).toHaveAttribute('src', /styling=tailwind/);
    await expect(tailwind).toHaveAttribute('src', /skins=registry/);
    await expect(page.locator('[data-panel="css"] header')).toHaveText(/CSS/);
    await expect(page.locator('[data-panel="tailwind"] header')).toHaveText(/Tailwind/);

    const [left, right] = await Promise.all([
      playerBox(await getPanelFrame(page, 'css')),
      playerBox(await getPanelFrame(page, 'tailwind')),
    ]);

    expect(Math.round(left.width)).toBe(480);
    expect(Math.round(right.width)).toBe(480);

    const [cssBox, tailwindBox] = await Promise.all([css.boundingBox(), tailwind.boundingBox()]);

    expect(cssBox && tailwindBox && cssBox.x + cssBox.width <= tailwindBox.x).toBe(true);
    expect(cssBox && tailwindBox && Math.abs(cssBox.y - tailwindBox.y) < 2).toBe(true);
  });

  test('stacks the html and react players when asked', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&compare=platform&layout=column&${QUERY}`, {
      waitUntil: 'domcontentloaded',
    });

    const html = page.locator('iframe[data-panel="html"]');
    const react = page.locator('iframe[data-panel="react"]');

    await expect(html).toHaveAttribute('src', /^\/html-video\//);
    await expect(react).toHaveAttribute('src', /^\/react-video\//);

    await playerBox(await getPanelFrame(page, 'html'));

    const [htmlBox, reactBox] = await Promise.all([html.boundingBox(), react.boundingBox()]);

    expect(htmlBox && reactBox && htmlBox.y + htmlBox.height <= reactBox.y).toBe(true);
    expect(htmlBox && reactBox && Math.abs(htmlBox.x - reactBox.x) < 2).toBe(true);
    await expect(page.getByRole('button', { name: 'Stacked' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('states the selection and switches compare off for a media without a skin choice', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/?platform=react&media=mux-video&compare=skin&${QUERY}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByTestId('selection-summary')).toHaveText(
      /React · Mux Video · Default · CSS · from the package/
    );
    await expect(page.locator('iframe[data-panel]')).toHaveCount(2);

    await page.getByRole('combobox', { name: 'Media', exact: true }).click();
    await page.getByRole('option', { name: 'Background Video', exact: true }).click();

    await expect(page.locator('iframe[data-panel]')).toHaveCount(1);
    await expect(page).not.toHaveURL(/[?&]compare=/);
    await expect(page.getByTestId('selection-summary')).toHaveText(/React · Background Video · fixed source/);
  });

  test('the layout group supports keyboard selection and keeps a selected segment', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&compare=platform&${QUERY}`);
    const stacked = page.getByRole('button', { name: 'Stacked', exact: true });

    await page.getByRole('button', { name: 'Auto', exact: true }).focus();
    await page.keyboard.press('End');
    await expect(stacked).toBeFocused();
    await page.keyboard.press('Space');
    await expect(stacked).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/[?&]layout=column(?:&|$)/);
    await stacked.click();
    await expect(stacked).toHaveAttribute('aria-pressed', 'true');
  });

  for (const layout of ['row', 'column']) {
    test(`resizes ${layout} comparisons by keyboard and pointer without reloading players`, async ({ page }) => {
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&compare=platform&layout=${layout}&${QUERY}`);
      const frames = await Promise.all([getPanelFrame(page, 'html'), getPanelFrame(page, 'react')]);
      const tokens = await markDocuments(frames);
      const panels = ['html', 'react'].map((id) => page.locator(`iframe[data-panel="${id}"]`));
      const dimension = layout === 'row' ? 'width' : 'height';
      const sizes = () => Promise.all(panels.map(async (panel) => (await panel.boundingBox())![dimension]));
      const initialSizes = await sizes();
      const divider = page.getByRole('separator', { name: 'Resize comparison panels' });

      await expect(divider).toHaveAttribute('aria-orientation', layout === 'row' ? 'vertical' : 'horizontal');
      await expect(divider).toHaveAttribute('aria-valuenow', '50');
      await divider.press(layout === 'row' ? 'ArrowRight' : 'ArrowDown');
      await expect.poll(async () => Number(await divider.getAttribute('aria-valuenow'))).toBeGreaterThan(50);
      await expect.poll(async () => (await sizes())[0]!).toBeGreaterThan(initialSizes[0]!);
      await expect.poll(async () => (await sizes())[1]!).toBeLessThan(initialSizes[1]!);
      await expectDocuments(frames, tokens);
      const keyboardSizes = await sizes();
      const before = Number(await divider.getAttribute('aria-valuenow'));
      const box = await divider.boundingBox();
      if (!box) throw new Error('Expected a comparison divider.');

      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;

      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + (layout === 'row' ? 100 : 0), y + (layout === 'column' ? 100 : 0), { steps: 10 });
      await page.mouse.up();
      await expect.poll(async () => Number(await divider.getAttribute('aria-valuenow'))).toBeGreaterThan(before);
      await expect.poll(async () => (await sizes())[0]!).toBeGreaterThan(keyboardSizes[0]!);
      await expect.poll(async () => (await sizes())[1]!).toBeLessThan(keyboardSizes[1]!);
      await expectDocuments(frames, tokens);
    });
  }

  for (const width of [800, 1400]) {
    test(`auto chooses its initial direction at ${width}px before resize delivery`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(() => {
        const Observer = window.ResizeObserver;

        window.ResizeObserver = class extends Observer {
          constructor(callback: ResizeObserverCallback) {
            super((entries, observer) => {
              // Hold back the preview measurement while other components resize normally.
              const remaining = entries.filter((entry) => entry.target.tagName !== 'MAIN');

              if (remaining.length) callback(remaining, observer);
            });
          }
        };
      });
      await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&compare=platform&${QUERY}`);

      await expect(page.getByRole('separator', { name: 'Resize comparison panels' })).toHaveAttribute(
        'aria-orientation',
        width >= 1024 ? 'vertical' : 'horizontal'
      );
    });
  }

  test('auto changes the resize direction with the available preview width', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&compare=platform&${QUERY}`);
    const frames = await Promise.all([getPanelFrame(page, 'html'), getPanelFrame(page, 'react')]);
    const tokens = await markDocuments(frames);
    const divider = page.getByRole('separator', { name: 'Resize comparison panels' });

    await expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    await page.setViewportSize({ width: 800, height: 900 });
    await expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
    await expectDocuments(frames, tokens);
  });
});
