@echo off
:: %*는 모든 인자를 WSL gpg로 전달합니다.
:: 윈도우 환경에서도 DISPLAY와 TTY 환경변수가 주입되도록 구성합니다.
wsl.exe sh -c "export DISPLAY=:0; export GPG_TTY=$(tty); gpg %*"
