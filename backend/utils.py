import json
import os

# Define the base directory for the data folder
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

def load_data(filename):
    try:
        # Ensure the file path is within the existing data folder
        absolute_path = os.path.join(DATA_DIR, filename)
        print(f"Attempting to load data from {absolute_path}")
        if not os.path.exists(absolute_path):
            print(f"File {absolute_path} does not exist")
            if "drivers" in filename:
                return {"drivers": []}
            return []
            
        with open(absolute_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"Successfully loaded data from {absolute_path}")
            return data
    except Exception as e:
        print(f"Error loading data from {absolute_path}: {str(e)}")
        if "drivers" in filename:
            return {"drivers": []}
        return []

def save_data(filename, data):
    try:
        # Ensure the file path is within the existing data folder
        absolute_path = os.path.join(DATA_DIR, filename)
        print(f"Attempting to save data to {absolute_path}")
        with open(absolute_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"Successfully saved data to {absolute_path}")
    except Exception as e:
        print(f"Error saving data to {absolute_path}: {str(e)}")

def generate_id(id_type, path="id_tracker.json"):
    # Ensure the path is within the existing data folder
    absolute_path = os.path.join(DATA_DIR, path)
    ids = load_data(absolute_path)
    current = ids.get(id_type, 1)
    ids[id_type] = current + 1
    save_data(absolute_path, ids)
    return current
