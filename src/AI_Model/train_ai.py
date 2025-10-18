import os
import pandas as pd
import matplotlib.pyplot as plt
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAXResults  # for load compatibility
from statsmodels.tsa.seasonal import seasonal_decompose
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
import joblib
import warnings
warnings.filterwarnings("ignore")

# Set matplotlib backend to avoid threading issues
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend

# --- Firebase initialization (optional) ---
db = None
try:
    cred_path = os.path.join(os.path.dirname(__file__), "firebase_credentials.json")
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase initialized successfully.")
    else:
        print("Firebase credentials not found; skipping Firebase initialization.")
except Exception as e:
    print(f"Firebase init error: {e}")
    db = None

# -------------------------
# Load and analyze CSV data
# -------------------------
def load_and_analyze_data(csv_file, variety='Samba'):
    try:
        if not os.path.exists(csv_file):
            raise FileNotFoundError(f"CSV file not found at {csv_file}")

        # Try to read CSV; allow common delimiters
        try:
            df = pd.read_csv(csv_file)
        except Exception:
            df = pd.read_csv(csv_file, delimiter=";")

        # Accept either 'Year-Month' or 'Date' column as index
        date_col = None
        for candidate in ['Year-Month', 'Year_Month', 'Date', 'Month', 'year_month']:
            if candidate in df.columns:
                date_col = candidate
                break
        if date_col is None:
            raise KeyError("No date column found. Expected 'Year-Month' or 'Date' in CSV header.")

        # parse dates
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        if df[date_col].isnull().any():
            # try parsing as YYYY-MM strings fallback
            df[date_col] = pd.to_datetime(df[date_col].astype(str).str.strip(), errors='coerce')

        df = df.dropna(subset=[date_col])
        df = df.set_index(date_col).sort_index()

        # match variety column case-insensitively
        columns_lower = {c.lower(): c for c in df.columns}
        if variety.lower() not in columns_lower:
            available = list(df.columns)
            raise ValueError(f"Variety '{variety}' not found in CSV columns. Available: {available}")
        actual_col = columns_lower[variety.lower()]
        prices = df[actual_col].astype(float).dropna()
        prices.name = actual_col

        print(f"Data Summary for {actual_col}:")
        print(prices.describe())

        # Plot raw prices (save to file for inspection)
        try:
            plt.figure(figsize=(10, 5))
            plt.plot(prices.index, prices.values, marker='o')
            plt.title(f'Price Patterns for {actual_col}')
            plt.xlabel('Date')
            plt.ylabel('Price')
            plt.grid(True)
            plot_path = f"rice_price_patterns_{actual_col}.png"
            plt.tight_layout()
            plt.savefig(plot_path)
            plt.close()
            print(f"Saved plot to {plot_path}")
        except Exception as e:
            print(f"Could not plot prices: {e}")

        # Seasonal decomposition optional
        try:
            if len(prices) >= 24:  # need enough points for reliable seasonality
                decomposition = seasonal_decompose(prices, model='additive', period=12)
                fig = decomposition.plot()
                fig.suptitle(f'Price Decomposition for {actual_col}')
                decomp_path = f"rice_price_decomposition_{actual_col}.png"
                fig.savefig(decomp_path)
                plt.close(fig)
                print(f"Saved decomposition to {decomp_path}")
        except Exception as e:
            print(f"Skipping decomposition (not enough data or error): {e}")

        return prices
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

