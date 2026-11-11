const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="mb-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-center gap-3">
      <div className="shrink-0 p-2 rounded-xl bg-accent/30 border border-accent/40">
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold">{title}</h2>
    </div>
    {subtitle ? <p className="text-sm text-white/60">{subtitle}</p> : null}
  </div>
)

export default SectionTitle
