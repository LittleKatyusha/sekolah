import React from 'react'
import { Line } from 'recharts'
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Card from '../../../components/ui/Card'

const SPPTrendChart = ({ data }) => {
  if (!data || !data.labels || !data.datasets) {
    return (
      <Card title="SPP Payment Trend">
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No data available
        </div>
      </Card>
    )
  }

  // Transform API data to recharts format
  const chartData = data.labels.map((label, index) => ({
    name: label,
    pendapatan: data.datasets[0]?.data[index] || 0,
    transaksi: data.datasets[1]?.data[index] || 0,
  }))

  const formatCurrency = (value) => {
    return `Rp ${value.toLocaleString('id-ID')}`
  }

  return (
    <Card title="SPP Payment Trend">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
          <XAxis 
            dataKey="name" 
            className="text-xs text-gray-600 dark:text-gray-400"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            yAxisId="left"
            className="text-gray-600 dark:text-gray-400"
            tickFormatter={formatCurrency}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            className="text-gray-600 dark:text-gray-400"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--tooltip-bg)', 
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            formatter={(value, name) => {
              if (name === 'pendapatan') {
                return [formatCurrency(value), 'Pendapatan SPP']
              }
              return [value, 'Jumlah Transaksi']
            }}
          />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="pendapatan" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Pendapatan SPP"
            dot={{ fill: '#10b981' }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="transaksi" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Jumlah Transaksi"
            dot={{ fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

export default SPPTrendChart