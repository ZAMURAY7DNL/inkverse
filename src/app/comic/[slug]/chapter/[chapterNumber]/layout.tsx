// El reader usa su propio layout sin Navbar ni Footer
// para maximizar el espacio de lectura
export default function ReaderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
