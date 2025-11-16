#!/usr/bin/env python3
"""
Generate Open Graph image with black background and centered favicon.
"""
from PIL import Image
import os
from pathlib import Path

# Get script directory
script_dir = Path(__file__).parent
project_root = script_dir.parent

# Paths
favicon_path = project_root / 'public' / 'favicon.ico'
output_path = project_root / 'public' / 'og-image.png'

# Open Graph standard dimensions
OG_WIDTH = 1200
OG_HEIGHT = 630
FAVICON_SIZE = 400  # Size of the favicon in the center

def generate_og_image():
    try:
        # Check if favicon exists
        if not favicon_path.exists():
            raise FileNotFoundError(f'Favicon not found at {favicon_path}')

        # Load and resize the favicon
        favicon = Image.open(favicon_path)
        
        # Convert to RGBA if needed (for transparency support)
        if favicon.mode != 'RGBA':
            favicon = favicon.convert('RGBA')
        
        # Resize favicon while maintaining aspect ratio
        favicon.thumbnail((FAVICON_SIZE, FAVICON_SIZE), Image.Resampling.LANCZOS)
        
        # Get favicon dimensions after resize
        favicon_width, favicon_height = favicon.size
        
        # Calculate position to center the favicon
        x = (OG_WIDTH - favicon_width) // 2
        y = (OG_HEIGHT - favicon_height) // 2
        
        # Create the OG image: black background
        og_image = Image.new('RGB', (OG_WIDTH, OG_HEIGHT), color='black')
        
        # Paste the favicon onto the black background
        # Use the favicon as a mask to preserve transparency
        og_image.paste(favicon, (x, y), favicon if favicon.mode == 'RGBA' else None)
        
        # Save the image
        og_image.save(output_path, 'PNG')
        
        print(f'✅ Open Graph image generated successfully at {output_path}')
        print(f'   Dimensions: {OG_WIDTH}x{OG_HEIGHT}px')
        print(f'   Favicon size: {favicon_width}x{favicon_height}px (centered)')
        
    except Exception as error:
        print(f'❌ Error generating OG image: {error}')
        import sys
        sys.exit(1)

if __name__ == '__main__':
    generate_og_image()

