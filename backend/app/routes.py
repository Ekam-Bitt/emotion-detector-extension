from flask import Blueprint, current_app, jsonify, request
import logging

api_bp = Blueprint("api", __name__)
logger = logging.getLogger("api")


@api_bp.route("/analyze", methods=["POST"])
def analyze_sentiment():
    data = request.get_json()
    if not data or "comments" not in data:
        return jsonify({"error": "Invalid request, 'comments' field is required"}), 400

    comments = data["comments"]
    if not isinstance(comments, list) or not all(isinstance(c, str) for c in comments):
        return jsonify({"error": "'comments' must be a list of strings"}), 400

    sentiment_pipeline = current_app.config.get("SENTIMENT_PIPELINE")
    if not sentiment_pipeline:
        logger.error("Sentiment pipeline not loaded.")
        return jsonify({"error": "Sentiment analysis service not available"}), 500

    try:
        # The pipeline returns a list of lists, where each inner list contains dicts
        # with 'label' and 'score'. We want to flatten this for consistency.
        results = sentiment_pipeline(comments)
        return jsonify({"results": results}), 200
    except Exception as e:
        logger.exception("Error during sentiment analysis")
        return jsonify({"error": str(e)}), 500


def register_health(app):
    @app.route("/health", methods=["GET"])
    def health_check():
        return jsonify({"status": "ok"}), 200
