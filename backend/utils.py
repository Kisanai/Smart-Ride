import json
import os

def load_data(filename):
    try:
        with open(filename, 'r') as f:
            return json.load(f)
    except:
        return []

def save_data(filename, data):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)

def generate_id(id_type, path="data/id_tracker.json"):
    ids = load_data(path)
    current = ids.get(id_type, 1)
    ids[id_type] = current + 1
    save_data(path, ids)
    return current
