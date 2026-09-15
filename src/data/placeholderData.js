/**
 * @deprecated Kept only for backward compatibility — the data was split into
 * per-domain files: home.js, reports.js, inventory.js, calculator.js, app.js
 * (+ orders.js, customers.js, workers.js, expenses.js, notifications.js).
 * Existing imports keep working through the re-exports below.
 */
export { homeStats, quickActions, recentActivities } from './home.js'
export { weeklyProduction, monthlyProduction, slabTypes, reportSummary } from './reports.js'
export { inventoryItems, sizeOptions, thicknessOptions, locationOptions } from './inventory.js'
export { pieceSizeOptions, calcHistory } from './calculator.js'
export {
  appFeatures,
  factoryInfo,
  managementTeam,
  factoryDesignations,
  featureIcon,
} from './app.js'
