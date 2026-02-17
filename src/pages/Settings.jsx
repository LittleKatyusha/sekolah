import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import useAuthStore from '../store/useAuthStore'
import { sanitizeInput } from '../utils/api'

const settingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false
  }
  return true
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const Settings = () => {
  const { user, updateUser } = useAuthStore()
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  })

  const onSubmit = async (data) => {
    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(data.name),
      email: sanitizeInput(data.email),
    }

    // Update user profile
    updateUser(sanitizedData)

    // Reset password fields
    reset({
      ...sanitizedData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })

    alert('Settings saved successfully!')
  }

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card title="Profile Settings">
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
            <Button type="submit" className="w-full">
              <Save size={18} className="mr-2" />
              Save Changes
            </Button>
          </form>
        </Card>

        {/* Security Settings */}
        <Card title="Security Settings">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              {...register('currentPassword')}
              error={errors.currentPassword?.message}
            />
            <Input
              label="New Password"
              type="password"
              {...register('newPassword')}
              error={errors.newPassword?.message}
            />
            <Input
              label="Confirm New Password"
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
            <Button type="submit" className="w-full">
              <Save size={18} className="mr-2" />
              Update Password
            </Button>
          </form>
        </Card>

        {/* Notification Settings */}
        <Card title="Notification Settings">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive email notifications for important updates
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive push notifications on your device
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive SMS for critical alerts
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card title="Preferences">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <select className="input-field">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Timezone</label>
              <select className="input-field">
                <option value="utc">UTC</option>
                <option value="est">EST</option>
                <option value="pst">PST</option>
                <option value="gmt">GMT</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date Format</label>
              <select className="input-field">
                <option value="mm-dd-yyyy">MM/DD/YYYY</option>
                <option value="dd-mm-yyyy">DD/MM/YYYY</option>
                <option value="yyyy-mm-dd">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Settings
