from django.urls import path
from .views import AccidentCreateView, AssignedAccidentsView

urlpatterns = [
    path('accidents/create/', AccidentCreateView.as_view(), name='create-accidents'),
    path('accidents/assigned/', AssignedAccidentsView.as_view(), name='assigned-accidents'),
]
