import { lazy, Suspense, useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { auth } from './firebase'
import Auth from './components/Auth'
import Shell from './layout/Shell'
import Header from './layout/Header'
import ChangePasswordModal from './components/ChangePasswordModal'
import NotificationSettings from './components/NotificationSettings'
import OggiPage from './pages/OggiPage'
import ItemsPage from './pages/ItemsPage'
import ItemDetailPage from './pages/ItemDetailPage'
import TodosPage from './pages/TodosPage'
import { DataProvider } from './context/DataProvider'
import { UiProvider } from './context/UiProvider'
import { useData } from './context/useData'
import { useToast } from './context/useToast'
import { usePush } from './hooks/usePush'

// Le pagine più pesanti si scaricano solo quando servono
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const RoutinePage = lazy(() => import('./pages/RoutinePage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))

const Authed = ({ user }) => {
  const toast = useToast()
  const { projects } = useData()
  const [modal, setModal] = useState(null) // 'notifications' | 'password'
  const pushActive = usePush(projects, modal === 'notifications')

  const changePassword = async (current, next) => {
    try {
      await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(user.email, current))
      await updatePassword(auth.currentUser, next)
      toast.ok('Password cambiata')
      setModal(null)
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') throw new Error('Password attuale errata')
      if (err.code === 'auth/weak-password') throw new Error('La nuova password deve avere almeno 6 caratteri')
      throw new Error('Cambio password non riuscito. Riprova.')
    }
  }

  const logout = () => signOut(auth).catch(e => console.error('Logout error:', e))

  return (
    <>
      <Routes>
        <Route
          element={
            <Shell
              header={
                <Header
                  user={user} pushActive={pushActive}
                  onNotifications={() => setModal('notifications')}
                  onPassword={() => setModal('password')}
                  onLogout={logout}
                />
              }
            />
          }
        >
          <Route index element={<OggiPage />} />
          <Route path="elementi" element={<ItemsPage />} />
          <Route path="elementi/:id" element={<ItemDetailPage />} />
          <Route path="documenti" element={<Suspense fallback={<PageLoading />}><DocumentsPage /></Suspense>} />
          <Route path="documenti/:id" element={<Suspense fallback={<PageLoading />}><DocumentsPage /></Suspense>} />
          <Route path="da-fare" element={<TodosPage />} />
          <Route path="calendario" element={<Suspense fallback={<PageLoading />}><CalendarPage /></Suspense>} />
          <Route path="routine" element={<Suspense fallback={<PageLoading />}><RoutinePage /></Suspense>} />
          <Route path="ai" element={<Suspense fallback={<PageLoading />}><ChatPage /></Suspense>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>

      {modal === 'notifications' && <NotificationSettings onClose={() => setModal(null)} />}
      {modal === 'password' && <ChangePasswordModal onClose={() => setModal(null)} onSubmit={changePassword} />}    </>
  )
}

const PageLoading = () => (
  <div className="row" style={{ justifyContent: 'center', padding: 48 }}>
    <span className="spinner" aria-hidden="true" /> <span className="muted">Carico…</span>
  </div>
)

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false) }), [])

  if (loading) {
    return <div className="loading-screen"><span className="spinner" aria-hidden="true" /> Caricamento…</div>
  }
  if (!user) return <Auth onAuthSuccess={setUser} />

  return (
    <DataProvider key={user.uid}>
      <UiProvider>
        <HashRouter>
          <Authed user={user} />
        </HashRouter>
      </UiProvider>
    </DataProvider>
  )
}

export default App
