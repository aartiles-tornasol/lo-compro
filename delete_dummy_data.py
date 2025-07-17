
import json
import requests

# --- Configuración ---
# URL de tu Firebase Realtime Database. Añade '/items.json' al final.
DATABASE_URL = "https://lo-compro-aartiles-default-rtdb.europe-west1.firebasedatabase.app/items.json"

# --- Lógica de Borrado ---
def delete_dummy_data():
    print(f"Obteniendo datos desde: {DATABASE_URL}")
    
    # 1. Obtener todos los items de la base de datos
    try:
        response = requests.get(DATABASE_URL)
        response.raise_for_status() # Lanza un error si la petición falla
        all_items = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error al conectar con Firebase: {e}")
        return

    if not all_items:
        print("No se encontraron datos en la base de datos. Saliendo.")
        return

    # 2. Encontrar las claves de los productos "Dummy"
    keys_to_delete = []
    for key, value in all_items.items():
        # Usamos .get() para evitar errores si la clave 'producto' no existe
        if value.get("producto", "").startswith("Dummy"):
            keys_to_delete.append(key)
    
    if not keys_to_delete:
        print("No se encontraron productos con el prefijo 'Dummy' para borrar.")
        return

    print(f"Se encontraron {len(keys_to_delete)} registros para borrar.")

    # 3. Iterar sobre cada clave y enviar una petición DELETE
    delete_count = 0
    for key in keys_to_delete:
        delete_url = f"https://lo-compro-aartiles-default-rtdb.europe-west1.firebasedatabase.app/items/{key}.json"
        try:
            del_response = requests.delete(delete_url)
            del_response.raise_for_status()
            print(f"  - Borrado: {key}")
            delete_count += 1
        except requests.exceptions.RequestException as e:
            print(f"  - Error al borrar {key}: {e}")

    print("----------------------------------------------------------")
    print(f"¡Borrado completado! Se eliminaron {delete_count} de {len(keys_to_delete)} registros encontrados.")

# --- Ejecución Principal ---
if __name__ == "__main__":
    delete_dummy_data()
