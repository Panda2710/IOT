CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE devices (
    device_id VARCHAR(50) PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    status BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE metrics (
    metric_id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(device_id) ON DELETE CASCADE,
    temperature NUMERIC(5,2),
    humidity NUMERIC(5,2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alert_logs (
    log_id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(device_id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);