@ECHO OFF

ECHO Changing directory to rs-cart-api
cd rs-cart-api

@REM ECHO NPM INSTALL
CALL npm install --legacy-peer-deps

ECHO NPM BUILD
CALL npm run build

CALL 7z a -r ../build/rs-cart-api.zip ./dist/*.* ./node_modules
@REM CALL cdk deploy