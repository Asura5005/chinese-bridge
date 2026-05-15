import './globals.css'
import Cursor from '@/components/UI/Cursor'
import { AuthProvider } from '@/lib/AuthContext'

export const metadata = {
  title: 'ChineseBridge — Learn Chinese',
  description: 'Интерактивная платформа для изучения китайского языка',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          {/* <Cursor /> */}
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}