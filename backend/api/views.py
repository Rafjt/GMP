from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserCreateSerializer
# from django.contrib.auth import get_user_model
from rest_framework import generics

# Create your views here.

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
