'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const test_1 = require('@playwright/test')
const index_1 = require('../../dist/index')
const helpers_1 = require('./helpers')
const test_types_1 = require('./test.types')
test_1.test.beforeEach(async ({ page }) => {
  await page.goto(helpers_1.httpServerAddress)
})
;(0, test_1.test)('niivue setCrosshairColor', async ({ page }) => {
  const crosshairColor = await page.evaluate(async (testOptions) => {
    const nv = new index_1.Niivue(testOptions)
    await nv.attachTo('gl')
    // load one volume object in an array
    const volumeList = [
      {
        url: './images/mni152.nii.gz',
        volume: { hdr: null, img: null },
        name: 'mni152.nii.gz',
        colormap: 'gray',
        opacity: 1,
        visible: true
      }
    ]
    await nv.loadVolumes(volumeList)
    nv.setCrosshairColor([0, 1, 0, 1]) // green (rgba)
    return nv.opts.crosshairColor
  }, test_types_1.TEST_OPTIONS)
  ;(0, test_1.expect)(crosshairColor).toEqual([0, 1, 0, 1])
  await (0, test_1.expect)(page).toHaveScreenshot({ timeout: 30000 })
})
// # sourceMappingURL=test.niivue.setCrosshairColor.spec.js.map
