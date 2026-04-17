import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AC Grup Proje ERP',
  description: 'İnşaat Projesi Yönetim Sistemi — CRM, Stok ve Finans Takibi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}
