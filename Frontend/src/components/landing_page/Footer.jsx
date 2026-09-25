export default function Footer() {
  return (
    <footer className="border-t border-indigo/18 px-4 sm:px-8 lg:px-[60px] py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left max-w-full">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0">
          <img src="https://www.logoai.com/oss/icons/2021/12/02/Q9pS-i3L1EHuO4S.png" alt="Logo" />
        </div>
        <span className="font-display font-bold text-xs sm:text-sm text-muted-light">
          JobTracker — Workflow-powered job tracking
        </span>
      </div>
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 items-center">
        {['Privacy', 'Terms', 'GitHub', 'API docs'].map(l => (
          <a
            key={l}
            href="#"
            className="text-xs text-muted no-underline font-body transition-colors duration-200 hover:text-muted-light"
          >
            {l}
          </a>
        ))}
      </div>
    </footer>
  )
}
