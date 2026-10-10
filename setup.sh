#!/bin/bash
set -e

# Root Setup
npm init -y
npm install concurrently -D

# Frontend
rm -rf frontend
npm create vite@latest frontend -- --template react
cd frontend
npm install axios react-router-dom lucide-react recharts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
cd ..

# Backend
cd backend
npm init -y
npm install express dotenv cors mongoose cookie-parser bcrypt jsonwebtoken axios
mkdir -p src/{controllers,routes,models,middleware,services,utils}
cd ..

# ML
cd ml
mkdir -p app/{models,services,routes,utils} data notebooks
touch requirements.txt
cd ..

