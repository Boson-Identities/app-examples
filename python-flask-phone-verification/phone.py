import os
import logging
from binascii import hexlify

from flask import Flask, render_template_string
from flask_dance.consumer import OAuth2ConsumerBlueprint
logging.basicConfig(level=logging.DEBUG)

token_url = "https://app.boson.me/oauth2/token"
client_id = os.getenv('client-id')
client_secret = os.getenv('client-secret')

boson = OAuth2ConsumerBlueprint(
    "boson", __name__,
    client_id=client_id,
    client_secret=client_secret,
    base_url="https://app.boson.me",
    token_url=token_url,
    authorization_url="https://app.boson.me/oauth2/authorize",
    scope=['require:phone'],
    auto_refresh_url=token_url,
    auto_refresh_kwargs={
        'client_id': client_id,
        'client_secret': client_secret,
    }
)

app = Flask(__name__)
app.secret_key = hexlify(os.urandom(24))
app.register_blueprint(boson, url_prefix="/login")

@app.route("/")
def index():
    if not boson.session.authorized:
        return render_template_string("""
            <a href="{{url_for('boson.login')}}"> Verify! </a>
        """)
    resp = boson.session.post("/api/v1/user/me")
    resp_json = resp.json()
    print(resp_json)
    return render_template_string("""
        <p>user id: {{uid}}</p> <p>phone status: {{status}}</p>
    """, status=resp_json['status']['phone'], uid=resp_json['id'])

if __name__ == "__main__":
    app.run()