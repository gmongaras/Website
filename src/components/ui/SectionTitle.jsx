const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-accent/30 border border-accent/40">
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold">{title}</h2>
    </div>
    {subtitle ? <p className="text-sm text-white/60">{subtitle}</p> : null}
  </div>
)

export default SectionTitle
