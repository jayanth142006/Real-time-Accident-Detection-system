from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Accident
from .utils import geocode_address, find_nearest_user
from rest_framework.permissions import IsAuthenticated
from .serializers import AccidentSerializer

class AccidentCreateView(APIView):
    def post(self, request):
        address = request.data.get('address')
        description = request.data.get('description', '')
        severity = request.data.get('severity', 'minor')
        severity_score = request.data.get('severity_score', 0)
        image = request.FILES.get('image')
        coords = geocode_address(address)
        if not coords:
            return Response({'error': 'Invalid accident address'}, status=400)
        
        lat, lng = coords

        # Find nearest hospital and police user
        nearest_hospital = find_nearest_user(lat, lng, role='hospital')
        nearest_police = find_nearest_user(lat, lng, role='police')

        accident = Accident.objects.create(
            address=address,
            description=description,
            severity=severity,
            severity_score=severity_score,
            status='pending',
            assigned_hospital=nearest_hospital,
            assigned_police=nearest_police,
            image=image
        )

        return Response({
            'message': 'Accident created successfully',
            'accident_id': accident.id,
            'assigned_hospital': nearest_hospital.organization_name if nearest_hospital else None,
            'assigned_police': nearest_police.organization_name if nearest_police else None,
        }, status=201)

class AssignedAccidentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role

        if role == 'hospital':
            accidents = Accident.objects.filter(assigned_hospital=user)
        elif role == 'police':
            accidents = Accident.objects.filter(assigned_police=user)
        else:
            return Response({'error': 'Unauthorized role'}, status=403)

        serializer = AccidentSerializer(accidents, many=True)
        return Response(serializer.data)
    
class AcceptAccidentView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, accident_id):
        try:
            accident = Accident.objects.get(id=accident_id)
        except Accident.DoesNotExist:
            return Response({'error': 'Accident not found'}, status=status.HTTP_404_NOT_FOUND)

        # Optional: You can add checks to ensure only the assigned hospital or police can accept it
        user = request.user
        if user != accident.assigned_hospital and user != accident.assigned_police:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        accident.status = 'completed'
        accident.save()
        return Response({'message': 'Accident marked as completed'}, status=status.HTTP_200_OK)