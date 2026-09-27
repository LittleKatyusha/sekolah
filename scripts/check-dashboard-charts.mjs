// Run: node scripts/check-dashboard-charts.mjs
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true } })
try {
  const { default: NilaiDistributionChart } = await server.ssrLoadModule('/src/features/dashboard/components/NilaiDistributionChart.jsx')
  const { StatusPenyelesaianChart } = await server.ssrLoadModule('/src/features/dashboard/components/CounselingCharts.jsx')
  for (const Chart of [NilaiDistributionChart, StatusPenyelesaianChart]) {
    for (const data of [undefined, {}, { labels: [], data: [] }, { labels: ['A', 'B'], data: [0, 0] }, { labels: ['A'], data: [null] }]) {
      const html = renderToStaticMarkup(React.createElement(Chart, { data }))
      assert.match(html, /Belum ada data/)
      assert.doesNotMatch(html, /recharts-responsive-container/)
    }
    for (const data of [{ labels: ['A', 'B'], data: [0, 5] }, { labels: ['A'], data: [5], percentages: [100] }]) {
      const html = renderToStaticMarkup(React.createElement(Chart, { data }))
      assert.doesNotMatch(html, /Belum ada data/)
      assert.match(html, /recharts-responsive-container/)
    }
  }
  console.log('PASS: dashboard charts handle missing, empty, zero, positive data and optional percentages.')
} finally {
  await server.close()
}