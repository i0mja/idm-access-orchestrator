
#!/bin/bash

# IdM Access Configurator Backend Startup Script
# Ensure you have kinit admin completed before running

echo "Starting IdM Access Configurator Backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Check Kerberos ticket
echo "Checking Kerberos authentication..."
klist > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "WARNING: No active Kerberos ticket found. Run 'kinit admin' before starting."
    echo "The application may not function properly without IdM authentication."
fi

# Start the FastAPI server
echo "Starting FastAPI server on http://0.0.0.0:8000"
python main.py
