# accidents/serializers.py

from rest_framework import serializers
from .models import Accident

class AccidentSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = Accident
        fields = '__all__'

