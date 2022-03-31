from flask import Flask
from flask_pymongo import PyMongo
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app)
app.secret_key = "secret key"
app.config["MONGO_URI"] = "mongodb://localhost:27017/action-tracking"
app.config['CORS_HEADERS'] = 'Content-Type'
mongo = PyMongo(app)