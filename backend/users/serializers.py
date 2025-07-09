from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    hospitalId = serializers.SerializerMethodField()
    policeId = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'organization_name', 'address', 'hospitalId', 'policeId']

    def get_hospitalId(self, obj):
        return obj.id if obj.role == 'hospital' else None

    def get_policeId(self, obj):
        return obj.id if obj.role == 'police' else None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'role', 'organization_name', 'address']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role'),
            organization_name=validated_data.get('organization_name'),
            address=validated_data.get('address'),
            
        )
        return user
