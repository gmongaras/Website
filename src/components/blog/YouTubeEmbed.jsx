const YouTubeEmbed = ({ videoId }) => {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`

  return (
    <div className="pdf-block my-6">
      {/* 56.25% keeps the 16:9 box before the iframe has any content. */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg border border-white/10"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      {/* Iframes are hidden on paper, so the link stands in for the player. */}
      <p className="print-only text-sm">
        Video: <a href={watchUrl}>{watchUrl}</a>
      </p>
    </div>
  )
}

export default YouTubeEmbed
