export default function AnimatedOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-[600px] h-[600px] rounded-full -top-[200px] -left-[100px] animate-orb-1 bg-[radial-gradient(circle,rgba(99,102,241,0.094)_0%,transparent_70%)]" />
      <div className="absolute w-[500px] h-[500px] rounded-full top-[100px] -right-[150px] animate-orb-2 bg-[radial-gradient(circle,rgba(34,211,238,0.071)_0%,transparent_70%)]" />
      <div className="absolute w-[400px] h-[400px] rounded-full -bottom-[100px] left-[40%] animate-orb-3 bg-[radial-gradient(circle,rgba(167,139,250,0.078)_0%,transparent_70%)]" />
    </div>
  )
}
