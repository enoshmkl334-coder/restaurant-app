@echo off
echo Running database migration...
echo.

REM Update this path if your MySQL is installed elsewhere
set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

REM Check if MySQL exists at the default path
if not exist %MYSQL_PATH% (
    echo MySQL not found at default location.
    echo Please run this SQL manually in MySQL Workbench:
    echo.
    type project\backend\migrations\003_allow_null_password_for_google_users.sql
    echo.
    pause
    exit /b
)

REM Run the migration
%MYSQL_PATH% -u root -p@Enosh123 rom < project\backend\migrations\003_allow_null_password_for_google_users.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Migration completed successfully!
    echo.
    echo Now restart your backend server and try Google login again.
) else (
    echo.
    echo ❌ Migration failed. Please run it manually in MySQL Workbench.
)

pause
