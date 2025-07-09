import cv2
from collections import defaultdict, deque
import numpy as np
from ultralytics import YOLO
import supervision as sv
from tqdm import tqdm
import matplotlib.pyplot as plt
from torchvision.ops import box_iou
import torch
import json
# --- Config ---
SOURCE_VIDEO_PATH = "vdos/test2.mp4"
TARGET_VIDEO_PATH = "vdos/vehicles-result.mp4"
CONFIDENCE_THRESHOLD = 0.5
IOU_THRESHOLD = 0.5
VEHICLE_MODEL_PATH = "models/yolov8n.pt"
ACCIDENT_MODEL_PATH = "models/accident_detection_yolov8.pt"
MODEL_RESOLUTION = 640

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

# Polygon Zone
frame_generator = sv.get_video_frames_generator(source_path=SOURCE_VIDEO_PATH)
frame_iterator = iter(frame_generator)
frame = next(frame_iterator)
SOURCE = select_polygon_points(frame.copy(), num_points=4)

annotated_frame = frame.copy()
annotated_frame = sv.draw_polygon(scene=annotated_frame, polygon=SOURCE, color=sv.Color.RED, thickness=4)
sv.plot_image(annotated_frame)
class_name_id = {}
accident_log = []
acc_type =[]
# --- Initialize ---
vehicle_model = YOLO(VEHICLE_MODEL_PATH)
accident_model = YOLO(ACCIDENT_MODEL_PATH)
video_info = sv.VideoInfo.from_video_path(video_path=SOURCE_VIDEO_PATH)
frame_generator = sv.get_video_frames_generator(source_path=SOURCE_VIDEO_PATH)
byte_track = sv.ByteTrack(frame_rate=video_info.fps)
polygon_zone = sv.PolygonZone(polygon=SOURCE)

# Style
def calculate_dynamic_thickness(resolution_wh):
    width, height = resolution_wh
    return max(1, int(min(width, height) / 400))

def calculate_dynamic_text_scale(resolution_wh):
    width, height = resolution_wh
    return round(min(width, height) / 1000.0, 2)

thickness = calculate_dynamic_thickness(video_info.resolution_wh)
text_scale = calculate_dynamic_text_scale(video_info.resolution_wh)

# Annotators
vehicle_box_annotator = sv.BoxAnnotator(thickness=thickness)
vehicle_label_annotator = sv.LabelAnnotator(
    text_scale=text_scale,
    text_thickness=thickness,
    text_position=sv.Position.BOTTOM_CENTER,
    color_lookup=sv.ColorLookup.TRACK,
)

accident_box_annotator = sv.BoxAnnotator(thickness=thickness, color=sv.Color.RED)
accident_label_annotator = sv.LabelAnnotator(
    text_scale=text_scale,
    text_thickness=thickness,
    text_position=sv.Position.TOP_CENTER,
    color=sv.Color.RED,
)

# --- Output ---
with sv.VideoSink(TARGET_VIDEO_PATH, video_info) as sink:
    frame_count = 0
    for frame in tqdm(frame_generator, total=video_info.total_frames):
        if frame_count > video_info.total_frames:
            break
        try:
            # Inference from both models
            vehicle_result = vehicle_model(frame, imgsz=MODEL_RESOLUTION, verbose=False)[0]
            accident_result = accident_model(frame, imgsz=MODEL_RESOLUTION, verbose=False)[0]

            # Convert detections
            vehicle_detections = sv.Detections.from_ultralytics(vehicle_result)
            accident_detections = sv.Detections.from_ultralytics(accident_result)

            # Filter vehicle detections
            vehicle_detections = vehicle_detections[vehicle_detections.confidence > CONFIDENCE_THRESHOLD-0.49]
            vehicle_detections = vehicle_detections[vehicle_detections.class_id != 0]
            vehicle_detections = vehicle_detections[polygon_zone.trigger(vehicle_detections)]
            vehicle_detections = vehicle_detections.with_nms(IOU_THRESHOLD)

            # Filter accident detections
            accident_detections = accident_detections[accident_detections.confidence > CONFIDENCE_THRESHOLD + 0.3]
            accident_detections = accident_detections.with_nms(IOU_THRESHOLD)
            # Update vehicle tracker
            vehicle_detections = byte_track.update_with_detections(vehicle_detections)

            # If accident detected, print all tracked vehicles in frame
            if len(accident_detections) > 0:
                
                # Convert to tensors for IoU computation
                acc_boxes_tensor = torch.tensor(accident_detections.xyxy)
                veh_boxes_tensor = torch.tensor(vehicle_detections.xyxy)

                iou_matrix = box_iou(acc_boxes_tensor, veh_boxes_tensor)  # Shape: (num_accidents, num_vehicles)

                for acc_idx in range(iou_matrix.shape[0]):
                    vehicle_matches = []  # To store matching vehicles for this accident
                    acc_class_id = int(accident_detections.class_id[acc_idx])
                    acc_class_name = accident_model.model.names[acc_class_id]
                    for veh_idx in range(iou_matrix.shape[1]):
                        iou = iou_matrix[acc_idx, veh_idx].item()
                        if iou > 0.30:
                            class_id = vehicle_detections.class_id[veh_idx]
                            tracker_id = vehicle_detections.tracker_id[veh_idx]
                            class_name = vehicle_model.model.names[class_id]
                            vehicle_matches.append((class_name, tracker_id, iou))
                    print(f"\n--- Accident detected at frame {frame_count} ---")
                    # Only print if 2 or more vehicles are involved in this accident
                    if len(vehicle_matches) >= 2:
                        print(f"\n--- Accident detected at frame {frame_count} ---")
                        for class_name, tracker_id, iou in vehicle_matches:
                            accident_log.append({
                                "frame": frame_count,
                                "trackers": [int(tracker_id)]
                            })
                            class_name_id[int(tracker_id)] = class_name
                            if acc_class_name not in acc_type:
                                acc_type.append(acc_class_name)
                            print(f"  - Vehicle Class: {class_name}, Tracker ID: {tracker_id}, IoU: {iou:.2f},{acc_class_name}")

            # Labels
            vehicle_labels = [
                f"#{tracker_id} {vehicle_model.model.names[class_id]}"
                for class_id, tracker_id in zip(vehicle_detections.class_id, vehicle_detections.tracker_id)
            ]
            accident_labels = [
                f"{accident_model.model.names[class_id]}"
                for class_id in accident_detections.class_id
            ]

            # Annotate
            annotated_frame = frame.copy()
            annotated_frame = vehicle_box_annotator.annotate(annotated_frame, vehicle_detections)
            annotated_frame = vehicle_label_annotator.annotate(annotated_frame, vehicle_detections, vehicle_labels)

            annotated_frame = accident_box_annotator.annotate(annotated_frame, accident_detections)
            annotated_frame = accident_label_annotator.annotate(annotated_frame, accident_detections, accident_labels)

            # Display & Save
            cv2.imshow("Annotated Frame", annotated_frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

            sink.write_frame(annotated_frame)
            frame_count += 1
        except Exception as e:
            print(f"Error processing frame {frame_count}: {e}")
            continue

if 'SevereAccident' in acc_type:
    class_name_id["type"] = 'SevereAccident'
else:
    class_name_id["type"] = 'NormalAccident'

with open("accident_log.json", "w") as f:
    json.dump(accident_log, f, indent=2)
with open("accident_labels.json", "w") as f:
    json.dump(class_name_id, f)
cv2.destroyAllWindows()
