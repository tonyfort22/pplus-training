#!/usr/bin/env node
import { getWebPageCoverageSummary } from './page-test-manifest.js'

const summary = getWebPageCoverageSummary()
const asJson = process.argv.includes('--json')

if (asJson) {
  console.log(JSON.stringify(summary, null, 2))
  process.exit(0)
}

console.log('Web coverage summary')
console.log(`Routes: ${summary.routeCount}`)
console.log(`Layers: ${summary.layerCount}`)
console.log(`Route-layer mappings: ${summary.totalRouteLayerMappings}`)
console.log(`Unique route-mapped test files: ${summary.uniqueTestFileCount}`)

console.log('\nBy route')
for (const route of summary.byRoute) {
  console.log(`- ${route.path}`)
  console.log(`  area: ${route.area}`)
  console.log(`  auth: ${route.authState}`)
  console.log(`  layers: ${route.layers.join(', ')}`)
  console.log(`  test files: ${route.testFileCount}`)
}

console.log('\nBy layer')
for (const layer of summary.byLayer) {
  console.log(`- ${layer.layer}`)
  console.log(`  routes: ${layer.routeCount}`)
  console.log(`  test files: ${layer.testFileCount}`)
  console.log(`  route list: ${layer.routes.join(', ') || '(none)'}`)
}
