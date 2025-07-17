#!/bin/bash

# URL de tu Firebase Realtime Database
DATABASE_URL="https://lo-compro-aartiles-default-rtdb.europe-west1.firebasedatabase.app"
ITEMS_URL="$DATABASE_URL/items.json"

echo "Borrando datos de prueba ('Dummy') de Firebase..."
echo "URL: $DATABASE_URL"
echo "----------------------------------------------------------"

# 1. Obtener todos los items de la base de datos
# Usamos -s para modo silencioso
ALL_ITEMS=$(curl -s "$ITEMS_URL")

# Comprobar si la descarga falló o no hay datos
if [ -z "$ALL_ITEMS" ] || [ "$ALL_ITEMS" == "null" ]; then
  echo "No se encontraron datos o no se pudo conectar a Firebase. Saliendo."
  exit 0
fi

# 2. Usar jq para encontrar las claves de los productos "Dummy"
# jq es un procesador de JSON de línea de comandos. Es más robusto que usar grep/sed.
# -r para obtener el output raw (sin comillas)
# to_entries convierte el objeto en un array de {key, value}
# .[] itera sobre el array
# select(.value.producto | startswith("Dummy")) filtra los que empiezan con "Dummy"
# .key extrae la clave
DUMMY_KEYS=$(echo "$ALL_ITEMS" | jq -r 'to_entries | .[] | select(.value.producto | startswith("Dummy")) | .key')

# Comprobar si se encontraron claves para borrar
if [ -z "$DUMMY_KEYS" ]; then
  echo "No se encontraron productos con el prefijo 'Dummy' para borrar."
  exit 0
fi

# 3. Iterar sobre cada clave y enviar una petición DELETE
COUNT=0
for KEY in $DUMMY_KEYS; do
  echo "Borrando item con clave: $KEY"
  DELETE_URL="$DATABASE_URL/items/$KEY.json"
  
  # Enviar la petición DELETE
  curl -s -X DELETE "$DELETE_URL" > /dev/null
  
  COUNT=$((COUNT + 1))
  # Pausa para no sobrecargar la API
  sleep 0.05
done

echo "----------------------------------------------------------"
echo "¡Borrado completado! Se eliminaron $COUNT registros."
