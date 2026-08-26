import { useEffect, useState } from 'react'
import { useAuth } from './hooks/useAuth'
import CourierSystem from './components/CourierSystem'

export default function App() {
  const { user, signIn, signOut } = useAuth()
  const [apiHealthy, setApiHealthy] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/health`)
      .then(r => setApiHealthy(r.ok))
      .catch(() => setApiHealthy(false))
  }, [])

  return (
    <CourierSystem
      apiMode={apiHealthy === true}
      authUser={user}
      onSignIn={signIn}
      onLogout={signOut}
    />
  )
}
