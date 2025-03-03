# from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from rest_framework import status
from rest_framework.response import Response
from .serializers import UserCreateSerializer
from rest_framework import generics
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json


class test(View):
    def get(self, request, *args, **kwargs):
        return HttpResponse("Hello, World!")
    

class RegisterUserView(generics.CreateAPIView):
    serializer_class = UserCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"user_id": user.id, "email": user.email}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

@csrf_exempt  # Disable CSRF for testing (use proper security in production)
def login_user(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)  # Get JSON data from request
            email = data.get("email")
            password = data.get("password")

            if not email or not password:
                return JsonResponse({"error": "Email and password are required."}, status=400)

            user = authenticate(request, username=email, password=password)  # Obligé d'utiliser email en tant qu'username

            if user is not None:
                login(request, user)
                return JsonResponse({"message": "Login successful!", "user_id": user.id}, status=200)
            else:
                return JsonResponse({"error": "Invalid credentials."}, status=401)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)

    return JsonResponse({"error": "Method Not Allowed"}, status=405)


def logout_user(request):
    logout(request)
