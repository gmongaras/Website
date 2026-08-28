import { ExternalLink } from 'lucide-react'

const LinkIcon = ({ href, label }) => (
  <a className="link" href={href} target="_blank" rel="noreferrer">
    <span>{label}</span>
    <ExternalLink className="w-4 h-4" />
  </a>
)

export default LinkIcon
