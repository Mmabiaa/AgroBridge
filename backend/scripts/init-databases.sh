#!/bin/bash
set -e

# Initialize databases for all microservices
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create databases for each microservice
    CREATE DATABASE agrobridge_authentication;
    CREATE DATABASE agrobridge_users;
    CREATE DATABASE agrobridge_farms;
    CREATE DATABASE agrobridge_marketplace;
    CREATE DATABASE agrobridge_ai_assistant;
    CREATE DATABASE agrobridge_crop_detection;
    CREATE DATABASE agrobridge_financial;
    CREATE DATABASE agrobridge_learning;
    CREATE DATABASE agrobridge_community;
    CREATE DATABASE agrobridge_iot;
    CREATE DATABASE agrobridge_notifications;
    CREATE DATABASE agrobridge_analytics;
    CREATE DATABASE agrobridge_scheduling;
    CREATE DATABASE agrobridge_payments;
    CREATE DATABASE agrobridge_blockchain;
    CREATE DATABASE agrobridge_export_docs;
    CREATE DATABASE agrobridge_emergency;
    CREATE DATABASE agrobridge_storage;
    CREATE DATABASE agrobridge_admin;

    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_authentication TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_users TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_farms TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_marketplace TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_ai_assistant TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_crop_detection TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_financial TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_learning TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_community TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_iot TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_notifications TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_analytics TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_scheduling TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_payments TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_blockchain TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_export_docs TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_emergency TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_storage TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE agrobridge_admin TO $POSTGRES_USER;

    -- Create extensions for each database
    \c agrobridge_farms
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    \c agrobridge_marketplace
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    \c agrobridge_analytics
    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

    \c agrobridge_blockchain
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    -- Output success message
    SELECT 'All databases created successfully!' AS status;
EOSQL

echo "Database initialization completed!"
