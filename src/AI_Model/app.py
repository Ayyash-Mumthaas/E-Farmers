from flask import Flask, request, jsonify
from flask_cors import CORS
import train_ai
import os

app = Flask(__name__)
CORS(app)

@app.route("/get_price", methods=["POST"])
def get_price():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Invalid or missing JSON payload"}), 400

        variety = data.get('variety', 'Samba')
        # Ensure CSV path relative to this file
        csv_file = os.path.join(os.path.dirname(__file__), "data", "5YearOfPriceData.csv")

        # Load prices series
        prices = train_ai.load_and_analyze_data(csv_file, variety)
        if prices is None:
            return jsonify({"error": "Failed to load data (see server logs)"}), 500

        # Train or load model
        model = train_ai.train_and_save_model(prices, variety)
        if model is None:
            return jsonify({"error": "Failed to train or load model (see server logs)"}), 500

        # Current price safely as float
        current_price = float(prices.iloc[-1])

        predicted_price, next_date = train_ai.predict_next_price(model, prices)
        if predicted_price is None:
            return jsonify({"error": "Prediction failed (see server logs)"}), 500

        recommendation = train_ai.decide_sell_store(current_price, predicted_price)
        if recommendation is None:
            return jsonify({"error": "Decision logic failed (see server logs)"}), 500

        # Store result in Firebase (optional; will skip if firebase not configured)
        train_ai.store_in_firebase(predicted_price, next_date, recommendation, current_price, variety)

        return jsonify({
            "variety": variety,
            "currentPrice": round(float(current_price), 2),
            "predictedPrice": round(float(predicted_price), 2),
            "date": next_date.strftime('%Y-%m') if next_date else "N/A",
            "recommendation": recommendation
        })
    except Exception as e:
        # helpful message for frontend and logs
        app.logger.exception("Unhandled error in /get_price")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == "__main__":
    print("Starting Flask server for rice price predictions...")
    app.run(debug=True, threaded=True, use_reloader=False)
