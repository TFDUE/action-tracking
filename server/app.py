import os
from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app)
app.secret_key = "ibgUaUDs3Ftic4M47C8KdCje"
app.config["MONGO_URI"] = 'mongodb://' + os.environ['MONGODB_USERNAME'] + ':' + os.environ['MONGODB_PASSWORD'] + '@' + os.environ['MONGODB_HOSTNAME'] + ':27017/' + os.environ['MONGODB_DATABASE'] + '?authSource=admin'
app.config['CORS_HEADERS'] = 'Content-Type'
mongo = PyMongo(app)
db = mongo.db
