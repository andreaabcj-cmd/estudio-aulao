@echo off
rem Abre o Estudio Aulao neste PC. Pode fechar a janela minimizada quando terminar.
cd /d "%~dp0"
start "Estudio Aulao (servidor)" /min python ferramentas\servidor.py 8790
timeout /t 2 /nobreak >nul
start "" http://localhost:8790
