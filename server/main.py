import os
from app import app, mongo
from bson.json_util import dumps
from bson.objectid import ObjectId
from flask import jsonify, request

# Adds a welcome message to flask
@app.route('/')
def index():
    return jsonify(
        status=True,
        message='Welcome to the Dockerized Flask MongoDB app!'
    )

# adds the notebook to the db
@app.route('/add', methods=['POST'])
def add_notebook():
    _json = request.get_json()
    _data = _json['_data']
    _notebook = _json['_notebook']
    _user = _json['_user']
    # validate the received values
    if _data and _notebook and _user and request.method == 'POST':
        notebook_mongoid = mongo.db.notebooks.insert_one(_json)
        resp = jsonify('Notebook added successfully!')
        resp.status_code = 200
        return resp
    else:
        return not_found()


# returns all notebooks
@app.route('/notebooks')
def notebooks():
    notebooks = mongo.db.notebooks.find()
    resp = dumps(notebooks)
    return resp


# returns all versions of a notebook by file_id
@app.route('/notebooks/<id>')
def notebooks_by_id(id):
    notebooks = mongo.db.notebooks.find({"_notebook.metadata.tracking.file_id": str(id)})
    resp = dumps(notebooks)
    return resp


# returns all notebooks and respective versions by user id (email)
@app.route('/usernotebooks/<id>')
def usernotebooks(id):
    print(id)
    notebooks = mongo.db.notebooks.find({"_user.email": str(id)})
    resp = dumps(notebooks)
    return resp


# returns one notebook by mongodb id
@app.route('/notebook/<id>')
def notebook(id):
    notebook = mongo.db.notebooks.find_one({'_id': ObjectId(id)})
    resp = dumps(notebook)
    return resp


# update method not supported
@app.route('/update', methods=['PUT'])
def update():
    resp = jsonify('update not supported')
    resp.status_code = 400
    return resp


# deletes one notebook by mongodb id
@app.route('/delete/<id>', methods=['DELETE'])
def delete_notebook(id):
    mongo.db.notebooks.delete_one({'_id': ObjectId(id)})
    resp = jsonify('Notebook deleted successfully!')
    resp.status_code = 200
    return resp


@app.errorhandler(404)
def not_found(error=None):
    message = {
        'status': 404,
        'message': 'Not Found: ' + request.url,
    }
    resp = jsonify(message)
    resp.status_code = 404

    return resp


if __name__ == "__main__":
    ENVIRONMENT_DEBUG = os.environ.get("APP_DEBUG", True)
    ENVIRONMENT_PORT = os.environ.get("APP_PORT", 5005)
    app.run(host='0.0.0.0', port=ENVIRONMENT_PORT, debug=ENVIRONMENT_DEBUG)
