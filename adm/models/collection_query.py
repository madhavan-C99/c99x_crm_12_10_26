from django.db import models
from django.conf import settings
from telecalling.models.delete_base_model import SafeDeleteModel

class CollectionQuery(SafeDeleteModel):
    key = models.CharField(max_length=50, unique=True)
    query = models.TextField(null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    def __str__(self):
        return self.key
    
    class Meta:
        db_table = 'adm_collection_query'