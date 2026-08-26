import { useState, useCallback } from 'react'
import { login as apiLogin, logout as apiLogout } from '../services/api'

export function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('courier_user')) } catch { return null }
  })

  const signIn = useCallback(async (username, password) => {
    const res = await apiLogin(username, password)
    const { access_token, user: userData } = res.data
    localStorage.setItem('courier_token', access_token)
    localStorage.setItem('courier_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const signOut = useCallback(async () => {
    try { await apiLogout() } catch {}
    localStorage.removeItem('courier_token')
    localStorage.removeItem('courier_user')
    setUser(null)
  }, [])

  return { user, signIn, signOut }
}
