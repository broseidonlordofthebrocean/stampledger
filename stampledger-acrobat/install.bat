@echo off
setlocal enabledelayedexpansion

:: ===========================================================================
:: StampLedger for Adobe Acrobat - Installer
:: Copies StampLedger.js to the Acrobat JavaScripts folder.
:: ===========================================================================

title StampLedger for Adobe Acrobat - Installer

echo.
echo  ============================================
echo   StampLedger for Adobe Acrobat - Installer
echo  ============================================
echo.

:: -----------------------------------------------------------------------
:: Locate the source file (StampLedger.js next to this batch file)
:: -----------------------------------------------------------------------

set "SCRIPT_DIR=%~dp0"
set "SOURCE_FILE=%SCRIPT_DIR%StampLedger.js"

if not exist "%SOURCE_FILE%" (
    echo  [ERROR] StampLedger.js not found in:
    echo          %SCRIPT_DIR%
    echo.
    echo  Please ensure StampLedger.js is in the same folder as this installer.
    echo.
    goto :failure
)

echo  Source: %SOURCE_FILE%
echo.

:: -----------------------------------------------------------------------
:: Search for Acrobat JavaScripts folders
:: Common locations for Acrobat DC, 2020, 2017, Reader DC, Reader 2020
:: -----------------------------------------------------------------------

set "FOUND_COUNT=0"
set "INSTALL_PATH="

:: User-level JavaScripts directories (preferred - no admin required)
set "SEARCH_PATHS="
set "SEARCH_PATHS=%SEARCH_PATHS%;%APPDATA%\Adobe\Acrobat\DC\JavaScripts"
set "SEARCH_PATHS=%SEARCH_PATHS%;%APPDATA%\Adobe\Acrobat\2024\JavaScripts"
set "SEARCH_PATHS=%SEARCH_PATHS%;%APPDATA%\Adobe\Acrobat\2020\JavaScripts"
set "SEARCH_PATHS=%SEARCH_PATHS%;%APPDATA%\Adobe\Acrobat\2017\JavaScripts"
set "SEARCH_PATHS=%SEARCH_PATHS%;%APPDATA%\Adobe\Acrobat\11.0\JavaScripts"
set "SEARCH_PATHS=%SEARCH_PATHS%;%APPDATA%\Adobe\Acrobat\Reader\DC\JavaScripts"
set "SEARCH_PATHS=%SEARCH_PATHS%;%APPDATA%\Adobe\Acrobat\Reader DC\JavaScripts"

:: Application-level directories (may require admin)
set "SEARCH_PATHS=%SEARCH_PATHS%;%ProgramFiles%\Adobe\Acrobat DC\Acrobat\Javascripts"
set "SEARCH_PATHS=%SEARCH_PATHS%;%ProgramFiles%\Adobe\Acrobat 2024\Acrobat\Javascripts"
set "SEARCH_PATHS=%SEARCH_PATHS%;%ProgramFiles%\Adobe\Acrobat 2020\Acrobat\Javascripts"
set "SEARCH_PATHS=%SEARCH_PATHS%;%ProgramFiles%\Adobe\Acrobat 2017\Acrobat\Javascripts"
set "SEARCH_PATHS=%SEARCH_PATHS%;%ProgramFiles(x86)%\Adobe\Acrobat DC\Acrobat\Javascripts"
set "SEARCH_PATHS=%SEARCH_PATHS%;%ProgramFiles(x86)%\Adobe\Acrobat 2024\Acrobat\Javascripts"
set "SEARCH_PATHS=%SEARCH_PATHS%;%ProgramFiles(x86)%\Adobe\Acrobat 2020\Acrobat\Javascripts"
set "SEARCH_PATHS=%SEARCH_PATHS%;%ProgramFiles(x86)%\Adobe\Acrobat 2017\Acrobat\Javascripts"
set "SEARCH_PATHS=%SEARCH_PATHS%;%ProgramFiles(x86)%\Adobe\Acrobat Reader DC\Reader\Javascripts"
set "SEARCH_PATHS=%SEARCH_PATHS%;%ProgramFiles%\Adobe\Acrobat Reader DC\Reader\Javascripts"

