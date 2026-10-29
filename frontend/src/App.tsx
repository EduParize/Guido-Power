import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './shared/auth'
import { router } from './app/routes'

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
