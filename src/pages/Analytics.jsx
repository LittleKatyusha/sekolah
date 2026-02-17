import React, { useMemo } from 'react'
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import Card from '../components/ui/Card'
import useAuthStore from '../store/useAuthStore'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Analytics = () => {
  const { user } = useAuthStore()

  // Mock data - in a real app, this would come from an API based on the user's role or context
  const studentPerformanceData = useMemo(() => [
    { month: 'Jan', avgGrade: 85, attendance: 95, assignments: 12 },
    { month: 'Feb', avgGrade: 82, attendance: 92, assignments: 10 },
    { month: 'Mar', avgGrade: 88, attendance: 98, assignments: 15 },
    { month: 'Apr', avgGrade: 86, attendance: 94, assignments: 11 },
    { month: 'May', avgGrade: 90, attendance: 96, assignments: 14 },
    { month: 'Jun', avgGrade: 89, attendance: 95, assignments: 13 },
  ], [])

  const subjectPerformanceData = useMemo(() => [
    { subject: 'Math', A: 85, fullMark: 100 },
    { subject: 'Physics', A: 78, fullMark: 100 },
    { subject: 'English', A: 92, fullMark: 100 },
    { subject: 'History', A: 88, fullMark: 100 },
    { subject: 'Biology', A: 80, fullMark: 100 },
    { subject: 'Chemistry', A: 75, fullMark: 100 },
  ], [])

    const gradeDistributionData = useMemo(() => [
    { name: 'A (90-100)', value: 15 },
    { name: 'B (80-89)', value: 25 },
    { name: 'C (70-79)', value: 10 },
    { name: 'D (60-69)', value: 5 },
    { name: 'E (<60)', value: 2 },
  ], [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Analytics</h1>
      
      {/* Composed Chart: Trends over time */}
      <Card title="Student Performance Trends">
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={studentPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
                <YAxis yAxisId="left" className="text-gray-600 dark:text-gray-400" />
                <YAxis yAxisId="right" orientation="right" className="text-gray-600 dark:text-gray-400" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: 'none' }} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="avgGrade" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.3} name="Avg Grade" />
                <Bar yAxisId="right" dataKey="assignments" barSize={20} fill="#10b981" name="Assignments Completed" />
                <Line yAxisId="left" type="monotone" dataKey="attendance" stroke="#ef4444" strokeWidth={2} name="Attendance %" />
            </ComposedChart>
            </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart: Subject Strengths */}
        <Card title="Subject Performance">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={subjectPerformanceData}>
                <PolarGrid className="stroke-gray-300 dark:stroke-gray-600" />
                <PolarAngleAxis dataKey="subject" className="text-gray-600 dark:text-gray-400" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} className="text-gray-600 dark:text-gray-400" />
                <Radar name="Score" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Legend />
                </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart: Grade Distribution */}
        <Card title="Grade Distribution">
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={gradeDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {gradeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>

      {/* Stats Cards for Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Attendance</h3>
          <p className="text-3xl font-bold mt-2">95.4%</p>
          <p className="text-sm text-green-600 mt-2">+1.2% from last semester</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Class Average</h3>
          <p className="text-3xl font-bold mt-2">86.5</p>
          <p className="text-sm text-green-600 mt-2">+3.5 points improvement</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Top Subject</h3>
          <p className="text-3xl font-bold mt-2">English</p>
          <p className="text-sm text-blue-600 mt-2">92% average score</p>
        </Card>
      </div>
    </div>
  )
}

export default Analytics
