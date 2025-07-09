
from ultralytics import YOLO
import cv2

# Load models
accident_model = YOLO("accident_detection_yolov8.pt")
vehicle_model = YOLO("yolov8s.pt")
#235test#test2
# Load video
video_path = "4.mp4"
cap = cv2.VideoCapture(video_path)

width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)

# Output writer
out = cv2.VideoWriter("combined_output.mp4", cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))

# Final log list
accident_zone_log = []

# Helper: check if two boxes intersect
def boxes_intersect(box1, box2):
    x1_min, y1_min, x1_max, y1_max = box1
    x2_min, y2_min, x2_max, y2_max = box2
    return not (x1_max < x2_min or x2_max < x1_min or y1_max < y2_min or y2_max < y1_min)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Run predictions
    acc_result = accident_model.predict(source=frame, imgsz=640, conf=0.25, verbose=False)[0]
    veh_result = vehicle_model.predict(source=frame, imgsz=640, conf=0.4, verbose=False)[0]

    # Get all boxes and labels from both models
    acc_boxes = [(acc_result.names[int(b.cls[0])], b.xyxy[0].tolist()) for b in acc_result.boxes]
    veh_boxes = [(veh_result.names[int(b.cls[0])], b.xyxy[0].tolist()) for b in veh_result.boxes]

    for label, acc_box in acc_boxes:
        label = label.lower()
        if label in ["severeaccident", "moderateaccident"]:
            ax1, ay1, ax2, ay2 = map(int, acc_box)
            acc_zone = (ax1, ay1, ax2, ay2)

            # Collect overlapping labels from both models
            involved_labels = []

            # Check vehicle model predictions
            for v_label, v_box in veh_boxes:
                vx1, vy1, vx2, vy2 = map(int, v_box)
                if boxes_intersect(acc_zone, (vx1, vy1, vx2, vy2)):
                    involved_labels.append(v_label.lower())

            # Also check other accident_model detections (e.g., fire)
            for a_label, a_box in acc_boxes:
                if a_label.lower() not in ["severeaccident", "moderateaccident"]:
                    ax1_, ay1_, ax2_, ay2_ = map(int, a_box)
                    if boxes_intersect(acc_zone, (ax1_, ay1_, ax2_, ay2_)):
                        involved_labels.append(a_label.lower())

            if involved_labels:
                accident_zone_log.append([label] + involved_labels)

    # Draw frames
    frame_accident = acc_result.plot()
    frame_vehicle = veh_result.plot()
    combined_frame = cv2.addWeighted(frame_vehicle, 0.5, frame_accident, 0.5, 0)

    out.write(combined_frame)
    cv2.imshow("Combined Detection", combined_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Cleanup
cap.release()
out.release()
cv2.destroyAllWindows()

# Output the final result
def compute_severity(entry):
    score = 1  # base score
    if 'severeaccident' in entry:
        score += 1
    if 'truck' in entry:
        score += 1
    if entry.count('car') + entry.count('truck') + entry.count('bus') > 2:
        score += 1
    if 'fire' in entry or 'smoke' in entry:
        score += 1
    return score
# Find entry with maximum length
max_entry = max(accident_zone_log, key=len)
if "smoke" in max_entry:
    max_entry[max_entry.index("smoke")] = "fire"

    # Convert "train" to "truck" (only first occurrence)
if "train" in max_entry:
    max_entry[max_entry.index("train")] = "truck"
#print(max_entry)

severity_score = compute_severity(max_entry)
#print("Severity score of the accident:", severity_score)

print("\n\t ACCIDENT DETECTED!")
print("SEVERITY:",max_entry[0])
print("VEHICLES INVOLVED: ")
for k in range(len(max_entry)-1):
    print(max_entry[k+1])
print("SEVERITY SCORE: ",severity_score)