echo  Searching for Adobe Acrobat installations...
echo.

set "FOUND_PATHS="

for %%P in (%SEARCH_PATHS%) do (
    :: Check if the parent directory exists (the Acrobat installation)
    set "CHECK_PATH=%%~P"
    set "PARENT_PATH=%%~dpP"

    :: For user-level paths, check if the parent Acrobat folder exists
    :: For app-level paths, check the Javascripts folder itself or its parent
    if exist "%%~dpP" (
        set /a FOUND_COUNT+=1
        set "FOUND_!FOUND_COUNT!=%%~P"
        echo  [!FOUND_COUNT!] %%~P
        if exist "%%~P" (
            echo      ^(folder exists^)
        ) else (
            echo      ^(will be created^)
        )
    )
)

:: Also check if there are Acrobat folders we can detect dynamically
:: Search %APPDATA%\Adobe\Acrobat\ for any version
if exist "%APPDATA%\Adobe\Acrobat\" (
    for /d %%D in ("%APPDATA%\Adobe\Acrobat\*") do (
        set "DYN_PATH=%%D\JavaScripts"
        set "ALREADY_FOUND=0"

        :: Check if we already found this path
        for /l %%I in (1,1,!FOUND_COUNT!) do (
            if "!FOUND_%%I!"=="!DYN_PATH!" set "ALREADY_FOUND=1"
        )

        if "!ALREADY_FOUND!"=="0" (
            set /a FOUND_COUNT+=1
            set "FOUND_!FOUND_COUNT!=!DYN_PATH!"
            echo  [!FOUND_COUNT!] !DYN_PATH!
            if exist "!DYN_PATH!" (
                echo      ^(folder exists^)
            ) else (
                echo      ^(will be created^)
            )
        )
    )
)

echo.

:: -----------------------------------------------------------------------
:: Handle results
:: -----------------------------------------------------------------------

if %FOUND_COUNT%==0 (
    echo  No Adobe Acrobat installations detected.
    echo.
    echo  You can manually install StampLedger.js by copying it to your
    echo  Acrobat JavaScripts folder. Common locations:
    echo.
    echo    %APPDATA%\Adobe\Acrobat\DC\JavaScripts\
    echo    %ProgramFiles%\Adobe\Acrobat DC\Acrobat\Javascripts\
    echo.
    echo  Or specify a custom path below.
    echo.
    set /p "CUSTOM_PATH=  Enter full path to JavaScripts folder (or press Enter to exit): "
    if "!CUSTOM_PATH!"=="" goto :failure

    set "INSTALL_PATH=!CUSTOM_PATH!"
    goto :install
)

if %FOUND_COUNT%==1 (
    set "INSTALL_PATH=!FOUND_1!"
    echo  Found one Acrobat installation.
    echo  Installing to: !INSTALL_PATH!
    echo.
    set /p "CONFIRM=  Proceed? (Y/N): "
    if /i "!CONFIRM!" neq "Y" (
        echo.
        echo  Installation cancelled.
        goto :end
    )
    goto :install
)

:: Multiple installations found - let user choose
echo  Multiple Acrobat installations found.
echo  Enter the number of the installation to use,
echo  or 'A' to install to ALL locations:
echo.
set /p "CHOICE=  Choice: "

if /i "%CHOICE%"=="A" (
    goto :install_all
)

set /a "CHOICE_NUM=%CHOICE%" 2>nul
if %CHOICE_NUM% LSS 1 (
    echo.
    echo  Invalid choice.
    goto :failure
)
if %CHOICE_NUM% GTR %FOUND_COUNT% (
    echo.
    echo  Invalid choice.
    goto :failure
)

set "INSTALL_PATH=!FOUND_%CHOICE_NUM%!"
goto :install


:: -----------------------------------------------------------------------
:: Install to all found locations
:: -----------------------------------------------------------------------

