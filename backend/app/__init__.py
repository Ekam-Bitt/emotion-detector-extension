from flask import Flask
from flask_cors import CORS
import logging
import os

from .config import AppConfig
from .inference import load_pipeline
from .routes import api_bp, register_health


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    # Logging
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
    app.logger.setLevel(logging.getLevelName(os.getenv("LOG_LEVEL", "INFO")))

    # Config
    config = AppConfig.from_env()
    app.config.update(config.to_flask_config())

    # Model
    sentiment_pipeline = load_pipeline(config)
    app.config["SENTIMENT_PIPELINE"] = sentiment_pipeline

    # Routes
    app.register_blueprint(api_bp)
    register_health(app)

    return app
