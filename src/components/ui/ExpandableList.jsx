import { Children, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const ExpandableList = ({ children, initialCount = 4, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const items = Children.toArray(children)
  const hasMore = items.length > initialCount
  const visibleItems = isExpanded ? items : items.slice(0, initialCount)
  const hiddenCount = items.length - initialCount
  const Icon = isExpanded ? ChevronUp : ChevronDown

  return (
    <>
      <div className={className}>{visibleItems}</div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            aria-expanded={isExpanded}
            className="btn group min-h-11 px-5 text-sm text-white/75 hover:text-white"
          >
            {isExpanded ? 'Show less' : `Show ${hiddenCount} more`}
            <Icon className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
          </button>
        </div>
      )}
    </>
  )
}

export default ExpandableList
