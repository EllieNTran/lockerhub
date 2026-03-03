#!/bin/bash

while ! [[ $(echo "\dn" | docker exec -i lockerhub-postgres-1 psql -U postgres 2> /dev/null) ]]; do
  echo "Postgres loading..."
  sleep 1
done

echo "Postgres ready"

# Run all migration scripts
for script in /var/run/db/scripts/*.sql ; do
  if [ -f "$script" ]; then
    echo "Running migration: $(basename "$script")"
    docker exec -i lockerhub-postgres-1 psql -U postgres < "$script"
    
    if [ $? -eq 0 ]; then
      echo "✓ Success: $(basename "$script")"
    else
      echo "✗ Failed: $(basename "$script")"
      exit 1
    fi
  fi
done

echo "All migrations completed successfully"

