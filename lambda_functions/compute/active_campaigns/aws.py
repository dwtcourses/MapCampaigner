import json
import boto3
import os
from dependencies import yaml


class S3Data(object):
    """
    Class for AWS S3
    """

    def __init__(self):
        """
        Initialize the s3 client.
        """
        self.s3 = boto3.client('s3')
        self.bucket = os.environ['S3_BUCKET']

    def fetch(self, key):
        """
        Fetch a S3 object from
        :param key: path + filename
        :type key: string

        :returns: content of the file (json/yaml)
        :rtype: dict
        """
        try:
            obj = self.s3.get_object(
                Bucket=self.bucket,
                Key=key)
        except:
            return []

        raw_content = obj['Body'].read()
        return self.load(raw_content, key)

    def load(self, raw_content, key):
        """
        Load json or yaml content.

        :param raw_content: json/yaml raw_content
        :type raw_content: bytes

        :param key: path + filename
        :type key: string

        :returns: content of the file (json/yaml)
        :rype: dict
        """
        if self.is_json(key):
            return json.loads(raw_content)
        else:
            return yaml.load(raw_content)

    def is_json(self, key):
        """
        Check if the key has a json/geojson extension.

        :param key: path + filename
        :type key: string

        :returns: True or False
        :rtype: boolean
        """
        if key.split('.')[-1] in ['json', 'geojson']:
            return True
        return False

    def list(self, prefix):
        """
        List S3 objects in bucket starting with prefix.

        There aren't files or folders in a S3 bucket, only objects.
        A key is the name of an object. The key is used to retrieve an object.

        examples of keys:
        - campaign/
        - campaign/uuid.json
        - campaign/uuid.geojson
        - surveys/
        - surveys/buildings
        - kartoza.jpg

        :param prefix: keys has to start with prefix.
        :type prefix: string

        :returns: list of keys starting with prefix in the bucket.
        :rtype: list
        """
        prefix = '{}/'.format(prefix)
        objects = []
        try:
            paginator = self.s3.get_paginator('list_objects')
            result = paginator.paginate(
                Bucket=self.bucket,
                Prefix=prefix,
                Delimiter='/'
                )
            for obj in result.search('CommonPrefixes'):
                key = obj.get('Prefix').replace(prefix, '')
                objects.append(key.split('/')[0])
            return list(set(objects))
        except KeyError:
            return []

    def create(self, key, body):
        """
        Create an object in the S3 bucket.

        :param key: path + filename
        :type key: string

        :param body: content of the file
        :type body: string

        :returns:
        """
        self.s3.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=body)

    def delete(self, key):
        """
        Delete a key in the S3 bucket.

        :param key: pathname + filename
        :type key: string

        :returns:
        """
        self.s3.delete_object(
            Bucket=self.bucket,
            Key=key)

    def delete_folder(self, folder_key):
        """
        Delete a folder in the S3 bucket.

        :param folder_key: folder's path
        :type folder_key: string

        :returns:
        """
        for key in self.list(folder_key):
            self.delete('{}/{}'.format(folder_key, key))

    def get_last_modified_date(self, key):
        obj = self.s3.get_object(
            Bucket=self.bucket,
            Key=key)
        return obj['LastModified']
