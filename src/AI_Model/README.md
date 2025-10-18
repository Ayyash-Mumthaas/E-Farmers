AI_Model — how to run and schedule monthly updates
===============================================

Overview
--------
This folder contains the prediction API and model code for rice price forecasting.

Key files
- `app.py` — Flask API exposing `/get_price`.
- `train_ai.py` — data loading, ARIMA training, prediction, and optional Firebase storage.
- `monthly_update.py` — utility that runs monthly predictions for multiple varieties and writes results to a JSON file and optionally to Firebase.
- `data/5YearOfPriceData.csv` — required CSV data.
- `requirements.txt` — Python dependencies.

Quick start
-----------
1. Create and activate a virtual environment in this folder:

```powershell
cd path\to\project\src\AI_Model
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Run the Flask API (one terminal):

```powershell
python app.py
```

3. Run tests (in another terminal with the same venv activated):

```powershell
python test_api.py
python test_varieties.py
python test_direct.py   # runs model code directly, no server required
```

Run monthly update manually
---------------------------
From the same folder and venv:

```powershell
python monthly_update.py
```

Scheduling monthly runs (Windows Task Scheduler)
-----------------------------------------------
1. Open Task Scheduler.
2. Create a new Basic Task.
3. Trigger: Monthly (choose day/time).
4. Action: Start a program.
   - Program/script: path\to\python.exe (for example C:\Python39\python.exe or .venv\Scripts\python.exe)
   - Add arguments: monthly_update.py
   - Start in: the `src\AI_Model` folder
5. Save. The task will run monthly and produce a `monthly_predictions_YYYYMMDDT...json` file in the folder.

Notes & recommendations
-----------------------
- Keep `firebase_credentials.json` out of source control; add it to `.gitignore` if you use Firebase.
- If ARIMA training is slow, run monthly updates on a machine with adequate CPU or pretrain models and keep the saved model files.
# AI Rice Price Prediction Server

This is the Python Flask server that provides AI-powered rice price predictions using ARIMA time series analysis.

## Setup and Installation

1. Install Python dependencies:
```bash
cd src/AI_Model
pip install -r requirements.txt
```

2. Make sure the CSV data file exists at: `src/AI_Model/data/5YearOfPriceData.csv`

## Running the Server

```bash
cd src/AI_Model
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoint

### POST /get_price

**Request Body:**
```json
{
    "variety": "Samba"
}
```

**Response:**
```json
{
    "variety": "Samba",
    "currentPrice": 95.0,
    "predictedPrice": 96.5,
    "date": "2025-02",
    "recommendation": "SELL NOW (expected rise 1.6%)"
}
```

## Available Rice Varieties

- Samba
- Nadu
- Keeri Samba
- Red Nadu
- White Raw
- Red Raw
- Suwandel
- Kalu Heenati
- Masuran
- Ma Wee
- Kurulu Thuda
- Rath Suwandal

## Integration with React App

The React app (FarmerDashboard) will automatically call this server when a rice variety is selected. If the server is not running, it will fall back to mock data.

