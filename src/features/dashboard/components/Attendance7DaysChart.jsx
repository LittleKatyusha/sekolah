import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Card from '../../../components/ui/Card'

const Attendance7DaysChart = ({ data }) => {
  if (!data || !data.labels || !data.datasets) {
    return (
      <Card title="7-Day Attendance Trend">
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No data available
        </div>
      </Card>
    )
  }

  // Transform API data to recharts format
  const chartData = data.labels.map((label, index) => {
    const dataPoint = { name: label }
    data.datasets.forEach(dataset => {
      dataPoint[dataset.label] = dataset.data[index] || 0
    })
    return dataPoint
  })

  return (
    <Card title="7-Day Attendance Trend">
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
          <Legend />
          {data.datasets.map((dataset, index) => (
            <Bar 
              key={index}
              dataKey={dataset.label} 
              fill={dataset.color} 
              name={dataset.label}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

export default Attendance7DaysChart