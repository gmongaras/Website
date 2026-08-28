const Card = ({ children, className = '' }) => (
  <div className={`card p-5 h-full w-full flex flex-col ${className}`}>{children}</div>
)

export default Card
