#!/bin/bash
# OSRM France setup script
# Downloads OpenStreetMap France data from Geofabrik and preprocesses it for OSRM
# Idempotent: skips download if data already exists

set -e

DATA_DIR="$(dirname "$0")/data"
FRANCE_PBF="$DATA_DIR/france-latest.osm.pbf"
FRANCE_OSRM="$DATA_DIR/france-latest.osrm"
GEOFABRIK_URL="https://download.geofabrik.de/europe/france-latest.osm.pbf"

mkdir -p "$DATA_DIR"

# Step 1: Download France PBF if not present
if [ -f "$FRANCE_PBF" ]; then
    echo "[OSRM] france-latest.osm.pbf already exists, skipping download."
else
    echo "[OSRM] Downloading France OSM data from Geofabrik..."
    wget -O "$FRANCE_PBF" "$GEOFABRIK_URL"
    echo "[OSRM] Download complete."
fi

# Step 2: Extract (if .osrm not present)
if [ -f "$FRANCE_OSRM" ]; then
    echo "[OSRM] france-latest.osrm already exists, skipping extract."
else
    echo "[OSRM] Running osrm-extract (car profile)..."
    docker run --rm -t -v "$DATA_DIR:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/france-latest.osm.pbf
    echo "[OSRM] Extract complete."
fi

# Step 3: Partition
if [ -f "$FRANCE_OSRM.partition" ]; then
    echo "[OSRM] Partition already exists, skipping."
else
    echo "[OSRM] Running osrm-partition..."
    docker run --rm -t -v "$DATA_DIR:/data" osrm/osrm-backend osrm-partition /data/france-latest.osrm
    echo "[OSRM] Partition complete."
fi

# Step 4: Customize
if [ -f "$FRANCE_OSRM.cell_metrics" ]; then
    echo "[OSRM] Customization already exists, skipping."
else
    echo "[OSRM] Running osrm-customize..."
    docker run --rm -t -v "$DATA_DIR:/data" osrm/osrm-backend osrm-customize /data/france-latest.osrm
    echo "[OSRM] Customize complete."
fi

echo "[OSRM] Setup complete! You can now start OSRM with docker-compose."
