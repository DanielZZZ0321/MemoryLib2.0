import json
import random

json_path = "/home/why/Project/MemoryLib2.0/frontend/public/timeline_chinese.json"

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# We generated 35 images and 25 videos in the previous script.
# Distribute them into the first 6 events (or random events).

num_events = len(data)
images = [f"/media/image_test_{i}.jpg" for i in range(1, 36)]
videos = [f"/media/video_test_{i}.mp4" for i in range(1, 26)]

img_idx = 0
vid_idx = 0

for i, event in enumerate(data):
    if "media" not in event:
        event["media"] = []
    
    # Add roughly 6 images per event
    for _ in range(6):
        if img_idx < len(images):
            event["media"].append({
                "type": "image",
                "url": images[img_idx],
                "thumbnail": images[img_idx],
                "timestamp": event.get("start_hms", "00:00:00"),
                "caption": f"测试图片 {img_idx+1}"
            })
            img_idx += 1
            
    # Add roughly 4-5 videos per event
    for _ in range(4 if i != num_events -1 else 5):
        if vid_idx < len(videos):
            event["media"].append({
                "type": "video",
                "url": videos[vid_idx],
                "thumbnail": f"https://picsum.photos/seed/vid{vid_idx}/200/150",
                "timestamp": event.get("start_hms", "00:00:00"),
                "duration": random.randint(10, 60),
                "caption": f"测试视频 {vid_idx+1}"
            })
            vid_idx += 1

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Successfully injected generated media paths into timeline_chinese.json")
