import React from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Card from '../../../components/ui/Card'

export const PpdbStatusChart = ({ data }) => {
  if (!data || !data.labels || !data.data || data.labels.length === 0) {
    return (
      <Card title="PPDB Registration Status">
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No PPDB data available
        </div>
      </Card>
    )
  }

  const chartData = (Array.isArray(data.labels) ? data.labels : Object.values(data.labels)).map((label, index) => ({
    name: label,
    value: (Array.isArray(data.data) ? data.data : Object.values(data.data))[index] || 0,
  }))

  const COLORS = data.colors || ['#6B7280', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899']

  return (
    <Card title="PPDB Registration Status">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label={({ name, value }) => value > 0 ? `${name}: ${value}` : null}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}

export const PpdbMonthlyChart = ({ data }) => {
  if (!data || !data.labels || !data.data) {
    return (
      <Card title="Monthly PPDB Registrations">
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No data available
        </div>
      </Card>
    )
  }

  const chartData = data.labels.map((label, index) => ({
    name: label,
    pendaftar: data.data[index] || 0,
  }))

  return (
    <Card title="Monthly PPDB Registrations">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
          <XAxis
            dataKey="name"
            className="text-xs text-gray-600 dark:text-gray-400"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis className="text-gray-600 dark:text-gray-400" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          />
          <Bar dataKey="pendaftar" fill="#8b5cf6" name="Pendaftar" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}