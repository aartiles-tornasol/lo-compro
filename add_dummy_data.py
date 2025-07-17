
import json
import random
import datetime
import requests

# --- Configuración ---
# URL de tu Firebase Realtime Database. Añade '/items.json' al final.
DATABASE_URL = "https://lo-compro-aartiles-default-rtdb.europe-west1.firebasedatabase.app/items.json"

# --- Datos Base para Generación ---
# Lista de productos base. Se generarán varias entradas para cada uno.
BASE_PRODUCTS = [
    {"name": "Leche Entera", "unit": "l"},
    {"name": "Pan de Molde", "unit": "paq"},
    {"name": "Aguacates", "unit": "kg"},
    {"name": "Huevos Camperos", "unit": "ud"},
    {"name": "Queso Curado", "unit": "kg"},
    {"name": "Jamón Serrano", "unit": "paq"},
    {"name": "Yogur Griego", "unit": "ud"},
    {"name": "Cereales Fitness", "unit": "g"},
    {"name": "Aceite de Oliva", "unit": "l"},
    {"name": "Tomate Frito", "unit": "ml"}
]

SUPERMARKETS = ["Mercadona", "Hiperdino", "Alcampo", "Lidl", "Spar"]

# --- Lógica de Cálculo (Reimplementación de la de JS) ---
def calculate_price_per_unit(price, quantity, unit):
    if not price or not quantity:
        return None, None
    
    price_per_unit = None
    unit_per_unit = None
    unit_lower = unit.lower()

    if unit_lower == 'ml':
        price_per_unit = price / (quantity / 1000)
        unit_per_unit = '€/l'
    elif unit_lower == 'g':
        price_per_unit = price / (quantity / 1000)
        unit_per_unit = '€/kg'
    elif unit_lower in ['l', 'kg']:
        price_per_unit = price / quantity
        unit_per_unit = f"€/{unit_lower}"
    elif unit_lower in ['ud', 'uds', 'paq', 'lata', 'caja']:
        price_per_unit = price / quantity
        unit_per_unit = '€/ud'
    else:
        price_per_unit = price / quantity
        unit_per_unit = f"€/{unit_lower}"
        
    return (round(price_per_unit, 2) if price_per_unit is not None else None, unit_per_unit)

# --- Generación de Datos ---
def generate_dummy_data():
    print("Generando datos de prueba realistas...")
    
    all_new_items = {}
    
    for product_info in BASE_PRODUCTS:
        base_name = product_info["name"]
        unit = product_info["unit"]
        # Precio base aleatorio para este grupo de productos
        base_price = random.uniform(1.0, 15.0)
        
        # Generar entre 5 y 10 registros por cada producto base
        for _ in range(random.randint(5, 10)):
            # Clave única similar a la de Firebase
            firebase_key = f"-DUMMY_{''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', k=16))}"
            
            # Variación de precio (+/- 15% sobre el precio base)
            price_float = base_price * random.uniform(0.85, 1.15)
            price_str_comma = f"{price_float:.2f}".replace('.', ',')
            
            quantity = 1 # Para simplificar, la mayoría de items son de cantidad 1
            if unit in ['g', 'ml']:
                quantity = random.choice([250, 500, 750])

            # Fecha aleatoria en el último año
            date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=random.randint(0, 365))
            
            ppu_val, ppu_unit = calculate_price_per_unit(price_float, quantity, unit)

            all_new_items[firebase_key] = {
                "producto": f"Dummy {base_name}",
                "supermercado": random.choice(SUPERMARKETS),
                "precio": price_str_comma,
                "cantidad": quantity,
                "unidad": unit,
                "fecha": date.isoformat().replace('+00:00', 'Z'),
                "precioPorUnidad": ppu_val,
                "unidadPrecioPorUnidad": ppu_unit
            }
            
    print(f"Se han generado {len(all_new_items)} registros de prueba.")
    return all_new_items

# --- Subida a Firebase ---
def upload_to_firebase(data):
    if not data:
        print("No hay datos para subir.")
        return

    print(f"Subiendo datos a Firebase: {DATABASE_URL}")
    
    # Usamos PATCH para añadir/actualizar datos sin borrar lo que ya existe
    response = requests.patch(DATABASE_URL, data=json.dumps(data))
    
    if response.status_code == 200:
        print("¡Éxito! Los datos de prueba se han añadido a Firebase.")
    else:
        print(f"Error al subir los datos. Firebase respondió con el código: {response.status_code}")
        print(f"Respuesta: {response.text}")

# --- Ejecución Principal ---
if __name__ == "__main__":
    dummy_data = generate_dummy_data()
    upload_to_firebase(dummy_data)