# -------------------------
# Train / load ARIMA model
# -------------------------
def train_and_save_model(prices, variety='Samba'):
    try:
        model_path = f"price_model_{variety}.pkl"
        stats_path = f"price_model_{variety}_sm.pkl"

        # Try to load statsmodels saved results first
        if os.path.exists(stats_path):
            try:
                model_fit = SARIMAXResults.load(stats_path)
                print(f"Loaded statsmodels model from {stats_path}")
                return model_fit
            except Exception as e:
                print(f"Could not load statsmodels model: {e}")

        # Try joblib load fallback
        if os.path.exists(model_path):
            try:
                model_fit = joblib.load(model_path)
                print(f"Loaded joblib model from {model_path}")
                return model_fit
            except Exception as e:
                print(f"Could not load joblib model: {e}")

        # Train new ARIMA model (p=2,d=1,q=2) - adjust if it fails
        print("Training new ARIMA model. This may take a few seconds...")
        model = ARIMA(prices, order=(2, 1, 2))
        model_fit = model.fit()

        # Try to save using statsmodels' save (more robust for forecasts)
        try:
            model_fit.save(stats_path)
            print(f"ARIMA statsmodels model saved as {stats_path}")
        except Exception as e:
            print(f"Could not save with statsmodels .save(): {e}, will attempt joblib dump.")
            try:
                joblib.dump(model_fit, model_path)
                print(f"ARIMA model saved with joblib as {model_path}")
            except Exception as e2:
                print(f"Failed to save model with joblib: {e2}")

        return model_fit
    except Exception as e:
        print(f"Error training model for {variety}: {e}")
        return None

# -------------------------
# Predict next price
# -------------------------
def predict_next_price(model_fit, prices):
    try:
        # compute next period date
        next_date = prices.index[-1] + pd.DateOffset(months=1)

        # statsmodels results have get_forecast; handle both returned types
        try:
            forecast_obj = model_fit.get_forecast(steps=1)
            predicted_mean = forecast_obj.predicted_mean
            predicted_price = float(predicted_mean.iloc[0]) if hasattr(predicted_mean, 'iloc') else float(predicted_mean[0])
        except Exception:
            # fallback to model_fit.forecast
            forecast = model_fit.forecast(steps=1)
            predicted_price = float(forecast[0]) if hasattr(forecast, '__iter__') else float(forecast)

        print(f"Predicted price for {next_date.strftime('%Y-%m')} ({prices.name}): {predicted_price:.2f}")
        return predicted_price, next_date
    except Exception as e:
        print(f"Error in prediction: {e}")
        return None, None

# -------------------------
# Decision logic
# -------------------------
def decide_sell_store(current_price, predicted_price, threshold=0.05):
    try:
        current_price = float(current_price)
        predicted_price = float(predicted_price)
        if current_price == 0:
            return "UNDETERMINED (current price is 0)"
        price_change = (predicted_price - current_price) / current_price
        if price_change > threshold:
            recommendation = f"SELL NOW (expected rise {price_change*100:.1f}%)"
        elif price_change < -threshold:
            recommendation = f"STORE (expected drop {abs(price_change)*100:.1f}%)"
        else:
            recommendation = f"HOLD (change within ±{threshold*100}%)"
        print(f"Current Price: {current_price:.2f}, Predicted: {predicted_price:.2f}, Recommendation: {recommendation}")
        return recommendation
    except Exception as e:
        print(f"Error in decision logic: {e}")
        return None

# -------------------------
# Store in Firebase (optional)
# -------------------------
def store_in_firebase(predicted_price, next_date, recommendation, current_price, variety='Samba'):
    try:
        if db is None:
            print("Firebase not configured; skipping store.")
            return

        # document id: YYYY-MM_variety
        doc_id = f"{next_date.strftime('%Y-%m')}_{variety}"
        doc_ref = db.collection('rice_predictions').document(doc_id)
        doc_ref.set({
            'variety': variety,
            'date': next_date.strftime('%Y-%m-%d'),
            'current_price': float(current_price),
            'predicted_price': round(float(predicted_price), 2),
            'price_change_percent': round((float(predicted_price) - float(current_price))/float(current_price)*100, 2) if current_price != 0 else None,
            'recommendation': recommendation,
            'created_at': datetime.utcnow()
        })
        print(f"Prediction for {variety} stored in Firebase (doc: {doc_id})")
    except Exception as e:
        print(f"Error storing in Firebase for {variety}: {e}")


