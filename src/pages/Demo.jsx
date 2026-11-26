import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useStore } from '../store.jsx'

// Accès direct au tableau de bord avec un compte de test fictif (aucun mot de passe).
// Adresse : #/demo
export default function Demo() {
  const { user, onboarded, enterDemo } = useStore()
  useEffect(() => { if (!user || !onboarded) enterDemo() }, [])
  return user && onboarded ? <Navigate to="/app" replace /> : null
}
