export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full max-w-md"
      style={{ animation: "landingFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both" }}
    >
      {children}
    </div>
  )
}
