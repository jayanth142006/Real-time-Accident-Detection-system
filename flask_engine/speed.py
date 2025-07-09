import cv2
from math import sqrt
import numpy as np
import supervision as sv
from tqdm import tqdm
from ultralytics import YOLO
from supervision.assets import VideoAssets, download_assets
from collections import defaultdict, deque
import matplotlib.pyplot as plt
import json
import base64
import os
import google.generativeai as genai
from PIL import Image

with open("accident_log.json", "r") as f:
    accident_log = json.load(f)
with open("accident_labels.json", "r") as f:
    accident_labels = json.load(f)

# Build map: tracker_id -> list of frames involved in accident
tracker_accident_frames = {}
accident_report =''
for entry in accident_log:
    frame = entry["frame"]
    for t_id in entry["trackers"]:
        if t_id in tracker_accident_frames:
            tracker_accident_frames[t_id].append(frame)
        else:
            tracker_accident_frames[t_id]=[frame,]
tracker_history = defaultdict(lambda: {})
images =[]
SOURCE_VIDEO_PATH = "vdos/test2.mp4"
TARGET_VIDEO_PATH = "vdos/vehicles-result-speed.mp4"
CONFIDENCE_THRESHOLD = 0.5
IOU_THRESHOLD = 0.5
MODEL_NAME = "models/yolov8n.pt"
MODEL_RESOLUTION = 640

TARGET_WIDTH = 15
TARGET_HEIGHT = 150

TARGET = np.array([
    [0, 0],
    [TARGET_WIDTH - 1, 0],
    [TARGET_WIDTH - 1, TARGET_HEIGHT - 1],
    [0, TARGET_HEIGHT - 1],
])

def select_polygon_points(image, num_points=4, x_margin=400, y_margin=300):
    fig, ax = plt.subplots(figsize=(10, 6))
    height, width = image.shape[:2]

    ax.imshow(image, extent=[0, width, height, 0])
    ax.set_xlim(-x_margin, width + x_margin)
    ax.axhline(0, color='black', linewidth=1)
    ax.axvline(0, color='black', linewidth=1)
    ax.grid(True)
    ax.set_title(f"Click {num_points} points for the SOURCE polygon")

    coords = []

    def onclick(event):
        if event.xdata is not None and event.ydata is not None:
            x, y = int(event.xdata), int(event.ydata)
            coords.append((x, y))
            ax.plot(x, y, 'ro')
            ax.text(x + 5, y + 5, f"({x}, {y})", color='red')
            fig.canvas.draw()

            if len(coords) == num_points:
                plt.close()

    fig.canvas.mpl_connect('button_press_event', onclick)
    plt.show()

    if len(coords) != num_points:
        raise ValueError("Insufficient points selected.")
    return np.array(coords, dtype=np.int32)

class ViewTransformer:
    def __init__(self, source: np.ndarray, target: np.ndarray) -> None:
        source = source.astype(np.float32)
        target = target.astype(np.float32)
        self.m = cv2.getPerspectiveTransform(source, target)

    def transform_points(self, points: np.ndarray) -> np.ndarray:
        if points.size == 0:
            return points

        reshaped_points = points.reshape(-1, 1, 2).astype(np.float32)
        transformed_points = cv2.perspectiveTransform(reshaped_points, self.m)
        return transformed_points.reshape(-1, 2)

frame_generator = sv.get_video_frames_generator(source_path=SOURCE_VIDEO_PATH)
frame_iterator = iter(frame_generator)
frame = next(frame_iterator)
SOURCE = select_polygon_points(frame.copy(), num_points=4)
annotated_frame = frame.copy()
annotated_frame = sv.draw_polygon(scene=annotated_frame, polygon=SOURCE, color=sv.Color.RED, thickness=4)
sv.plot_image(annotated_frame)

view_transformer = ViewTransformer(source=SOURCE, target=TARGET)
model = YOLO(MODEL_NAME)
video_info = sv.VideoInfo.from_video_path(video_path=SOURCE_VIDEO_PATH)
frame_generator = sv.get_video_frames_generator(source_path=SOURCE_VIDEO_PATH)
frame_limit = video_info.total_frames
byte_track = sv.ByteTrack(frame_rate=video_info.fps)

def calculate_dynamic_thickness(resolution_wh):
    width, height = resolution_wh
    return max(1, int(min(width, height) / 400))

def calculate_dynamic_text_scale(resolution_wh):
    width, height = resolution_wh
    return round(min(width, height) / 1000.0, 2)

thickness = calculate_dynamic_thickness(video_info.resolution_wh)
text_scale = calculate_dynamic_text_scale(video_info.resolution_wh)
check = 0
bounding_box_annotator = sv.BoxAnnotator(thickness=thickness)
label_annotator = sv.LabelAnnotator(
    text_scale=text_scale,
    text_thickness=thickness,
    text_position=sv.Position.BOTTOM_CENTER,
    color_lookup=sv.ColorLookup.TRACK,
)
trace_annotator = sv.TraceAnnotator(
    thickness=thickness,
    trace_length=video_info.fps * 2,
    position=sv.Position.BOTTOM_CENTER,
    color_lookup=sv.ColorLookup.TRACK,
)

polygon_zone = sv.PolygonZone(polygon=SOURCE)
coordinates = defaultdict(lambda: deque(maxlen=video_info.fps))

