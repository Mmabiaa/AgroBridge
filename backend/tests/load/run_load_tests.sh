#!/bin/bash
# Load testing script for AgroBridge
# Runs various load test scenarios

set -e

echo "=== AgroBridge Load Testing ==="
echo ""

# Configuration
HOST="${LOAD_TEST_HOST:-http://localhost:8000}"
USERS="${LOAD_TEST_USERS:-100}"
SPAWN_RATE="${LOAD_TEST_SPAWN_RATE:-10}"
RUN_TIME="${LOAD_TEST_RUN_TIME:-5m}"

# Create results directory
RESULTS_DIR="load_test_results_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo "Configuration:"
echo "  Host: $HOST"
echo "  Users: $USERS"
echo "  Spawn Rate: $SPAWN_RATE/s"
echo "  Run Time: $RUN_TIME"
echo "  Results: $RESULTS_DIR"
echo ""

# Test 1: Normal Load Test
echo "Running Normal Load Test..."
locust -f locustfile.py \
    --host="$HOST" \
    --users="$USERS" \
    --spawn-rate="$SPAWN_RATE" \
    --run-time="$RUN_TIME" \
    --headless \
    --html="$RESULTS_DIR/normal_load_report.html" \
    --csv="$RESULTS_DIR/normal_load" \
    --loglevel INFO

echo "✓ Normal Load Test completed"
echo ""

# Test 2: Spike Test (sudden traffic increase)
echo "Running Spike Test..."
locust -f locustfile.py \
    --host="$HOST" \
    --users=$((USERS * 3)) \
    --spawn-rate=$((SPAWN_RATE * 5)) \
    --run-time="2m" \
    --headless \
    --html="$RESULTS_DIR/spike_test_report.html" \
    --csv="$RESULTS_DIR/spike_test" \
    --loglevel INFO \
    SpikeTestUser

echo "✓ Spike Test completed"
echo ""

# Test 3: Stress Test (gradually increasing load)
echo "Running Stress Test..."
for users in 50 100 200 400; do
    echo "  Testing with $users users..."
    locust -f locustfile.py \
        --host="$HOST" \
        --users="$users" \
        --spawn-rate="$SPAWN_RATE" \
        --run-time="1m" \
        --headless \
        --html="$RESULTS_DIR/stress_test_${users}_users.html" \
        --csv="$RESULTS_DIR/stress_test_${users}_users" \
        --loglevel WARNING \
        StressTestUser
done

echo "✓ Stress Test completed"
echo ""

# Test 4: Endurance Test (sustained load)
echo "Running Endurance Test..."
locust -f locustfile.py \
    --host="$HOST" \
    --users="$USERS" \
    --spawn-rate="$SPAWN_RATE" \
    --run-time="30m" \
    --headless \
    --html="$RESULTS_DIR/endurance_test_report.html" \
    --csv="$RESULTS_DIR/endurance_test" \
    --loglevel WARNING

echo "✓ Endurance Test completed"
echo ""

# Generate summary report
echo "Generating summary report..."
python3 << EOF
import json
import csv
from pathlib import Path

results_dir = Path("$RESULTS_DIR")
summary = {
    "test_date": "$(date)",
    "configuration": {
        "host": "$HOST",
        "users": $USERS,
        "spawn_rate": $SPAWN_RATE,
        "run_time": "$RUN_TIME"
    },
    "tests": []
}

# Parse CSV results
for csv_file in results_dir.glob("*_stats.csv"):
    test_name = csv_file.stem.replace("_stats", "")
    with open(csv_file) as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        if rows:
            summary["tests"].append({
                "name": test_name,
                "total_requests": sum(int(r.get("Request Count", 0)) for r in rows),
                "failure_rate": sum(int(r.get("Failure Count", 0)) for r in rows) / max(sum(int(r.get("Request Count", 1)) for r in rows), 1),
                "avg_response_time": sum(float(r.get("Average Response Time", 0)) for r in rows) / len(rows)
            })

with open(results_dir / "summary.json", "w") as f:
    json.dump(summary, f, indent=2)

print("Summary saved to summary.json")
EOF

echo ""
echo "=== Load Testing Complete ==="
echo "Results saved to: $RESULTS_DIR"
echo ""
echo "View reports:"
echo "  - Normal Load: $RESULTS_DIR/normal_load_report.html"
echo "  - Spike Test: $RESULTS_DIR/spike_test_report.html"
echo "  - Stress Test: $RESULTS_DIR/stress_test_*_users.html"
echo "  - Endurance Test: $RESULTS_DIR/endurance_test_report.html"
echo "  - Summary: $RESULTS_DIR/summary.json"
