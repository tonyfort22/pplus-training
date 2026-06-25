import { expect } from '@playwright/test'

export const DEFAULT_CSS_LOADED_OPTIONS = Object.freeze({
  minimumLoadedStyleSheets: 1,
  requireStylesheetLinks: true,
})

export async function assertCssLoaded(page, options = {}) {
  const {
    minimumLoadedStyleSheets = DEFAULT_CSS_LOADED_OPTIONS.minimumLoadedStyleSheets,
    requireStylesheetLinks = DEFAULT_CSS_LOADED_OPTIONS.requireStylesheetLinks,
    route = page.url(),
  } = options

  const cssState = await page.evaluate(() => {
    const stylesheetLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map((link) => link.href)
      .filter(Boolean)

    const styleSheets = Array.from(document.styleSheets).map((styleSheet) => {
      try {
        return {
          href: styleSheet.href,
          ruleCount: styleSheet.cssRules.length,
          loaded: styleSheet.cssRules.length > 0,
          error: null,
        }
      } catch (error) {
        return {
          href: styleSheet.href,
          ruleCount: 0,
          loaded: false,
          error: error instanceof Error ? error.name : String(error),
        }
      }
    })

    return {
      stylesheetLinks,
      styleSheets,
      loadedStyleSheets: styleSheets.filter((styleSheet) => styleSheet.loaded),
      inaccessibleStyleSheets: styleSheets.filter((styleSheet) => styleSheet.error),
    }
  })

  if (requireStylesheetLinks) {
    expect(
      cssState.stylesheetLinks.length,
      `expected ${route} to include stylesheet link tags`,
    ).toBeGreaterThan(0)
  }

  expect(
    cssState.styleSheets.length,
    `expected ${route} to expose document.styleSheets`,
  ).toBeGreaterThanOrEqual(minimumLoadedStyleSheets)

  expect(
    cssState.loadedStyleSheets.length,
    `expected ${route} to have loaded CSS rules; state=${JSON.stringify(cssState)}`,
  ).toBeGreaterThanOrEqual(minimumLoadedStyleSheets)

  return cssState
}
