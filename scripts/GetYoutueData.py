# Takes all URLs in "videos.txt" and parses the data for each

with open("scripts/videos.txt", "r") as f:
    URLS = f.read().strip().split("\n")



import yt_dlp
import json
import re
from datetime import datetime

def extract_video_id(url):
    """Extract video ID from various YouTube URL formats"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'youtube\.com\/v\/([^&\n?#]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def get_video_info(url, description_length=200):
    """Get video information from YouTube URL"""
    video_id = extract_video_id(url)
    if not video_id:
        print(f"Could not extract video ID from: {url}")
        return None
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Format duration from seconds to MM:SS or HH:MM:SS
            duration_seconds = info.get('duration', 0)
            if duration_seconds:
                hours = duration_seconds // 3600
                minutes = (duration_seconds % 3600) // 60
                seconds = duration_seconds % 60
                
                if hours > 0:
                    duration = f"{hours}:{minutes:02d}:{seconds:02d}"
                else:
                    duration = f"{minutes}:{seconds:02d}"
            else:
                duration = "Unknown"
            
            # Format published date
            upload_date = info.get('upload_date', '')
            if upload_date:
                try:
                    date_obj = datetime.strptime(upload_date, '%Y%m%d')
                    published_at = date_obj.strftime('%Y-%m-%d')
                except:
                    published_at = upload_date
            else:
                published_at = "Unknown"
            
            # Truncate description if needed and escape for JavaScript
            description = info.get('description', 'No description available')
            if len(description) > description_length:
                description = description[:description_length] + '...'
            
            # Escape special characters for JavaScript
            description = description.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r')
            
            # Escape title for JavaScript
            title = info.get('title', 'Unknown Title').replace('\\', '\\\\').replace('"', '\\"')
            
            # Get view count and format it
            view_count = info.get('view_count', 0)
            if view_count:
                if view_count >= 1000000:
                    views_formatted = f"{view_count / 1000000:.1f}M"
                elif view_count >= 1000:
                    views_formatted = f"{view_count / 1000:.1f}K"
                else:
                    views_formatted = str(view_count)
            else:
                views_formatted = "Unknown"
            
            # Get like count
            like_count = info.get('like_count', 0)
            if like_count:
                if like_count >= 1000000:
                    likes_formatted = f"{like_count / 1000000:.1f}M"
                elif like_count >= 1000:
                    likes_formatted = f"{like_count / 1000:.1f}K"
                else:
                    likes_formatted = str(like_count)
            else:
                likes_formatted = "Unknown"
            
            video_data = {
                'title': title,
                'description': description,
                'videoId': video_id,
                'thumbnail': f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
                'duration': duration,
                'publishedAt': published_at,
                'views': views_formatted,
                'likes': likes_formatted
            }
            
            return video_data
            
    except Exception as e:
        print(f"Error extracting info for {url}: {str(e)}")
        return None

def load_existing_video_ids():
    """Load existing video IDs from youtubeData.js file"""
    try:
        with open('src/youtubeData.js', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract video IDs using regex
        import re
        video_id_pattern = r'videoId:\s*"([^"]+)"'
        existing_ids = re.findall(video_id_pattern, content)
        return set(existing_ids)
    except FileNotFoundError:
        print("No existing youtubeData.js file found. All URLs will be processed.")
        return set()

def load_existing_videos_data():
    """Load existing video data from youtubeData.js file"""
    try:
        with open('src/youtubeData.js', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract video data using regex
        import re
        video_pattern = r'{\s*title:\s*"([^"]*)",\s*description:\s*"([^"]*)",\s*videoId:\s*"([^"]*)",\s*thumbnail:\s*"([^"]*)",\s*duration:\s*"([^"]*)",\s*publishedAt:\s*"([^"]*)",\s*views:\s*"([^"]*)",\s*likes:\s*"([^"]*)"\s*}'
        matches = re.findall(video_pattern, content, re.DOTALL)
        
        existing_videos = []
        for match in matches:
            video_data = {
                'title': match[0],
                'description': match[1],
                'videoId': match[2],
                'thumbnail': match[3],
                'duration': match[4],
                'publishedAt': match[5],
                'views': match[6],
                'likes': match[7]
            }
            existing_videos.append(video_data)
        
        return existing_videos
    except FileNotFoundError:
        print("No existing youtubeData.js file found.")
        return []

def load_config():
    """Load configuration from JSON file"""
    try:
        with open('youtube_config.json', 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        print("Configuration file not found. Using default URLs.")
        return {
            "youtube_urls": URLS,
            "description_length": 200
        }

def main():
    # Load configuration
    config = load_config()
    urls = config.get('youtube_urls', [])
    description_length = config.get('description_length', 200)
    
    # Load existing video data
    existing_videos = load_existing_videos_data()
    existing_video_ids = {video['videoId'] for video in existing_videos}
    
    print(f"Found {len(existing_videos)} existing videos in youtubeData.js")
    
    # Filter URLs to only process new ones
    new_urls = []
    for url in urls:
        video_id = extract_video_id(url)
        if video_id and video_id not in existing_video_ids:
            new_urls.append(url)
        else:
            if video_id:
                print(f"[SKIPPED] Already processed: {url}")
            else:
                print(f"[SKIPPED] Invalid URL format: {url}")
    
    print(f"\nFound {len(new_urls)} new URLs to process")
    
    if not new_urls:
        print("No new URLs to process. All URLs have already been processed.")
        return
    
    new_videos_data = []
    
    print("\nFetching YouTube video data for new URLs...")
    for url in new_urls:
        print(f"Processing: {url}")
        video_info = get_video_info(url, description_length)
        if video_info:
            new_videos_data.append(video_info)
            print(f"[SUCCESS] Successfully fetched: {video_info['title']}")
        else:
            print(f"[FAILED] Failed to fetch data for: {url}")
    
    if new_videos_data:
        print(f"\nSuccessfully fetched {len(new_videos_data)} new videos:")
        for video in new_videos_data:
            print(f"- {video['title']} ({video['duration']})")
        
        # Create a mapping of video IDs to video data for quick lookup
        existing_videos_map = {video['videoId']: video for video in existing_videos}
        new_videos_map = {video['videoId']: video for video in new_videos_data}
        
        # Combine videos in the order of the original URLs list
        all_videos = []
        for url in urls:
            video_id = extract_video_id(url)
            if video_id:
                if video_id in new_videos_map:
                    all_videos.append(new_videos_map[video_id])
                elif video_id in existing_videos_map:
                    all_videos.append(existing_videos_map[video_id])
        
        # Generate JavaScript array format
        js_array = "export const youtubeVideos = [\n"
        for i, video in enumerate(all_videos):
            js_array += "  {\n"
            js_array += f"    title: \"{video['title']}\",\n"
            js_array += f"    description: \"{video['description']}\",\n"
            js_array += f"    videoId: \"{video['videoId']}\",\n"
            js_array += f"    thumbnail: \"{video['thumbnail']}\",\n"
            js_array += f"    duration: \"{video['duration']}\",\n"
            js_array += f"    publishedAt: \"{video['publishedAt']}\",\n"
            js_array += f"    views: \"{video['views']}\",\n"
            js_array += f"    likes: \"{video['likes']}\"\n"
            js_array += "  }"
            if i < len(all_videos) - 1:
                js_array += ","
            js_array += "\n"
        js_array += "];\n"
        
        print(f"\nTotal videos: {len(existing_videos)} existing + {len(new_videos_data)} new = {len(all_videos)} total")
        
        # Save to file in src directory
        output_file = 'src/youtubeData.js'
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("// This file is automatically generated by scripts/GetYoutueData.py\n")
            f.write("// Do not edit manually - it will be overwritten\n\n")
            f.write(js_array)
        print(f"\nData saved to '{output_file}'")
        print("Ready for import by data.js")
    else:
        # No new videos, but we might want to reorder existing ones
        if existing_videos:
            print("No new videos to process, but reordering existing videos to match URL order...")
            
            # Create a mapping of video IDs to video data for quick lookup
            existing_videos_map = {video['videoId']: video for video in existing_videos}
            
            # Reorder videos according to the original URLs list
            all_videos = []
            for url in urls:
                video_id = extract_video_id(url)
                if video_id and video_id in existing_videos_map:
                    all_videos.append(existing_videos_map[video_id])
            
            # Generate JavaScript array format
            js_array = "export const youtubeVideos = [\n"
            for i, video in enumerate(all_videos):
                js_array += "  {\n"
                js_array += f"    title: \"{video['title']}\",\n"
                js_array += f"    description: \"{video['description']}\",\n"
                js_array += f"    videoId: \"{video['videoId']}\",\n"
                js_array += f"    thumbnail: \"{video['thumbnail']}\",\n"
                js_array += f"    duration: \"{video['duration']}\",\n"
                js_array += f"    publishedAt: \"{video['publishedAt']}\",\n"
                js_array += f"    views: \"{video['views']}\",\n"
                js_array += f"    likes: \"{video['likes']}\"\n"
                js_array += "  }"
                if i < len(all_videos) - 1:
                    js_array += ","
                js_array += "\n"
            js_array += "];\n"
            
            # Save to file in src directory
            output_file = 'src/youtubeData.js'
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write("// This file is automatically generated by scripts/GetYoutueData.py\n")
                f.write("// Do not edit manually - it will be overwritten\n\n")
                f.write(js_array)
            print(f"Reordered {len(all_videos)} videos and saved to '{output_file}'")
        else:
            print("No video data was successfully fetched.")

if __name__ == "__main__":
    main()