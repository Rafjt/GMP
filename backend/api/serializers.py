from rest_framework import serializers
from .models import CustomUser

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)  # Hide password in response

    class Meta:
        model = CustomUser
        fields = ['email', 'password']

    def create(self, validated_data):
        user = CustomUser(email=validated_data['email'])
        user.set_master_password(validated_data['password'])  # PBKDF2 hashing
        user.save()
        return user
