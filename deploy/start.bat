@echo off
REM فاتورة — Deploy Start Script
REM Run this on the server

echo Installing dependencies...
call npm install --production --ignore-scripts 2>nul

echo Running database migrations...
npx prisma db push 2>&1

echo Seeding database...
npx prisma db seed 2>nul

echo Starting server...
set NODE_ENV=production
node server.js
