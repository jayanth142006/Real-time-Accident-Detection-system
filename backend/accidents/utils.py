import requests
from django.conf import settings
from geopy.distance import geodesic
from .models import User  # your custom user model



# Convert address to coordinates

# Marina Beach, Zone 9 Teynampet,Chennai,Tamil Nadu,600001,India- this address works for testing
def geocode_address(address):
    url = 'https://nominatim.openstreetmap.org/search'
    params = {
        'q': address,
        'format': 'json',
        'limit': 1
    }
    headers = {
        'User-Agent': 'accident-management-app/1.0'
    }
    response = requests.get(url, params=params, headers=headers).json()
    print(response)
    if response:
        return float(response[0]['lat']), float(response[0]['lon'])
    return None




# Find the nearest user (hospital or police) to given lat/lng
def find_nearest_user(lat, lng, role):
    nearest_user = None
    min_distance = float('inf')

    # Filter users by role
    users = User.objects.filter(role=role, address__isnull=False).exclude(address='')

    for user in users:
        user_coords = geocode_address(user.address)
        if not user_coords:
            continue
        distance = geodesic((lat, lng), user_coords).km  # measure in km
        if distance < min_distance:
            min_distance = distance
            nearest_user = user

    return nearest_user
