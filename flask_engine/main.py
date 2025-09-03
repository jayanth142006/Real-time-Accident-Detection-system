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
from math import sqrt
import supervision as sv
from supervision.assets import VideoAssets, download_assets
import base64
import os
import google.generativeai as genai
from PIL import Image
import requests

def send_to_django(address, description, severity, severity_score):
    data = {
        'address': address,
        'description': description,
        'severity': severity,
        'severity_score': severity_score
    }

    try:
        response = requests.post('http://127.0.0.1:8000/api/accidents/create/', json=data)
        print("Django response:", response.text)  # 👈 ADD THIS LINE
        response.raise_for_status()
        print("✅ Accident sent to Django successfully:", response.json())
        return True
    except requests.exceptions.RequestException as e:
        print("❌ Error sending data to Django:", e)
        return False


# --- Config ---


#ACCIDENT 
def accident(video_path,address):
    SOURCE_VIDEO_PATH = video_path
    TARGET_VIDEO_PATH = "static/result_vdo/vehicles-result-accident.mp4"
    CONFIDENCE_THRESHOLD = 0.5
    IOU_THRESHOLD = 0.5
    VEHICLE_MODEL_PATH = "yolov8n.pt"
    ACCIDENT_MODEL_PATH = "accident_detection_yolov8.pt"
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

    #annotated_frame = frame.copy()
    #annotated_frame = sv.draw_polygon(scene=annotated_frame, polygon=SOURCE, color=sv.Color.RED, thickness=4)
    #sv.plot_image(annotated_frame)

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
                accident_detections = accident_detections[accident_detections.confidence > CONFIDENCE_THRESHOLD + 0.1]
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
                            if iou > 0.5:
                                class_id = vehicle_detections.class_id[veh_idx]
                                tracker_id = vehicle_detections.tracker_id[veh_idx]
                                class_name = vehicle_model.model.names[class_id]
                                vehicle_matches.append((class_name, tracker_id, iou))

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

    cv2.destroyAllWindows()

    #SPEED AND DISPLACEMENT

    accident_labels = class_name_id

    TARGET_WIDTH = 10
    TARGET_HEIGHT = 100

    TARGET = np.array([
        [0, 0],
        [TARGET_WIDTH - 1, 0],
        [TARGET_WIDTH - 1, TARGET_HEIGHT - 1],
        [0, TARGET_HEIGHT - 1],
    ])

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


    view_transformer = ViewTransformer(source=SOURCE, target=TARGET)

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

    TARGET_VIDEO_PATH = "static/result_vdo/vehicles-result-speed.mp4"
    MODEL_NAME = "yolov8n.pt"

    model = YOLO(MODEL_NAME)
    video_info = sv.VideoInfo.from_video_path(video_path=SOURCE_VIDEO_PATH)
    frame_generator = sv.get_video_frames_generator(source_path=SOURCE_VIDEO_PATH)
    frame_limit = video_info.total_frames
    byte_track = sv.ByteTrack(frame_rate=video_info.fps)


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
                        distance_m = distance_px * METER_PER_PIXEL * 7

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
                        output_path = f"static/accident_frames/accident_tracker_{tracker_id}_frame_{frame_count}.jpg"
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
            l=[accident_labels[entry],speed,d]
            accident_details[entry] = l
            #print(f"Tracker ID: {entry} | Vehicle Type :{accident_labels[entry]} | Speed of accident : {speed} km/h | Displacement : {d:.2f} m")
            accident_report+=f"Vehicle Type :{accident_labels[entry]} | Speed of collision : {speed} km/h | Displacement due to accident : {d:.2f} m\n"
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

    GOOGLE_API_KEY = 'API_KEY'  # Replace with your actual API key
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')

    #print(f"Severity Score : {severity_score}")
    accident_report+=f"Accident detected : {accident_labels['type']}\n"
    accident_report+=f"Severity Score : {severity_score}\n"
    print(accident_report)

    image_objs = [Image.open(path) for path in images]

    prompt = f"""
    You are an intelligent accident analysis assistant. Based on the accident report below and the attached images, generate a clear and concise summary of how the accident occurred. Use the visual evidence to support the explanation, and describe the scenario as if explaining it to a non-technical person.

    Accident Report:
    {accident_report}

    Your summary should include:
    - Have proper spacing and lines to make the text easy to read
    - What type of vehicles were involved and the color.
    - Their speed and displacement before and after the collision.
    - The severity of the accident.
    - A proper explanation of how the accident took place, based on both the report and the visuals no need to metion the vehicle id and vehicles not mentioned in report.

    Keep the tone factual, easy to understand, and suitable for informing a concerned viewer or traffic authority.
    """


    response = model.generate_content([prompt] + image_objs)
    print("\n--- Accident Summary ---")
    print(response.text)
        # Example hardcoded address, update as needed or get via input/UI
    address="Marina Beach, Zone 9 Teynampet,Chennai,Tamil Nadu,600001,India"
    description = response.text
    severity = accident_labels["type"]
    # severity_score already exists

    # Send data to Django
    send_to_django(address, description, severity, severity_score)



    return accident_report,response.text,images 


    cv2.destroyAllWindows()
