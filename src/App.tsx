import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { PagesProvider } from '@/hooks/usePages'
import { AuthPage } from '@/pages/AuthPage'
import { AppLayout } from '@/pages/AppLayout'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-stone-500">
          <span className="i-lucide-loader-2 text-xl animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) return <AuthPage />

  return (
    <PagesProvider>
      <AppLayout />
    </PagesProvider>
  )
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