# -------------------------
# Iterative forecasting + CSV append
# -------------------------
def iterative_forecast_and_append(csv_file, variety='Samba', months=1, append_to_csv=True, retrain_each_step=False):
    """Perform iterative next-month forecasts for `months` months.

    For each step:
      - train or load a model for the current series
      - predict the next month price
      - append the predicted value to the in-memory series
      - optionally append the predicted row to the CSV file (persist)

    Parameters:
      csv_file: path to CSV containing historical data
      variety: column name (case-insensitive) to forecast
      months: number of months to forecast iteratively
      append_to_csv: if True, the CSV will be updated with predicted rows
      retrain_each_step: if True, retrain the model at every step (slower but more correct)

    Returns:
      list of dicts with keys: variety, current_price, predicted_price, date, recommendation
    """
    try:
        # Read CSV (allow common delimiter)
        try:
            df = pd.read_csv(csv_file)
        except Exception:
            df = pd.read_csv(csv_file, delimiter=';')

        # detect date column
        date_col = None
        for candidate in ['Year-Month', 'Year_Month', 'Date', 'Month', 'year_month']:
            if candidate in df.columns:
                date_col = candidate
                break
        if date_col is None:
            raise KeyError("No date column found. Expected 'Year-Month' or 'Date' in CSV header.")

        # parse dates
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        df = df.dropna(subset=[date_col]).sort_values(date_col)

        # find actual variety column
        columns_lower = {c.lower(): c for c in df.columns}
        if variety.lower() not in columns_lower:
            available = list(df.columns)
            raise ValueError(f"Variety '{variety}' not found in CSV columns. Available: {available}")
        actual_col = columns_lower[variety.lower()]

        # construct price series
        prices = df.set_index(date_col)[actual_col].astype(float).dropna()
        prices.name = actual_col

        results = []

        for step in range(months):
            # (re)train or load model
            model_fit = train_and_save_model(prices, variety)
            if model_fit is None:
                print(f"Failed to obtain model at step {step} for {variety}")
                break

            predicted_price, next_date = predict_next_price(model_fit, prices)
            if predicted_price is None or next_date is None:
                print(f"Prediction failed at step {step} for {variety}")
                break

            current_price = float(prices.iloc[-1])
            recommendation = decide_sell_store(current_price, predicted_price)

            res = {
                'variety': variety,
                'current_price': round(float(current_price), 2),
                'predicted_price': round(float(predicted_price), 2),
                'date': next_date.strftime('%Y-%m'),
                'recommendation': recommendation
            }
            results.append(res)

            # append to in-memory series
            try:
                new_idx = pd.to_datetime([next_date])
                new_series = pd.Series([predicted_price], index=new_idx)
                prices = pd.concat([prices, new_series])
            except Exception as e:
                print(f"Could not append predicted price to series: {e}")

            # persist to CSV if requested
            if append_to_csv:
                try:
                    # create new row matching columns (leave other columns blank/NaN)
                    new_row = {c: None for c in df.columns}
                    # write date in YYYY-MM or YYYY-MM-DD form depending on original precision
                    # choose YYYY-MM if original dates are month-precision
                    sample_str = df[date_col].dt.strftime('%Y-%m').iloc[0] if not df.empty else next_date.strftime('%Y-%m')
                    # prefer YYYY-MM if original formatting appears month-based
                    date_str = next_date.strftime('%Y-%m') if all(df[date_col].dt.day == 1) else next_date.strftime('%Y-%m-%d')
                    new_row[date_col] = date_str
                    new_row[actual_col] = float(predicted_price)
                    df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
                    df.to_csv(csv_file, index=False)
                    print(f"Appended prediction to CSV {csv_file}: {date_str} -> {predicted_price:.2f}")
                except Exception as e:
                    print(f"Failed to append predicted row to CSV: {e}")

            # if retrain_each_step is True, next loop will retrain; otherwise retraining happens each loop anyway because we call train_and_save_model using updated prices
            # continue to next step

        return results

    except Exception as e:
        print(f"Error in iterative_forecast_and_append: {e}")
        return None
