@echo off
setlocal

where bash >nul 2>nul
if errorlevel 1 (
    echo Bash was not found. Install Git for Windows and run this from Git Bash, PowerShell, or cmd with Git for Windows on PATH.
    exit /b 1
)

bash "%~dp0install-git-hooks.sh"
exit /b %errorlevel%
