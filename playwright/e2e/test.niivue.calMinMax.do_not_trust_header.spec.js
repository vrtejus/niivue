import { test, expect } from '@playwright/test'
import { httpServerAddress, testOptions } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto(httpServerAddress)
})

test('niivue calMinMax do not trust header cal min max', async ({ page }) => {
  const minmax = await page.evaluate(async (testOptions) => {
    const opts = {
      ...testOptions,
      textHeight: 0.05, // larger text
      crosshairColor: [0, 0, 1, 1], // green
      trustCalMinMax: false
    }
    const nv = new niivue.Niivue(opts)
    await nv.attachTo('gl', false)

    // load one volume object in an array
    const volumeList = [
      {
        url: './images/mni152.nii.gz', // "./RAS.nii.gz", "./spm152.nii.gz",
        volume: { hdr: null, img: null },
        name: 'mni152.nii.gz',
        colormap: 'gray',
        opacity: 1,
        visible: true
      }
    ]

    await nv.loadVolumes(volumeList)
    const overlayItem = nv.volumes[0]
    const minmax = overlayItem.calMinMax()
    return minmax
  })
  const expected = [40, 80, 0, 91.46501398086548]
  for (let i = 0; i < minmax.length; i++) {
    expect(minmax[i]).toBeCloseTo(expected[i])
  }
})