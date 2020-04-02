#!/bin/bash

BASEDIR="$(cd "$(dirname "$0")" && pwd)"
cd $BASEDIR

PRODUCT_VERSION="5.4.1"
BUILD_NUMBER="1"
LAST_VERSION_TAG=$(git describe --abbrev=0 --tags)

version=$(echo $LAST_VERSION_TAG | sed -e "s/v//")
major=$(echo $version | cut -d. -f1)
minor=$(echo $version | cut -d. -f2)
maintenance=$(echo $version | cut -d. -f3)
build=$(echo $version | cut -d. -f4)

PRODUCT_VERSION="$major.$minor.$maintenance"
BUILD_NUMBER=$build


# Helpers

CreateDir() {
    if [ ! -d $1 ]; then
        mkdir -p $1
    fi
}

CopyScriptTo() {
    DOCUMENTS_PATH=$1"/documents"
    SPREADSHEETS_PATH=$1"/spreadsheets"
    PRESENTATIONS_PATH=$1"/presentations"

    CreateDir $DOCUMENTS_PATH
    CreateDir $SPREADSHEETS_PATH
    CreateDir $PRESENTATIONS_PATH

    printf $'\r' > temp.txt

    echo "Copy: word sdk-all.js"
    cat "../../web-apps/vendor/xregexp/xregexp-all-min.js" "temp.txt" "../../web-apps/vendor/underscore/underscore-min.js" "temp.txt" "../common/Native/native.js" "temp.txt" "../common/Native/Wrappers/common.js" "temp.txt" "../common/Native/jquery_native.js" "temp.txt" > "banners.js"

    cat "banners.js" "../deploy/sdkjs/word/sdk-all-min.js" "../deploy/sdkjs/word/sdk-all.js" > $DOCUMENTS_PATH"/script.bin"
    rm -f -r "banners.js"

    echo "Copy: cell sdk-all.js"
    cat "../../web-apps/vendor/xregexp/xregexp-all-min.js" "temp.txt" "../../web-apps/vendor/underscore/underscore-min.js" "temp.txt" "../common/Native/native.js" "temp.txt" "../cell/native/common.js" "temp.txt" "../common/Native/jquery_native.js" "temp.txt" > "banners.js"
    cat "banners.js" "../deploy/sdkjs/cell/sdk-all-min.js" "../deploy/sdkjs/cell/sdk-all.js" > $SPREADSHEETS_PATH"/script.bin"
    rm -f -r "banners.js"

    echo "Copy: slide sdk-all.js"
    cat "../../web-apps/vendor/xregexp/xregexp-all-min.js" "temp.txt" "../../web-apps/vendor/underscore/underscore-min.js" "temp.txt" "../common/Native/native.js" "temp.txt" "../common/Native/Wrappers/common.js" "temp.txt" "../common/Native/jquery_native.js" "temp.txt" > "banners.js"
    cat "banners.js" "../deploy/sdkjs/slide/sdk-all-min.js" "../deploy/sdkjs/slide/sdk-all.js" > $PRESENTATIONS_PATH"/script.bin"
    rm -f -r "banners.js"

    rm -f -r "temp.txt"

    echo "Copy: sdk version mark"
    printf $PRODUCT_VERSION.$BUILD_NUMBER > $1"/documents/sdk.version"
    printf $PRODUCT_VERSION.$BUILD_NUMBER > $1"/spreadsheets/sdk.version"
    printf $PRODUCT_VERSION.$BUILD_NUMBER > $1"/presentations/sdk.version"
}

echo "----------------------------------------"
echo "Prepare to compile"
echo "----------------------------------------"

npm install

echo "----------------------------------------"
echo "Compile SDKJS"
echo "----------------------------------------"

PRODUCT_VERSION=$PRODUCT_VERSION BUILD_NUMBER=$BUILD_NUMBER grunt --level=WHITESPACE_ONLY --mobile=true #--level=ADVANCED | WHITESPACE_ONLY

if [ -z "$1" ] ; then
    # iOS
    echo "----------------------------------------"
    echo "Copy SDKJS for iOS app"
    echo "----------------------------------------"

    IOS_PATH="../../mobile-apps/ios/Vendor/ONLYOFFICE"

    if [ -d $IOS_PATH ]; then
        CopyScriptTo $IOS_PATH"/SDKData"
    fi

    # Android
    echo "----------------------------------------"
    echo "Copy SDKJS for Android app"
    echo "----------------------------------------"

    ANDROID_PATH="../../documents-android/native/src/main"

    if [ -d $ANDROID_PATH ]; then
        CopyScriptTo $ANDROID_PATH"/assets"
    fi
else
    # Custom path
    echo "----------------------------------------"
    echo "Copy SDKJS to custom path - $1"
    echo "----------------------------------------"
    CopyScriptTo "$1"
fi

echo "Done"
