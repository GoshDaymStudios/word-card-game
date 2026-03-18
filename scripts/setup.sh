#!/bin/bash

echo "Setting up word-card-game..."

# install frontend
cd app || exit
npm install

# tilbake til root
cd ..

echo "Setup complete."