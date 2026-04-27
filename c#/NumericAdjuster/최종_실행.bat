@echo off
chcp 65001 >nul
echo ========================================
echo C# 수치 조정 프로그램 실행
echo ========================================
echo.

REM .NET SDK 확인
echo [1/3] .NET SDK 확인 중...
dotnet --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ .NET SDK가 설치되어 있지 않습니다.
    echo.
    echo https://dotnet.microsoft.com/download 에서 설치해주세요.
    echo 설치 후 컴퓨터를 재시작하세요.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('dotnet --version') do set DOTNET_VERSION=%%i
echo ✓ .NET SDK %DOTNET_VERSION% 확인됨
echo.

REM 빌드
echo [2/3] 프로그램 빌드 중...
dotnet build -c Release >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ 빌드 실패
    echo.
    echo 상세 오류 확인:
    dotnet build
    echo.
    pause
    exit /b 1
)
echo ✓ 빌드 완료
echo.

REM 실행
echo [3/3] 프로그램 실행 중...
echo.
echo ========================================
echo 프로그램이 실행됩니다!
echo 창을 닫으려면 프로그램을 종료하세요.
echo ========================================
echo.

dotnet run

echo.
echo 프로그램이 종료되었습니다.
pause