:install_all
echo.
set "ALL_SUCCESS=1"
for /l %%I in (1,1,%FOUND_COUNT%) do (
    set "CURR_PATH=!FOUND_%%I!"
    echo  Installing to: !CURR_PATH!

    if not exist "!CURR_PATH!" (
        mkdir "!CURR_PATH!" 2>nul
        if errorlevel 1 (
            echo    [SKIP] Could not create directory. May need admin rights.
            set "ALL_SUCCESS=0"
        )
    )

    if exist "!CURR_PATH!" (
        copy /y "%SOURCE_FILE%" "!CURR_PATH!\StampLedger.js" >nul 2>&1
        if errorlevel 1 (
            echo    [FAIL] Could not copy file. May need admin rights.
            set "ALL_SUCCESS=0"
        ) else (
            echo    [OK]   StampLedger.js installed.
        )
    )
)
echo.
if "%ALL_SUCCESS%"=="1" (
    goto :success
) else (
    echo  Some installations failed. You may need to run this installer
    echo  as Administrator for system-level Acrobat folders.
    echo.
    echo  Right-click install.bat and select "Run as administrator".
    echo.
    goto :partial_success
)


:: -----------------------------------------------------------------------
:: Install to single location
:: -----------------------------------------------------------------------

:install
echo.

:: Create the JavaScripts folder if it does not exist
if not exist "%INSTALL_PATH%" (
    echo  Creating directory: %INSTALL_PATH%
    mkdir "%INSTALL_PATH%" 2>nul
    if errorlevel 1 (
        echo.
        echo  [ERROR] Could not create directory.
        echo  You may need to run this installer as Administrator.
        echo  Right-click install.bat and select "Run as administrator".
        echo.
        goto :failure
    )
)

:: Check for existing installation
if exist "%INSTALL_PATH%\StampLedger.js" (
    echo  An existing StampLedger.js was found. It will be overwritten.
    echo.

    :: Back up the old file
    set "BACKUP_NAME=StampLedger.js.bak.%DATE:~-4%%DATE:~4,2%%DATE:~7,2%"
    copy /y "%INSTALL_PATH%\StampLedger.js" "%INSTALL_PATH%\!BACKUP_NAME!" >nul 2>&1
    if not errorlevel 1 (
        echo  Backup saved as: !BACKUP_NAME!
    )
)

:: Copy the file
copy /y "%SOURCE_FILE%" "%INSTALL_PATH%\StampLedger.js" >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [ERROR] Failed to copy StampLedger.js.
    echo  You may need to run this installer as Administrator.
    echo  Right-click install.bat and select "Run as administrator".
    echo.
    goto :failure
)

goto :success


:: -----------------------------------------------------------------------
:: Result messages
:: -----------------------------------------------------------------------

:success
echo.
echo  ============================================
echo   Installation Successful!
echo  ============================================
echo.
echo  StampLedger.js has been installed.
echo.
echo  IMPORTANT: Please restart Adobe Acrobat for
echo  the extension to take effect.
echo.
echo  After restarting, you will find a new
echo  "StampLedger" submenu under Edit in the
echo  Acrobat menu bar.
echo.
echo  If the menu does not appear, ensure that
echo  JavaScript is enabled in Acrobat:
echo    Edit ^> Preferences ^> JavaScript
echo    Check "Enable Acrobat JavaScript"
echo.
echo  You may also need to allow network access:
echo    Edit ^> Preferences ^> Security (Enhanced)
echo    Add portal.stampledger.com to privileged
echo    locations, or adjust Internet access settings.
echo.
goto :end

:partial_success
echo  Some installations succeeded. Please restart
echo  Adobe Acrobat and check the Edit menu for the
echo  StampLedger submenu.
echo.
goto :end

:failure
echo.
echo  ============================================
echo   Installation was not completed.
echo  ============================================
echo.
echo  You can manually install by copying:
echo    %SOURCE_FILE%
echo.
echo  To your Acrobat JavaScripts folder, typically:
echo    %APPDATA%\Adobe\Acrobat\DC\JavaScripts\
echo.
goto :end

:end
echo.
echo  Press any key to exit...
pause >nul
endlocal
exit /b 0
