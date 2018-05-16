import json
import sys

import executor_utils as eu

from flask import Flask
from flask import request
from flask import jsonify

app = Flask(__name__)


@app.route("/")
def hello():
    return "Hello World, Xinyuan Gui"


@app.route("/build_and_run", methods=["POST"])
def build_and_run():
    data = json.loads(request.data)

    if 'code' not in data or 'lang' not in data:
        return "You should provide both 'code' and 'language'"
    code = data['code']
    lang = data['lang']
    print "API got called with code: %s in %s" % (code, lang)

    result = eu.build_and_run(code, lang);
    return jsonify(result)


if __name__ == "__main__":
    eu.load_image()

    port = int(sys.argv[1])
    print "Executor running on: %d" % port
    app.run(debug=True, threaded=True, port=port)
