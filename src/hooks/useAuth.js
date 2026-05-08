/**
 * useAuth Hook
 *
 * Manages Supabase auth session, login, signup, and logout.
 */

import { useState } from 'react'
import { supabase } from '../supabase'

export function useAuth() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [message,  setMessage]  = useState(null)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else setMessage('Check your email to confirm your account!')
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return {
    email, setEmail,
    password, setPassword,
    loading,
    error,
    message,
    handleLogin,
    handleSignUp,
    handleLogout,
  }
}