with sv.VideoSink(TARGET_VIDEO_PATH, video_info) as sink:
    frame_count = 0
    for frame in tqdm(frame_generator, total=frame_limit):
        if frame_count > frame_limit:
            break
        try:
            result = model(frame, imgsz=MODEL_RESOLUTION, verbose=False)[0]
            detections = sv.Detections.from_ultralytics(result)

            detections = detections[detections.confidence > CONFIDENCE_THRESHOLD-0.49]
            detections = detections[detections.class_id != 0]
            detections = detections[polygon_zone.trigger(detections)]
            detections = detections.with_nms(IOU_THRESHOLD)

            detections = byte_track.update_with_detections(detections=detections)

            points = detections.get_anchors_coordinates(anchor=sv.Position.BOTTOM_CENTER)
            points = view_transformer.transform_points(points=points).astype(int)

            for tracker_id, (x, y) in zip(detections.tracker_id, points):
                coordinates[tracker_id].append((x, y))

            labels = []
            PIXELS_PER_METER = 20
            METER_PER_PIXEL = 1 / PIXELS_PER_METER

            for tracker_id in detections.tracker_id:
                coords = coordinates[tracker_id]
                if len(coords) < 2:
                    labels.append(f"#{tracker_id}")
                else:
                    (x_start, y_start) = coords[0]
                    (x_end, y_end) = coords[-1]
                    distance_px = sqrt((x_end - x_start)**2 + (y_end - y_start)**2)
                    distance_m = distance_px * METER_PER_PIXEL * 8

                    time_sec = len(coords) / video_info.fps
                    speed_mps = distance_m / time_sec
                    speed_kmph = int(speed_mps * 3.6)
                    tracker_history[tracker_id][frame_count] = {
                        "speed": speed_kmph,
                        "position": (x_end, y_end)
                    }
                    
                    labels.append(f"#{tracker_id} {int(speed_kmph)} km/h")
            annotated_frame = frame.copy()
            annotated_frame = trace_annotator.annotate(annotated_frame, detections)
            annotated_frame = bounding_box_annotator.annotate(annotated_frame, detections)
            annotated_frame = label_annotator.annotate(annotated_frame, detections, labels)

            cv2.imshow("Annotated Frame", annotated_frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

            sink.write_frame(annotated_frame)
            frame_count += 1
            # Save frame if it's an accident frame
            for tracker_id in tracker_accident_frames:
                if frame_count == tracker_accident_frames[tracker_id][len(tracker_accident_frames[tracker_id])//2] and frame_count - check >10  :
                    output_path = f"accident_frames/accident_tracker_{tracker_id}_frame_{frame_count}.jpg"
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                    cv2.imwrite(output_path, annotated_frame)
                    check = frame_count
                    images.append(output_path)
                    print(f"Saved accident frame: {output_path}")
                    

        except Exception as e:
            print(f"Error processing frame {frame_count}: {e}")
            continue
accident_details = {}
print("\n=== ACCIDENT CORRELATION REPORT ===")
for entry in tracker_accident_frames:
    try:
        first_acc_frame = tracker_accident_frames[entry][0]
        last_acc_frame = tracker_accident_frames[entry][-1]
        speed = tracker_history[entry][first_acc_frame]["speed"]
        pos_before = tracker_history[entry][first_acc_frame]["position"]
        last_known_frame = max(tracker_history[entry].keys())
        pos_after = tracker_history[entry][last_known_frame]["position"]

        dx = pos_after[0] - pos_before[0]
        dy = pos_after[1] - pos_before[1]
        displacement = sqrt(dx**2 + dy**2)
        d = displacement * METER_PER_PIXEL * 8
        l=[accident_labels[str(entry)],speed,d]
        accident_details[entry] = l
        print(f"Tracker ID: {entry} | Vehicle Type :{accident_labels[str(entry)]} | Speed of accident : {speed} km/h | Displacement : {d:.2f} m")
        accident_report+=f"Vehicle Type :{accident_labels[str(entry)]} | Speed of accident : {speed} km/h | Displacement : {d:.2f} m\n"
    except KeyError:
            print(f"Tracker ID: {t_id} | Data not available for speed or position.")

severity_score = 1
if len(accident_details)>2:
    severity_score+=1
for entry in accident_details:
    if accident_details[entry][0] == "truck" or accident_details[entry][0] == "bus":
        severity_score+=1
    if accident_details[entry][1] >80:
        severity_score+=1
    if accident_details[entry][2] > 10:
        severity_score+=1
if accident_labels['type'] == "SevereAccident":
    severity_score+=1

GOOGLE_API_KEY = 'AIzaSyDSjQTk7ZQDoPqsO2QimA1v0NwVkWvUAE0'  # Replace with your actual API key
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

print(f"Severity Score : {severity_score}")
accident_report+=f"Accident detected : {accident_labels['type']}\n"
accident_report+=f"Severity Score : {severity_score}\n"
print(accident_report)

image_objs = [Image.open(path) for path in images]

prompt = f"""
You are an intelligent accident analysis assistant. Based on the accident report below and the attached images, generate a clear and concise summary of how the accident occurred. Use the visual evidence to support the explanation, and describe the scenario as if explaining it to a non-technical person.

Accident Report:
{accident_report}

Your summary should include:
- What type of vehicles were involved.
- Their speed and displacement before and after the collision.
- The severity of the accident.
- A proper explanation of how the accident took place, based on both the report and the visuals.

Keep the tone factual, easy to understand, and suitable for informing a concerned viewer or traffic authority.
"""


response = model.generate_content([prompt] + image_objs)
print("\n--- Accident Summary ---")
print(response.text)


cv2.destroyAllWindows()
