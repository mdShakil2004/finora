import json
import random
import time
from datetime import datetime, timedelta

def generate_dataset():
    random.seed(42)
    
    merchants_by_cat = {
        "Shopping": ["Amazon", "Flipkart", "Myntra", "Ajio", "Zara", "Decathlon"],
        "Food & Dining": ["Swiggy", "Zomato", "Starbucks", "Dominos", "McDonalds", "Baskin Robbins"],
        "Travel": ["Uber", "Ola", "MakeMyTrip", "IndiGo", "IRCTC", "RedBus"],
        "Utilities": ["Electricity Board", "Airtel Broadband", "Jio Recharge", "Gas Utility", "Water Supply"],
        "Entertainment": ["Netflix", "BookMyShow", "Spotify", "Disney+ Hotstar", "Steam", "PVR Cinemas"],
        "Electronics": ["Apple Store", "Samsung Store", "Croma", "Reliance Digital", "Dell"],
        "Subscriptions": ["YouTube Premium", "Medium", "GitHub", "ChatGPT Plus", "Prime Membership"],
        "Healthcare": ["Apollo Pharmacy", "Practo", "1mg", "Netmeds", "Thyrocare"],
        "Groceries": ["Blinkit", "Zepto", "Instamart", "BigBasket", "Reliance Fresh"]
    }
    
    payment_methods = ["UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet"]
    
    statuses_raw = [
        "SUCCESS", "SUCCESS", "SUCCESS", "SUCCESS", "SUCCESS", "SUCCESS", "SUCCESS",
        "success", "Success", "SUCCEEDED",
        "FAILED", "failed", "Failed",
        "PENDING", "pending", "Pending"
    ]
    
    categories_list = list(merchants_by_cat.keys())
    
    start_date = datetime(2025, 8, 1)
    end_date = datetime(2026, 8, 1)
    date_span_seconds = int((end_date - start_date).total_seconds())
    
    records = []
    
    for i in range(1, 10001):
        tx_id = f"TXN-{100000 + i}"
        
        # Pick category (sometimes null or empty to test normalization)
        cat_roll = random.random()
        if cat_roll < 0.08:
            cat = None
        elif cat_roll < 0.12:
            cat = ""
        elif cat_roll < 0.14:
            cat = "   "
        else:
            cat = random.choice(categories_list)
            
        if cat and cat.strip() in merchants_by_cat:
            merchant = random.choice(merchants_by_cat[cat.strip()])
        else:
            merchant = random.choice(["Amazon", "Swiggy", "Uber", "Store Merchant", "Local Shop", "Vendor Pay"])
            
        status = random.choice(statuses_raw)
        payment_method = random.choice(payment_methods)
        
        # Amount formatting
        # 5% negative amounts (refunds/reversals)
        if random.random() < 0.05:
            amt_val = -round(random.uniform(50.0, 3500.0), 2)
        else:
            amt_val = round(random.uniform(20.0, 25000.0), 2)
            
        # Inconsistent numeric representations
        num_format_roll = random.random()
        if num_format_roll < 0.1:
            amount = str(amt_val)
        elif num_format_roll < 0.2:
            amount = f"{amt_val:.1f}"
        else:
            amount = amt_val
            
        # Timestamp generation with varied formats
        rand_secs = random.randint(0, date_span_seconds)
        dt = start_date + timedelta(seconds=rand_secs)
        
        time_format_roll = random.random()
        if time_format_roll < 0.35:
            # Standard ISO with Z
            timestamp = dt.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
        elif time_format_roll < 0.55:
            # ISO with timezone offset
            timestamp = dt.strftime("%Y-%m-%dT%H:%M:%S") + "+05:30"
        elif time_format_roll < 0.70:
            # Date-only value
            timestamp = dt.strftime("%Y-%m-%d")
        elif time_format_roll < 0.85:
            # Slash formatted
            timestamp = dt.strftime("%Y/%m/%d %H:%M:%S")
        else:
            # Unix timestamp in milliseconds
            timestamp = int(dt.timestamp() * 1000)
            
        records.append({
            "id": tx_id,
            "timestamp": timestamp,
            "merchant": merchant,
            "category": cat,
            "amount": amount,
            "currency": "INR",
            "status": status,
            "payment_method": payment_method
        })
        
    with open("transactions.json", "w") as f:
        json.dump(records, f, indent=2)
        
    print(f"Generated {len(records)} transaction records in transactions.json")

if __name__ == "__main__":
    generate_dataset()
