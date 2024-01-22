import { test, expect } from '@playwright/test'
import { httpServerAddress } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto(httpServerAddress)
})

test('niivue defaultOptions set correctly', async ({ page }) => {
  const opts = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const nv = new Niivue()
    await nv.attachTo('gl', false)
    return nv.opts
  })

  expect(opts.textHeight).toEqual(0.06)
  expect(opts.colorbarHeight).toEqual(0.05)
  expect(opts.crosshairWidth).toEqual(1)
  expect(opts.backColor).toEqual([0, 0, 0, 1])
  expect(opts.crosshairColor).toEqual([1, 0, 0, 1])
  expect(opts.selectionBoxColor).toEqual([1, 1, 1, 0.5])
  expect(opts.colorbarMargin).toEqual(0.05)
})
