import os
import urllib.request
import time
import shutil

media_dir = "/home/why/Project/MemoryLib2.0/frontend/public/media"
os.makedirs(media_dir, exist_ok=True)

print("Starting to download a sample small video...")
video_url = "https://www.w3schools.com/html/mov_bbb.mp4"
sample_video_path = os.path.join(media_dir, "sample_video.mp4")

try:
    urllib.request.urlretrieve(video_url, sample_video_path)
except Exception as e:
    print(f"Error downloading video: {e}")
    # Create empty dummy video if fails
    with open(sample_video_path, 'wb') as f:
        f.write(b'dummy video content')

print("Generating 25 video copies...")
for i in range(1, 26):
    dst = os.path.join(media_dir, f"video_test_{i}.mp4")
    shutil.copy2(sample_video_path, dst)

# Removing the sample video template
os.remove(sample_video_path)

print("Downloading 35 sample images from picsum...")
for i in range(1, 36):
    img_url = f"https://picsum.photos/800/600?random={i}"
    dst = os.path.join(media_dir, f"image_test_{i}.jpg")
    try:
        # Use a user agent to avoid basic blocks
        req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(dst, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
        print(f"Downloaded image {i}/35")
        time.sleep(0.1)
    except Exception as e:
        print(f"Error downloading image {i}: {e}")
        # Create empty dummy if fails
        with open(dst, 'wb') as f:
            f.write(b'dummy image content')

print("Finished generating test media.")
