from app import app, mongo
from bson.json_util import dumps
from bson.objectid import ObjectId
from flask import jsonify, request


@app.route('/add', methods=['POST'])
def add_notebook():
    _json = request.get_json()
    _name = _json['data']['filename']
    # validate the received values
    if _name and request.method == 'POST':
        # save details
        id = mongo.db.notebooks.insert_one(_json)
        resp = jsonify('Notebook added successfully!')
        resp.status_code = 200
        return resp
    else:
        return not_found()


@app.route('/notebooks')
def notebooks():
    notebooks = mongo.db.notebook.find()
    resp = dumps(notebooks)
    return resp


@app.route('/notebook/<id>')
def notebook(id):
    user = mongo.db.notebook.find_one({'_id': ObjectId(id)})
    resp = dumps(notebook)
    return resp


@app.route('/update', methods=['PUT'])
def update_user():
    _json = request.get_json()
    _id = _json['_id']
    _name = _json['name']
    # validate the received values
    if _name and _id and request.method == 'PUT':
        # save edits
        mongo.db.notebook.update_one({'_id': ObjectId(_id['$oid']) if '$oid' in _id else ObjectId(_id)},
                                 {'$set': {'name': _name}})
        resp = jsonify('Notebook updated successfully!')
        resp.status_code = 200
        return resp
    else:
        return not_found()


@app.route('/delete/<id>', methods=['DELETE'])
def delete_notebook(id):
    mongo.db.notebook.delete_one({'_id': ObjectId(id)})
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
    app.run()