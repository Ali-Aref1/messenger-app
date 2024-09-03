@echo off
start "Chat App - Interface" cmd /k "npm run dev -- --host"
start "Chat App - Server" cmd /k "node server\server.cjs"
