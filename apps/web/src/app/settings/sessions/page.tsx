import { SessionList } from '@/components/session/session-list'
import { ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'Active Sessions | HYVVE',
  description: 'Manage your active sessions across devices',
}

export default function SessionsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="hover:text-gray-900">Settings</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Sessions</span>
        </div>

        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Active Sessions</h1>
          <p className="text-gray-600">
            Manage your active sessions across different devices. You can revoke
            access from devices you no longer use or don't recognize.
          </p>
        </div>

        {/* Security Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-1">
            Security Recommendation
          </h3>
          <p className="text-sm text-blue-700">
            Regularly review your active sessions and revoke any sessions you don't
            recognize. If you see suspicious activity, change your password
            immediately and revoke all other sessions.
          </p>
        </div>

        {/* Sessions List */}
        <SessionList />
      </div>
    </div>
  )
}
