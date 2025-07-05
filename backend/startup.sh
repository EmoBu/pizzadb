#!/bin/bash

# Lade die Datenbank, wenn sie nicht vorhanden ist
if [ ! -f pizza.db ]; then
    echo "Lade pizza.db von Dropbox..."
    wget -O pizza.db "https://www.dropbox.com/scl/fi/36583kaen7ju839ks04h9/pizza.db?rlkey=k7az2yvi2mzimvopzn9otxahg&st=wa0h4y8x&dl=1"
fi

# Starte die Flask-App
python app.py
