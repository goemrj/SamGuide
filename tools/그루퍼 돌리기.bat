@echo off
rem SAM 신포괄 명세서를 심평원 신포괄 그루퍼로 돌린다.
rem 이 파일 위에 SAM 파일을 끌어다 놓거나, 그냥 더블클릭해도 된다.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0kdrg-grouper.ps1" %*
