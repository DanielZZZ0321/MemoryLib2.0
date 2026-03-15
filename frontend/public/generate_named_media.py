import os
import json
import urllib.request
import time
import shutil
import random

media_dir = "/home/why/Project/MemoryLib2.0/frontend/public/media"
json_path = "/home/why/Project/MemoryLib2.0/frontend/public/timeline_chinese.json"

# Deleting old test media
for f in os.listdir(media_dir):
    if "test" in f or "dummy" in f or f == "sample_video.mp4":
        p = os.path.join(media_dir, f)
        if os.path.isfile(p):
            os.remove(p)

event_media_names = [
    {
        "photos": ["grinding_coffee_beans.jpg", "boiling_water_kettle.jpg", "pouring_hot_water.jpg", "sunny_kitchen_counter.jpg", "morning_coffee_cup.jpg"],
        "videos": ["hand_grinding_timelapse.mp4", "pouring_water_slowmo.mp4", "coffee_dripping_macro.mp4", "morning_sun_timelapse.mp4"],
        "caption_prefix": "晨间咖啡"
    },
    {
        "photos": ["reading_on_ipad.jpg", "tech_blog_article.jpg", "taking_smart_notes.jpg", "focused_studying.jpg", "coffee_and_notes.jpg"],
        "videos": ["scrolling_ipad_screen.mp4", "writing_notes_closeup.mp4", "highlighting_text_action.mp4", "studying_process_timelapse.mp4"],
        "caption_prefix": "阅读技术"
    },
    {
        "photos": ["blooming_sakura_trees.jpg", "walking_park_path.jpg", "green_spring_leaves.jpg", "blue_sky_outdoors.jpg", "park_scenery.jpg"],
        "videos": ["walking_pov_footage.mp4", "sakura_falling_slowmo.mp4", "spring_breeze_leaves.mp4", "park_ambience_video.mp4"],
        "caption_prefix": "公园漫步"
    },
    {
        "photos": ["whiteboard_architecture_diagram.jpg", "colleagues_discussing.jpg", "standup_meeting_room.jpg", "sticky_notes_board.jpg", "team_collaboration.jpg"],
        "videos": ["drawing_on_whiteboard.mp4", "team_presenting_idea.mp4", "active_discussion_clip.mp4", "meeting_room_timelapse.mp4"],
        "caption_prefix": "团队站会"
    },
    {
        "photos": ["vs_code_react_components.jpg", "dual_monitor_setup.jpg", "mechanical_keyboard_typing.jpg", "debugging_devtools.jpg", "focused_developer_desk.jpg"],
        "videos": ["typing_code_fast.mp4", "scrolling_react_code.mp4", "ui_testing_recording.mp4", "dev_workflow_timelapse.mp4"],
        "caption_prefix": "前端开发"
    },
    {
        "photos": ["latte_art_close_up.jpg", "chatting_with_mia.jpg", "office_pantry.jpg", "coffee_break_snacks.jpg", "relaxing_by_window.jpg"],
        "videos": ["making_espresso_shot.mp4", "colleagues_laughing.mp4", "walking_to_pantry.mp4", "relaxing_coffee_break.mp4"],
        "caption_prefix": "咖啡休息"
    }
]

print("Downloading base sample video...")
base_video_url = "https://www.w3schools.com/html/mov_bbb.mp4"
base_video_path = os.path.join(media_dir, "base_video.mp4")

try:
    urllib.request.urlretrieve(base_video_url, base_video_path)
except Exception as e:
    print(f"Failed to download base video, creating dummy: {e}")
    with open(base_video_path, 'wb') as f:
        f.write(b'dummy video content')

print("Generating 24 unique videos...")
for group in event_media_names:
    for v_name in group["videos"]:
        dst = os.path.join(media_dir, v_name)
        shutil.copy2(base_video_path, dst)
        # Ensure it is unique by appending random bytes
        with open(dst, "ab") as f:
            f.write(os.urandom(random.randint(5, 50)))

os.remove(base_video_path)

print("Downloading 30 named images from picsum...")
for group in event_media_names:
    for p_name in group["photos"]:
        img_url = f"https://picsum.photos/seed/{p_name}/800/600"
        dst = os.path.join(media_dir, p_name)
        try:
            req = urllib.request.Request(img_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(dst, 'wb') as out_file:
                shutil.copyfileobj(response, out_file)
            print(f"Downloaded image: {p_name}")
            time.sleep(0.1)
        except Exception as e:
            print(f"Error downloading {p_name}: {e}")
            with open(dst, 'wb') as f:
                f.write(b'dummy image content')

print("Updating timeline_chinese.json...")
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for i, event in enumerate(data):
    if "media" not in event:
        continue
    # Filter out old test media
    event["media"] = [m for m in event["media"] if "test" not in m.get("url", "") and "test" not in m.get("caption", "").lower()]
    
    if i < len(event_media_names):
        group = event_media_names[i]
        
        for idx, p_name in enumerate(group["photos"]):
            event["media"].append({
                "type": "image",
                "url": f"/media/{p_name}",
                "thumbnail": f"/media/{p_name}",
                "timestamp": event.get("start_hms", "00:00:00"),
                "caption": f"{group['caption_prefix']} - 照片 {idx+1}"
            })
            
        for idx, v_name in enumerate(group["videos"]):
            event["media"].append({
                "type": "video",
                "url": f"/media/{v_name}",
                "thumbnail": f"https://picsum.photos/seed/{v_name}/200/150",
                "timestamp": event.get("start_hms", "00:00:00"),
                "duration": random.randint(10, 60),
                "caption": f"{group['caption_prefix']} - 视频 {idx+1}"
            })

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Finished generating unique named media and updating JSON.")
