import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Card from '../../../components/ui/Card'

const AttendanceChart = ({ data, role }) => {
  return (
    <Card title="Attendance Trends">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
          <XAxis dataKey="day" className="text-gray-600 dark:text-gray-400" />
          <YAxis className="text-gray-600 dark:text-gray-400" />
          <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: 'none' }} />
          <Legend />
          {role === 'siswa' ? (
             <Bar dataKey="status" name="Present (1) / Absent (0)" fill="#3b82f6" />
          ) : (
            <>
              <Bar dataKey="present" fill="#10b981" name="Present" />
              <Bar dataKey="absent" fill="#ef4444" name="Absent" />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

export default AttendanceChart