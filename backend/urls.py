from django.contrib import admin
from django.urls import path, include
from tasks.views_frontend import index

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/tasks/', include('tasks.urls')),
    path('', index, name='index'),  # Serve index.html at root
]
