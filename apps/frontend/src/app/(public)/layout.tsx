import Navbar from '@/components/layout/Navbar/Navbar'
import Footer from '@/components/layout/Footer/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
