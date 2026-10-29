"""
Alias module for PipelineCategory to prevent ModuleNotFoundError
when imported via 'adm.models.pipeline'.
"""
from .pipeline_category import PipelineCategory

__all__ = ['PipelineCategory']
