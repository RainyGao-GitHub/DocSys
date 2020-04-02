QT       -= core gui

TARGET = freetype_common
TEMPLATE = lib

CONFIG += staticlib

DEFINES += _LIB
DEFINES += _CRT_SECURE_NO_WARNINGS
DEFINES += FT2_BUILD_LIBRARY

DEFINES -= UNICODE
DEFINES -= _UNICODE

INCLUDEPATH += $$PWD/../freetype-2.9.1/include
INCLUDEPATH += $$PWD/../freetype-2.9.1/include/freetype
INCLUDEPATH += $$PWD/../freetype-2.9.1/include/freetype/internal

SOURCES += freetype.c
