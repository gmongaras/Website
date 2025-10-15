# Gets all URLs for my channel and puts them in "videos.txt". The top-most is the most recent.

import yt_dlp

def get_channel_videos(channel_url):
    ydl_opts = {'extract_flat': True, 'quiet': True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(channel_url, download=False)
        return [entry['url'] for entry in info['entries']]

# Example usage
videos = get_channel_videos("https://www.youtube.com/@gabrielmongaras/videos")
print(f"Found {len(videos)} videos:")
with open("scripts/videos.txt", "w") as f:
    for v in videos:
        f.write(v + "\n")

