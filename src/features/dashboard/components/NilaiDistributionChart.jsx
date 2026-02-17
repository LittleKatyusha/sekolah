import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import Card from '../../../components/ui/Card'

const NilaiDistributionChart = ({ data }) => {
  if (!data || !data.labels || !data.data) {
    return (
      <Card title="Grade Distribution">
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No data available
        </div>
      </Card>
    )
  }

  // Transform API data to recharts format
  const chartData = data.labels.map((label, index) => ({
    name: label,
    value: data.data[index] || 0,
    percentage: data.percentages[index] || 0,
  }))

  const COLORS = data.colors || ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#6B7280']

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
    <Card title="Grade Distribution">
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

export default NilaiDistributionChart