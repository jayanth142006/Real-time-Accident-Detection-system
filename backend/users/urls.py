from django.urls import path
from users.views import LoginView, RegisterView


urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('signup/', RegisterView.as_view(), name='signup'),
]
