import { useState, useEffect } from 'react'
import { UserPlus, Search, Edit, Trash2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { apiService, sanitizeInput } from '../utils/api'
import { showDeleteConfirm, showSuccess, showError } from '../utils/sweetalert'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
})

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(userSchema)
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await apiService.get('/users')
    if (data) {
      setUsers(data)
    } else {
      console.error('Error fetching users:', error)
    }
    setLoading(false)
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddUser = () => {
    setEditingUser(null)
    reset()
    setShowModal(true)
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    reset(user)
    setShowModal(true)
  }

  const handleDeleteUser = async (user) => {
    const result = await showDeleteConfirm(user.name)
    if (!result.isConfirmed) return

    const { error } = await apiService.delete(`/users/${user.id}`)
    if (!error) {
      setUsers(users.filter(u => u.id !== user.id))
      showSuccess(`${user.name} has been deleted successfully!`, 'Deleted!')
    } else {
      showError('Failed to delete user. Please try again.', 'Error!')
    }
  }

  const onSubmit = async (data) => {
    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(data.name),
      email: sanitizeInput(data.email),
      phone: sanitizeInput(data.phone),
    }

    if (editingUser) {
      // Update user
      const { data: updatedUser, error } = await apiService.put(`/users/${editingUser.id}`, sanitizedData)
      if (!error) {
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...sanitizedData } : u))
        showSuccess('User updated successfully!', 'Updated!')
      } else {
        showError('Failed to update user. Please try again.', 'Error!')
        return
      }
    } else {
      // Create user
      const { data: newUser, error } = await apiService.post('/users', sanitizedData)
      if (!error) {
        setUsers([...users, { ...sanitizedData, id: users.length + 1 }])
        showSuccess('User created successfully!', 'Created!')
      } else {
        showError('Failed to create user. Please try again.', 'Error!')
        return
      }
    }

    setShowModal(false)
    reset()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold"></h1>
        <Button onClick={handleAddUser}>
          <UserPlus size={18} className="mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.company?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400 mr-4"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Name"
                {...register('name')}
                error={errors.name?.message}
              />
              <Input
                label="Email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label="Phone"
                {...register('phone')}
                error={errors.phone?.message}
              />
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingUser ? 'Update' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
