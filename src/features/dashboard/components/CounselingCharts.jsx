import React from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Card from '../../../components/ui/Card'

export const TopKategoriKasusChart = ({ data }) => {
  if (!data || !data.labels || !data.data || data.labels.length === 0) {
    return (
      <Card title="Top Case Categories">
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No case data available
        </div>
      </Card>
    )
  }

  const chartData = data.labels.map((label, index) => ({
    name: label,
    value: data.data[index] || 0,
  }))

  return (
    <Card title="Top Case Categories">
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
          <Bar dataKey="value" fill="#3b82f6" name="Total Cases" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

export const StatusPenyelesaianChart = ({ data }) => {
  if (!data || !data.labels || !data.data) {
    return (
      <Card title="Case Resolution Status">
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No data available
        </div>
      </Card>
    )
  }

  const chartData = data.labels.map((label, index) => ({
    name: label,
    value: data.data[index] || 0,
    percentage: data.percentages[index] || 0,
  }))

  const COLORS = data.colors || ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percentage === 0) return null

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-bold"
      >
        {`${percentage}%`}
      </text>
    )
  }

  return (
    <Card title="Case Resolution Status">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name, props) => [value, props.payload.name]}
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

export const KasusPerBulanChart = ({ data }) => {
  if (!data || !data.labels || !data.data) {
    return (
      <Card title="Monthly Cases">
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No data available
        </div>
      </Card>
    )
  }

  const chartData = data.labels.map((label, index) => ({
    name: label,
    kasus: data.data[index] || 0,
  }))

  return (
    <Card title="Monthly Cases">
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
          <Bar dataKey="kasus" fill="#f59e0b" name="Cases" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}